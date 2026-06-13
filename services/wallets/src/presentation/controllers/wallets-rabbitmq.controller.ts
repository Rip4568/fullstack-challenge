import { Controller, Inject } from "@nestjs/common";
import { EventPattern, Payload, ClientProxy } from "@nestjs/microservices";
import { WalletApplicationService } from "../../application/services/wallet.application-service";
import { InsufficientBalanceException } from "../../domain/wallet.entity";

interface DebitPayload {
  betId: string;
  playerId: string;
  amount: string; // BigInt strings
  currency: string;
  username: string;
}

interface CreditPayload {
  betId: string;
  playerId: string;
  amount: string;
  currency: string;
  referenceType: string;
}

/**
 * Controlador RabbitMQ encarregado de escutar e processar mensagens assíncronas
 * direcionadas ao microsserviço de carteiras (Wallet Service) via filas/exchanges do RabbitMQ.
 */
@Controller()
export class WalletsRabbitMqController {
  constructor(
    private readonly walletService: WalletApplicationService,
    @Inject("GAMES_SERVICE") private readonly gamesClient: ClientProxy,
  ) {}

  /**
   * Processa a solicitação de débito na carteira do jogador ("wallet.debit").
   * Executa a dedução do saldo de forma atômica e envia a resposta correspondente
   * (sucesso ou falha por saldo insuficiente/erro) de volta ao Game Service.
   *
   * @param data Payload contendo ID do jogador, valor do débito, moeda e ID da aposta associada.
   */
  @EventPattern("wallet.debit")
  async handleDebit(@Payload() data: DebitPayload) {
    const amountBigInt = BigInt(data.amount);

    try {
      await this.walletService.debit(
        data.playerId,
        amountBigInt,
        data.currency,
        data.betId,
        "BET_PLACEMENT",
      );

      // Publish success back to Game Service
      this.gamesClient.emit("game.debit_success", {
        betId: data.betId,
        playerId: data.playerId,
      });
      console.log(
        `[Wallet Service] Debit success for betId=${data.betId}, playerId=${data.playerId}`,
      );
    } catch (error) {
      const reason =
        error instanceof InsufficientBalanceException
          ? "INSUFFICIENT_FUNDS"
          : "DEBIT_FAILED";
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Publish failure back to Game Service
      this.gamesClient.emit("game.debit_failed", {
        betId: data.betId,
        playerId: data.playerId,
        reason,
      });
      console.error(
        `[Wallet Service] Debit failed for betId=${data.betId}, playerId=${data.playerId}: ${errorMessage}`,
      );
    }
  }

  /**
   * Processa a solicitação de crédito na carteira do jogador ("wallet.credit").
   * Adiciona o saldo atômico e notifica o Game Service sobre a liquidação com sucesso do crédito.
   *
   * @param data Payload contendo ID do jogador, valor a creditar, moeda e ID de referência da transação.
   */
  @EventPattern("wallet.credit")
  async handleCredit(@Payload() data: CreditPayload) {
    const amountBigInt = BigInt(data.amount);

    try {
      await this.walletService.credit(
        data.playerId,
        amountBigInt,
        data.currency,
        data.betId,
        data.referenceType,
        "CREDIT",
      );

      // Notify Game Service about credit confirmation
      this.gamesClient.emit("game.credit_success", {
        betId: data.betId,
        playerId: data.playerId,
      });
      console.log(
        `[Wallet Service] Credit success for betId=${data.betId}, playerId=${data.playerId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[Wallet Service] Credit failed for betId=${data.betId}, playerId=${data.playerId}: ${errorMessage}`,
      );
    }
  }

  /**
   * Processa a solicitação de reembolso/estorno na carteira do jogador ("wallet.refund").
   * Credita de volta o valor debitado anteriormente caso a aposta tenha sido cancelada ou rejeitada.
   *
   * @param data Payload contendo ID do jogador, valor a reembolsar, moeda e ID de referência.
   */
  @EventPattern("wallet.refund")
  async handleRefund(@Payload() data: CreditPayload) {
    const amountBigInt = BigInt(data.amount);

    try {
      await this.walletService.credit(
        data.playerId,
        amountBigInt,
        data.currency,
        data.betId,
        "REFUND",
        "REFUND",
      );
      console.log(
        `[Wallet Service] Refund success for betId=${data.betId}, playerId=${data.playerId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[Wallet Service] Refund failed for betId=${data.betId}, playerId=${data.playerId}: ${errorMessage}`,
      );
    }
  }
}
