import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { GameApplicationService } from "../../application/services/game.application-service";
import { GamesGateway } from "../../infrastructure/websocket/games.gateway";

interface DebitSuccessPayload {
  betId: string;
  playerId: string;
}

interface DebitFailedPayload {
  betId: string;
  playerId: string;
  reason: string;
}

interface CreditSuccessPayload {
  betId: string;
  playerId: string;
}

/**
 * Controlador RabbitMQ responsável por processar eventos assíncronos recebidos do microsserviço de carteiras (Wallet Service).
 */
@Controller()
export class GamesRabbitMqController {
  constructor(
    private readonly gameService: GameApplicationService,
    private readonly gateway: GamesGateway
  ) {}

  /**
   * Processa o evento de débito bem-sucedido.
   * Confirma a aposta no banco de dados e notifica todos os clientes via WebSocket em tempo real.
   *
   * @param data Payload contendo o identificador da aposta (betId) e do jogador (playerId).
   */
  @EventPattern("game.debit_success")
  async handleDebitSuccess(@Payload() data: DebitSuccessPayload) {
    try {
      const bet = await this.gameService.confirmBet(data.betId);
      
      // Broadcast to all connected clients via WS
      const amountFloat = Number(bet.amount) / 100;
      this.gateway.broadcastBetPlaced(bet.playerId, bet.username, amountFloat);
      
      console.log(`[Game Service] Handled game.debit_success for betId=${data.betId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Game Service] Error handling game.debit_success for betId=${data.betId}: ${errorMessage}`);
    }
  }

  /**
   * Processa o evento de débito malsucedido (ex: saldo insuficiente).
   * Rejeita e invalida a aposta no banco de dados local.
   *
   * @param data Payload contendo o ID da aposta, jogador e o motivo da falha.
   */
  @EventPattern("game.debit_failed")
  async handleDebitFailed(@Payload() data: DebitFailedPayload) {
    try {
      await this.gameService.rejectBet(data.betId);
      console.log(`[Game Service] Handled game.debit_failed for betId=${data.betId}, reason=${data.reason}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Game Service] Error handling game.debit_failed for betId=${data.betId}: ${errorMessage}`);
    }
  }

  /**
   * Processa o evento de crédito bem-sucedido na carteira (payout de cash out).
   * Registra a confirmação de que os fundos foram creditados com sucesso na carteira do jogador.
   *
   * @param data Payload contendo o ID da aposta e do jogador.
   */
  @EventPattern("game.credit_success")
  async handleCreditSuccess(@Payload() data: CreditSuccessPayload) {
    try {
      await this.gameService.confirmCredit(data.betId);
      console.log(`[Game Service] Handled game.credit_success for betId=${data.betId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Game Service] Error handling game.credit_success for betId=${data.betId}: ${errorMessage}`);
    }
  }
}
