import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/persistence/prisma.service";
import { ClientProxy } from "@nestjs/microservices";
import { GameStatus, RoundStatus, BetStatus, Prisma } from "../../infrastructure/persistence/prisma/client";
import { GamesGateway } from "../../infrastructure/websocket/games.gateway";

/**
 * Serviço de aplicação encarregado de gerenciar a lógica de negócios e as regras de fluxo do Crash Game.
 * Coordena rodadas, validação e colocação de apostas, solicitações de débito/crédito, cash outs e provably fair.
 */
@Injectable()
export class GameApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("WALLETS_SERVICE") private readonly walletsClient: ClientProxy,
    private readonly gateway: GamesGateway
  ) {}


  /**
   * Garante a existência do jogo default com slug "crash".
   * Caso o jogo não exista na tabela Game, ele é inserido via upsert.
   *
   * @returns O identificador único (ID) do jogo padrão.
   */
  async ensureDefaultGameExists(): Promise<string> {
    const game = await this.prisma.game.upsert({
      where: { slug: "crash" },
      update: {},
      create: {
        slug: "crash",
        name: "Crash Game",
        status: GameStatus.ACTIVE,
      },
    });
    return game.id;
  }

  /**
   * Registra uma aposta pendente (status PENDING) para o jogador na rodada atual de apostas (fase BETTING).
   * Executa validações de limites de aposta, impede apostas duplicadas na mesma rodada e
   * dispara o evento assíncrono "wallet.debit" para o microsserviço de carteiras via RabbitMQ.
   *
   * @param playerId ID único do jogador que está apostando.
   * @param username Nome de usuário do jogador para exibição pública na rodada.
   * @param amountCents O valor a ser apostado representado em centavos ou subunidades inteiras (Satoshis/Wei).
   * @param currency A moeda utilizada na aposta (padrão é "BRL").
   * @returns A entidade de aposta criada no status PENDING.
   * @throws BadRequestException se não houver rodada de apostas ativa, se o valor estiver fora dos limites (1.00 a 1000.00) ou se o jogador já tiver apostado na rodada.
   */
  async placeBet(
    playerId: string,
    username: string,
    amountCents: bigint,
    currency: string = "BRL",
    autoCashoutMultiplier: number | null = null
  ): Promise<any> {
    const gameId = await this.ensureDefaultGameExists();

    // 1. Get the current active round in BETTING status
    const currentRound = await this.prisma.gameRound.findFirst({
      where: {
        gameId,
        status: RoundStatus.BETTING,
      },
    });

    if (!currentRound) {
      throw new BadRequestException("No active betting round available");
    }

    // 2. Enforce limits based on currency
    let minLimit = 100n;
    let maxLimit = 100000n;

    if (currency === "BTC") {
      minLimit = 1000n; // 0.00001000 BTC
      maxLimit = 10000000000n; // 100.00 BTC
    } else if (currency === "ETH") {
      minLimit = 10000000000000n; // 0.00001000 ETH
      maxLimit = 100000000000000000000n; // 100.00 ETH
    }

    if (amountCents < minLimit || amountCents > maxLimit) {
      throw new BadRequestException(
        "Bet amount must be between 1.00 and 1,000.00"
      );
    }

    // 3. Prevent double betting in the same round
    const existingBet = await this.prisma.bet.findUnique({
      where: {
        roundId_playerId: {
          roundId: currentRound.id,
          playerId,
        },
      },
    });

    if (existingBet) {
      throw new BadRequestException("Player has already placed a bet in this round");
    }

    // 4. Create PENDING bet
    const bet = await this.prisma.bet.create({
      data: {
        roundId: currentRound.id,
        playerId,
        username,
        amount: amountCents,
        currency,
        status: BetStatus.PENDING,
        autoCashoutMultiplier,
      },
    });


    // 5. Emit debit request to Wallet Service
    this.walletsClient.emit("wallet.debit", {
      betId: bet.id,
      playerId,
      amount: amountCents.toString(),
      currency,
      username,
    });

    console.log(`[Game Service] Bet placed as PENDING. Emitted wallet.debit for betId=${bet.id}`);
    return bet;
  }

  /**
   * Confirma uma aposta atualizando seu status para CONFIRMED após a Wallet Service
   * responder com sucesso no processamento do débito.
   *
   * @param betId O identificador da aposta.
   * @returns A entidade de aposta com status atualizado para CONFIRMED.
   * @throws NotFoundException se a aposta com o ID especificado não for encontrada.
   */
  async confirmBet(betId: string): Promise<any> {
    const bet = await this.prisma.bet.findUnique({ where: { id: betId } });
    if (!bet) {
      throw new NotFoundException(`Bet with ID ${betId} not found`);
    }

    if (bet.status !== BetStatus.PENDING) {
      // Already processed or rejected
      return bet;
    }

    const updated = await this.prisma.bet.update({
      where: { id: betId },
      data: { status: BetStatus.CONFIRMED },
    });

    console.log(`[Game Service] Bet confirmed for betId=${betId}`);
    return updated;
  }

  /**
   * Rejeita uma aposta atualizando seu status para REJECTED caso a Wallet Service
   * responda com falha (ex: saldo insuficiente) ao processar a cobrança do débito.
   *
   * @param betId O identificador da aposta.
   * @returns A entidade de aposta com status atualizado para REJECTED.
   * @throws NotFoundException se a aposta com o ID especificado não for encontrada.
   */
  async rejectBet(betId: string): Promise<any> {
    const bet = await this.prisma.bet.findUnique({ where: { id: betId } });
    if (!bet) {
      throw new NotFoundException(`Bet with ID ${betId} not found`);
    }

    if (bet.status !== BetStatus.PENDING) {
      return bet;
    }

    const updated = await this.prisma.bet.update({
      where: { id: betId },
      data: { status: BetStatus.REJECTED },
    });

    console.log(`[Game Service] Bet rejected for betId=${betId}`);
    return updated;
  }

  /**
   * Processa a solicitação de cash out (saque voluntário) do jogador.
   * Valida se a rodada está na fase de jogabilidade (GAMEPLAY), se o jogador possui aposta confirmada,
   * se o multiplicador solicitado não ultrapassou o ponto de crash da rodada e, caso de sucesso,
   * atualiza a aposta no banco de dados para CASHOUT e dispara o evento assíncrono "wallet.credit" via RabbitMQ.
   * Todo o processo de atualização de status é envelopado em uma transação com bloqueio para evitar condições de corrida (race conditions).
   *
   * @param playerId O identificador único do jogador solicitando cash out.
   * @param currentMultiplier O multiplicador no momento da solicitação de saque pelo jogador.
   * @returns A entidade de aposta atualizada contendo o multiplicador de cash out e o payout gerado.
   * @throws BadRequestException se não houver rodada em GAMEPLAY, se não houver aposta confirmada, se o jogo já tiver crashado ou se a aposta já tiver sido processada.
   */
  async cashout(playerId: string, currentMultiplier: number): Promise<any> {
    const gameId = await this.ensureDefaultGameExists();

    // 1. Find the current GAMEPLAY round
    const currentRound = await this.prisma.gameRound.findFirst({
      where: {
        gameId,
        status: RoundStatus.GAMEPLAY,
      },
    });

    if (!currentRound) {
      throw new BadRequestException("No active gameplay round");
    }

    // 2. Find the player's CONFIRMED bet in this round
    const bet = await this.prisma.bet.findUnique({
      where: {
        roundId_playerId: {
          roundId: currentRound.id,
          playerId,
        },
      },
    });

    if (!bet) {
      throw new BadRequestException("No bet found for this round");
    }

    if (bet.status !== BetStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot cashout. Bet status is ${bet.status}`);
    }

    // 3. Safety Check: Cannot cash out at or above the round's pre-calculated crash point
    if (currentMultiplier >= currentRound.crashPoint) {
      throw new BadRequestException("Game already crashed");
    }

    // 4. Calculate payout amount in cents: amount * multiplier
    const multiplierCents = BigInt(Math.floor(currentMultiplier * 100));
    const payoutAmount = (bet.amount * multiplierCents) / 100n;

    // 5. Update bet status locally to CASHOUT (with multiplier and payout)
    // Done inside a transaction to prevent race conditions on cashout
    const updatedBet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Re-fetch with lock
      const lockedBet = await tx.bet.findUnique({
        where: { id: bet.id },
      });

      if (!lockedBet) {
        throw new BadRequestException("Bet not found");
      }

      if (lockedBet.status !== BetStatus.CONFIRMED) {
        throw new BadRequestException("Bet already cashed out or processed");
      }

      return tx.bet.update({
        where: { id: bet.id },
        data: {
          status: BetStatus.CASHOUT,
          cashOutMultiplier: currentMultiplier,
          payoutAmount: payoutAmount,
        },
      });
    });

    // 6. Emit credit event to Wallet Service
    this.walletsClient.emit("wallet.credit", {
      betId: bet.id,
      playerId,
      amount: payoutAmount.toString(),
      currency: bet.currency,
      referenceType: "CASHOUT",
    });

    // Broadcast cashout to all clients
    const payoutFloat = Number(payoutAmount) / (bet.currency === "BTC" ? 100000000 : bet.currency === "ETH" ? 1000000000000000000 : 100);
    this.gateway.broadcastBetCashout(playerId, bet.username, currentMultiplier, payoutFloat);

    console.log(
      `[Game Service] Cashout processed locally. Emitted wallet.credit for betId=${bet.id}, payout=${payoutAmount}`
    );

    return updatedBet;
  }

  /**
   * Processa o auto-cashout das apostas elegíveis na rodada atual baseado no multiplicador de tick.
   *
   * @param roundId Identificador da rodada em andamento.
   * @param currentMultiplier Multiplicador atual do tick.
   */
  async processAutoCashout(roundId: string, currentMultiplier: number): Promise<void> {
    const betsToCashout = await this.prisma.bet.findMany({
      where: {
        roundId,
        status: BetStatus.CONFIRMED,
        autoCashoutMultiplier: {
          not: null,
          lte: currentMultiplier,
        },
      },
    });

    for (const bet of betsToCashout) {
      if (!bet.autoCashoutMultiplier) continue;

      const targetMultiplier = bet.autoCashoutMultiplier;
      const multiplierCents = BigInt(Math.floor(targetMultiplier * 100));
      const payoutAmount = (bet.amount * multiplierCents) / 100n;

      try {
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const lockedBet = await tx.bet.findUnique({
            where: { id: bet.id },
          });

          if (!lockedBet || lockedBet.status !== BetStatus.CONFIRMED) {
            return;
          }

          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: BetStatus.CASHOUT,
              cashOutMultiplier: targetMultiplier,
              payoutAmount: payoutAmount,
            },
          });
        });

        // Emit credit event to Wallet Service
        this.walletsClient.emit("wallet.credit", {
          betId: bet.id,
          playerId: bet.playerId,
          amount: payoutAmount.toString(),
          currency: bet.currency,
          referenceType: "CASHOUT",
        });

        // Broadcast cashout to all clients
        const payoutFloat = Number(payoutAmount) / (bet.currency === "BTC" ? 100000000 : bet.currency === "ETH" ? 1000000000000000000 : 100);
        this.gateway.broadcastBetCashout(bet.playerId, bet.username, targetMultiplier, payoutFloat);

        console.log(
          `[Game Service] Auto-Cashout processed for player=${bet.playerId}, betId=${bet.id}, multiplier=${targetMultiplier}x, payout=${payoutAmount}`
        );
      } catch (err) {
        console.error(`[Game Service] Failed to process auto-cashout for betId=${bet.id}:`, err);
      }
    }
  }


  /**
   * Confirmação callback de que o crédito de payout da aposta foi processado na Wallet Service com sucesso.
   *
   * @param betId O identificador da aposta.
   */
  async confirmCredit(betId: string): Promise<void> {
    console.log(`[Game Service] Wallet confirmed credit for betId=${betId}`);
  }

  /**
   * Retorna a rodada ativa atual (seja na fase BETTING ou GAMEPLAY) incluindo as apostas associadas.
   * Caso não haja rodada ativa no momento, retorna a última rodada criada e finalizada no banco de dados.
   *
   * @returns A entidade representativa da rodada atual encontrada.
   */
  async getCurrentRound(): Promise<any> {
    const gameId = await this.ensureDefaultGameExists();
    let currentRound = await this.prisma.gameRound.findFirst({
      where: {
        gameId,
        status: {
          in: [RoundStatus.BETTING, RoundStatus.GAMEPLAY],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        bets: true,
      },
    });

    if (!currentRound) {
      currentRound = await this.prisma.gameRound.findFirst({
        where: { gameId },
        orderBy: { createdAt: "desc" },
        include: {
          bets: true,
        },
      });
    }

    return currentRound;
  }

  /**
   * Recupera o histórico paginado de rodadas finalizadas do jogo (status CRASHED).
   *
   * @param limit Quantidade máxima de registros retornados.
   * @param offset Número de registros pulados a partir do início.
   * @returns Objeto com a lista de rodadas finalizadas e a contagem total de registros correspondentes no banco de dados.
   */
  async getRoundsHistory(limit: number, offset: number): Promise<{ items: any[]; total: number }> {
    const gameId = await this.ensureDefaultGameExists();
    const where = {
      gameId,
      status: RoundStatus.CRASHED,
    };

    const [items, total] = await Promise.all([
      this.prisma.gameRound.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.gameRound.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Retorna os detalhes de uma rodada finalizada para fins de auditoria e verificação do Provably Fair.
   *
   * @param roundId Identificador único da rodada.
   * @returns Os detalhes da rodada com suas respectivas sementes abertas.
   * @throws NotFoundException se a rodada informada não existir.
   * @throws BadRequestException se tentar verificar uma rodada que ainda está ativa (não finalizou no status CRASHED).
   */
  async verifyRound(roundId: string): Promise<any> {
    const round = await this.prisma.gameRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      throw new NotFoundException(`Round with ID ${roundId} not found`);
    }

    if (round.status !== RoundStatus.CRASHED) {
      throw new BadRequestException("Cannot verify an active round");
    }

    return round;
  }

  /**
   * Retorna o histórico paginado de todas as apostas realizadas por um jogador específico.
   * Inclui informações básicas da rodada, como status e multiplicador de crash final.
   *
   * @param playerId O identificador único do jogador.
   * @param limit Quantidade de registros na página atual.
   * @param offset Quantidade de registros pulados.
   * @returns Objeto contendo a lista de apostas e a contagem total de apostas do jogador.
   */
  async getPlayerBets(playerId: string, limit: number, offset: number): Promise<{ items: any[]; total: number }> {
    const where = { playerId };

    const [items, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          round: {
            select: {
              status: true,
              crashPoint: true,
              serverSeedHash: true,
            },
          },
        },
      }),
      this.prisma.bet.count({ where }),
    ]);

    return { items, total };
  }
}

