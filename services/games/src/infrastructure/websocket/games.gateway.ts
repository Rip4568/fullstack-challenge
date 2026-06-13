import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";

/**
 * Gateway WebSocket encarregado de gerenciar as conexões e transmissões (broadcast)
 * de estados da rodada do jogo e eventos de aposta em tempo real para os clientes conectados.
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*", // boas praticas seria a limitação do acesso apenas para o frontend, mas como é um desafio deixei aberto
  },
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server = undefined as any;

  private connectedClients: Set<string> = new Set();

  /**
   * Trata a nova conexão de um cliente WebSocket.
   * Adiciona o identificador da conexão (client.id) ao conjunto de clientes ativos.
   *
   * @param client Objeto Socket correspondente ao cliente que se conectou.
   */
  handleConnection(client: Socket) {
    this.connectedClients.add(client.id);
    console.log(`[WebSocket] Client connected: ${client.id}. Total: ${this.connectedClients.size}`);
  }

  /**
   * Trata a desconexão de um cliente WebSocket.
   * Remove o identificador da conexão do conjunto de clientes ativos.
   *
   * @param client Objeto Socket correspondente ao cliente que se desconectou.
   */
  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`[WebSocket] Client disconnected: ${client.id}. Total: ${this.connectedClients.size}`);
  }

  /**
   * Realiza a transmissão de alteração da fase da rodada (betting, gameplay, crashed) para todos os clientes.
   *
   * @param event O nome do evento a ser emitido no socket (ex: "round:betting").
   * @param payload Os dados associados à mudança de fase.
   */
  broadcastRoundState(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }

  /**
   * Realiza a transmissão em tempo real do progresso do multiplicador (tick) e tempo decorrido da rodada atual.
   *
   * @param roundId Identificador único da rodada.
   * @param currentMultiplier Multiplicador atual calculado no tick correspondente.
   * @param elapsedMs Tempo decorrido em milissegundos desde o início da fase de jogabilidade.
   */
  broadcastTick(roundId: string, currentMultiplier: number, elapsedMs: number) {
    if (this.server) {
      this.server.emit("round:tick", {
        roundId,
        currentMultiplier,
        elapsedMs,
      });
    }
  }

  /**
   * Transmite o registro de colocação de uma nova aposta de forma bem-sucedida para todos os clientes conectados.
   *
   * @param playerId Identificador do jogador.
   * @param username Nome exibível do jogador.
   * @param amount Valor da aposta convertido para float.
   */
  broadcastBetPlaced(playerId: string, username: string, amount: number) {
    if (this.server) {
      this.server.emit("bet:placed", {
        playerId,
        username,
        amount,
      });
    }
  }

  /**
   * Transmite o saque (cash out) bem-sucedido de uma aposta para todos os clientes em tempo real.
   *
   * @param playerId Identificador do jogador.
   * @param username Nome do jogador.
   * @param multiplier O multiplicador exato do momento do saque.
   * @param payout O valor do payout recebido pelo jogador.
   */
  broadcastBetCashout(playerId: string, username: string, multiplier: number, payout: number) {
    if (this.server) {
      this.server.emit("bet:cashout", {
        playerId,
        username,
        multiplier,
        payout,
      });
    }
  }
}
