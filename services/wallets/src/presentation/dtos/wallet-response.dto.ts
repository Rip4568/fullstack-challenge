import { Wallet } from "../../domain/wallet.entity";

/**
 * DTO de resposta que representa o saldo detalhado em uma moeda específica.
 */
export class BalanceResponseDto {
  /** Identificador único do saldo. */
  id!: string;
  /** Identificador da carteira associada. */
  walletId!: string;
  /** Código da moeda (BRL, USD, BTC, ETH). */
  currency!: string;
  /** Valor bruto na menor unidade física da moeda (cents, Satoshis, Wei). */
  amount!: number;
  /** Valor formatado como número real/float decimal de fácil leitura. */
  amountFormatted!: number;
  /** Estimativa aproximada de mercado em dólares americanos (USD). */
  estimatedUsdValue!: number;
}

/**
 * DTO de resposta que representa a carteira consolidada do jogador.
 */
export class WalletResponseDto {
  /** Identificador único da carteira. */
  id!: string;
  /** Identificador único do jogador. */
  playerId!: string;
  /** Listagem de saldos detalhados por moeda. */
  balances!: BalanceResponseDto[];
  /** Data de criação do registro. */
  createdAt!: Date;
  /** Data da última atualização de saldo. */
  updatedAt!: Date;

  /**
   * Converte uma entidade de domínio Wallet para o DTO de resposta,
   * calculando as formatações e estimativas cambiais de forma estática.
   *
   * @param wallet Entidade de domínio Wallet carregada.
   * @returns O DTO estruturado e serializável para JSON.
   */
  static fromEntity(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balances: wallet.balances.map((b) => {
        const amountNum = Number(b.amount);
        let amountFormatted = amountNum;
        let estimatedUsdValue = 0;

        switch (b.currency) {
          case "BRL":
            amountFormatted = amountNum / 100;
            estimatedUsdValue = amountFormatted * 0.18; // 1 BRL = 0.18 USD (mock rate)
            break;
          case "USD":
            amountFormatted = amountNum / 100;
            estimatedUsdValue = amountFormatted; // 1:1
            break;
          case "BTC":
            amountFormatted = amountNum / 100000000; // 10^8 Satoshis = 1 BTC
            estimatedUsdValue = amountFormatted * 65000; // 1 BTC = $65,000 USD (mock rate)
            break;
          case "ETH":
            amountFormatted = amountNum / 1000000000000000000; // 10^18 Wei = 1 ETH
            estimatedUsdValue = amountFormatted * 3500; // 1 ETH = $3,500 USD (mock rate)
            break;
          default:
            amountFormatted = amountNum;
            estimatedUsdValue = 0;
        }

        // Round USD estimates to 2 decimal places
        estimatedUsdValue = Math.floor(estimatedUsdValue * 100) / 100;

        return {
          id: b.id,
          walletId: b.walletId,
          currency: b.currency,
          amount: amountNum,
          amountFormatted,
          estimatedUsdValue,
        };
      }),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
