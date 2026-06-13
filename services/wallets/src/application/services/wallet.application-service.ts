import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/persistence/prisma.service";
import { Wallet, Balance, InsufficientBalanceException } from "../../domain/wallet.entity";
import { TransactionType, Prisma, Balance as PrismaBalance } from "../../infrastructure/persistence/prisma/client";

@Injectable()
export class WalletApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém ou cria a carteira física de um jogador e seus respectivos saldos.
   * Executa uma inicialização preguiçosa (Lazy Initialization) criando a carteira e saldos
   * padrão (BRL, USD, BTC, ETH) com fundos iniciais de teste caso ainda não existam no banco de dados.
   *
   * @param playerId Identificador único do jogador (extraído do JWT).
   * @returns A entidade de domínio Wallet com seus saldos carregados.
   */
  async getOrCreateWallet(playerId: string): Promise<Wallet> {
    const walletExists = await this.prisma.wallet.findUnique({
      where: { playerId },
      include: { balances: true },
    });

    if (walletExists) {
      const balances = walletExists.balances.map(
        (b: PrismaBalance) => new Balance(b.id, b.walletId, b.currency, b.amount)
      );
      return new Wallet(walletExists.id, walletExists.playerId, balances, walletExists.createdAt, walletExists.updatedAt);
    }

    // inicialização Lazy da carteira + balances
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // checagem dupla paara verificar race conditions
      const doubleCheck = await tx.wallet.findUnique({
        where: { playerId },
        include: { balances: true },
      });

      if (doubleCheck) {
        const balances = doubleCheck.balances.map(
          (b: PrismaBalance) => new Balance(b.id, b.walletId, b.currency, b.amount)
        );
        return new Wallet(doubleCheck.id, doubleCheck.playerId, balances, doubleCheck.createdAt, doubleCheck.updatedAt);
      }

      const newWallet = await tx.wallet.create({
        data: { playerId },
      });

      // Seed de saldos iniciais de teste (BRL: 1.000, USD: 1.000, BTC: 1.5, ETH: 2.5)
      // Representado em suas menores unidades fracionárias (centavos, Satoshis, Wei)
      const currencies = [
        { currency: "BRL", amount: 100000n }, // $1,000.00
        { currency: "USD", amount: 100000n }, // $1,000.00
        { currency: "BTC", amount: 150000000n }, // popular em 1.5 BTC, assim ja treinamos e testamos a conversão para numeros. no controller da resposta incluir o valor disponivel na carteira e o valor em $ pra ficar facil tanto de visualização quanto de estimativa por parte do apostador
        { currency: "ETH", amount: 2500000000000000000n }, // o mesmo vale para o ETH, porem aqui vai ser 2.5 ETH. como não temos nenhuma api para ficar puxando dados com frequencia para saber o real preço do dolar e btc/eth. coloque um valor fechado em cada um.
        // pesquisar alguma api que possa disponibilizar o valor das moedas acima de maneira gratuita. salvar em cache temporario (redis talvez ou banco de dados) a cada 15 min (ou tempo maximo que api dpodera suportar de requisição, fallbacks devem ser confuigurados em caso de falha da api)
      ];

      const balanceRecords = await Promise.all(
        currencies.map((c) =>
          tx.balance.create({
            data: {
              walletId: newWallet.id,
              currency: c.currency,
              amount: c.amount,
            },
          })
        )
      );

      const balances = balanceRecords.map(
        (b: PrismaBalance) => new Balance(b.id, b.walletId, b.currency, b.amount)
      );

      return new Wallet(newWallet.id, newWallet.playerId, balances, newWallet.createdAt, newWallet.updatedAt);
    });
  }

  /**
   * Debita um valor de forma atômica de um saldo da carteira do jogador.
   * Utiliza bloqueio pessimista (SELECT FOR UPDATE) e transações ACID para garantir
   * consistência sob alta concorrência e evitar estouro de saldo (Double Spending).
   *
   * @param playerId Identificador único do jogador (extraído do JWT).
   * @param amount Valor a ser debitado (em bigint centavos/menor unidade).
   * @param currency Moeda da operação (BRL, USD, BTC, ETH).
   * @param referenceId Identificador de referência externa (betId) para checagem de idempotência.
   * @param referenceType Descritor do tipo de referência (ex: "BET_PLACEMENT").
   */
  async debit(
    playerId: string,
    amount: bigint,
    currency: string,
    referenceId: string,
    referenceType: string
  ): Promise<void> {
    if (amount <= 0n) {
      throw new Error("Debit amount must be greater than zero");
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({
        where: { playerId },
      });
      
      if (!wallet) {
        throw new Error(`Wallet not found for player ${playerId}`); // acredito que o ideal seria sempre usar o maximo que possivel ExceptionsHTTP e não simplesmente errors
      }

      // // o metodo FOR UPDATE do sql é valiosa aqui pq trava a consulta SQL de forma pessimista
      // evitar o maximo possivel o uso do queryRawUnsafe (a menos que esteja brigando com frequencia com os validadores do prisma)
      const balances: any[] = await tx.$queryRaw`
        SELECT * FROM balances 
        WHERE wallet_id = ${wallet.id} AND currency = ${currency} 
        LIMIT 1 
        FOR UPDATE
      `;

      if (balances.length === 0) {
        throw new Error(`Balance not found for currency ${currency}`);
      }

      const balanceRecord = balances[0];
      const balance = new Balance(
        balanceRecord.id,
        balanceRecord.wallet_id,
        balanceRecord.currency,
        balanceRecord.amount
      );

      // tudo certo ? vamos debitar
      balance.debit(amount);

      // 4. Check if transaction was already processed (idempotency safety check)
      // o banco de dados pode ficar MUITO GRANDE por causa do walletTransaction. muito importante ter chaves index para garantir velocidade de busca na pesquisa
      const existingTx = await tx.walletTransaction.findUnique({
        where: {
          referenceId_type: {
            referenceId,
            type: TransactionType.DEBIT,
          },
        },
      });

      if (existingTx) {
        return;
      }

      // Salva o novo saldo e insere a transação no Ledger
      await tx.balance.update({
        where: { id: balance.id },
        data: { amount: balance.amount },
      });

      await tx.walletTransaction.create({
        data: {
          balanceId: balance.id,
          amount: -amount,
          type: TransactionType.DEBIT,
          referenceType,
          referenceId,
        },
      });
    });
  }

  /**
   * Credita um valor de forma atômica e idempotente no saldo correspondente do jogador.
   * Se a carteira ou moeda não possuírem saldo inicial, cria a linha de saldo de forma dinâmica.
   *
   * @param playerId Identificador único do jogador (extraído do JWT).
   * @param amount Valor a ser creditado (em bigint centavos/menor unidade).
   * @param currency Moeda da operação (BRL, USD, BTC, ETH).
   * @param referenceId Identificador de referência externa (betId) para checagem de idempotência.
   * @param referenceType Descritor do tipo de referência (ex: "CASHOUT" ou "REFUND").
   * @param type Tipo de transação a registrar (CREDIT ou REFUND).
   */
  async credit(
    playerId: string,
    amount: bigint,
    currency: string,
    referenceId: string,
    referenceType: string,
    type: "CREDIT" | "REFUND" = "CREDIT"
  ): Promise<void> {
    if (amount <= 0n) {
      throw new Error("Credit amount must be greater than zero");
    }

    const prismaType = type === "REFUND" ? TransactionType.REFUND : TransactionType.CREDIT;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({
        where: { playerId },
      });
      if (!wallet) {
        throw new Error(`Wallet not found for player ${playerId}`);
      }

      // Bloqueio pessimista da linha de saldo correspondente
      const balances: any[] = await tx.$queryRaw`
        SELECT * FROM balances 
        WHERE wallet_id = ${wallet.id} AND currency = ${currency} 
        LIMIT 1 
        FOR UPDATE
      `;

      let balanceId: string;
      let currentAmount: bigint;

      if (balances.length === 0) {
        const newBalance = await tx.balance.create({
          data: {
            walletId: wallet.id,
            currency,
            amount: 0n,
          },
        });
        balanceId = newBalance.id;
        currentAmount = 0n;
      } else {
        balanceId = balances[0].id;
        currentAmount = balances[0].amount;
      }

      const balance = new Balance(balanceId, wallet.id, currency, currentAmount);

      // Executa o crédito na regra de negócio
      balance.credit(amount);

      // Verificação de duplicidade de transações para idempotência
      const existingTx = await tx.walletTransaction.findUnique({
        where: {
          referenceId_type: {
            referenceId,
            type: prismaType,
          },
        },
      });

      if (existingTx) {
        return;
      }

      // Salva o novo saldo e insere a transação no Ledger
      await tx.balance.update({
        where: { id: balance.id },
        data: { amount: balance.amount },
      });

      await tx.walletTransaction.create({
        data: {
          balanceId: balance.id,
          amount,
          type: prismaType,
          referenceType,
          referenceId,
        },
      });
    });
  }
}
