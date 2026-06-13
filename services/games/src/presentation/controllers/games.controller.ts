import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request,
} from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { GameApplicationService } from "../../application/services/game.application-service";
import { AuthGuard } from "../guards/auth.guard";
import { PlaceBetDto } from "../dtos/place-bet.dto";
import { CashoutDto } from "../dtos/cashout.dto";
import { PaginationQueryDto } from "../dtos/pagination-query.dto";
import { RoundResponseDto, BetResponseDto } from "../dtos/round-response.dto";

/**
 * Rotas expostas em /games.
 */
@Controller()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GamesController {
  constructor(private readonly gameService: GameApplicationService) {}

  /**
   * Endpoint de verificação de saúde (Health Check) do microsserviço de jogos.
   *
   * @returns DTO simples contendo o status e o nome do serviço.
   */
  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  /**
   * Retorna a rodada ativa atual (seja em fase de apostas ou jogabilidade)
   * ou a última rodada finalizada caso não haja nenhuma rodada ativa.
   *
   * @returns DTO com os detalhes da rodada atual.
   */
  @Get("rounds/current")
  async getCurrentRound(): Promise<RoundResponseDto> {
    const round = await this.gameService.getCurrentRound();
    return RoundResponseDto.fromEntity(round);
  }

  /**
   * Retorna o histórico paginado de rodadas que já foram finalizadas (status CRASHED).
   *
   * @param query DTO de paginação contendo limite e deslocamento (offset).
   * @returns Objeto contendo a lista de rodadas paginadas e metadados de paginação.
   */
  @Get("rounds/history")
  async getRoundsHistory(
    @Query() query: PaginationQueryDto,
  ): Promise<{
    items: RoundResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { items, total } = await this.gameService.getRoundsHistory(
      query.limit ?? 20,
      query.offset ?? 0,
    );
    return {
      items: items.map((r) => RoundResponseDto.fromEntity(r)),
      total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  /**
   * Permite verificar a integridade de uma rodada finalizada usando o Provably Fair.
   * Revela a semente do servidor (serverSeed) e valida que o crashPoint gerado
   * confere com os hashes e sementes previamente publicados.
   *
   * @param roundId Identificador único da rodada.
   * @returns DTO da rodada finalizada com as sementes abertas para verificação.
   */
  @Get("rounds/:roundId/verify")
  async verifyRound(
    @Param("roundId") roundId: string,
  ): Promise<RoundResponseDto> {
    const round = await this.gameService.verifyRound(roundId);
    return RoundResponseDto.fromEntity(round);
  }

  /**
   * Retorna o histórico de apostas paginado do jogador autenticado.
   *
   * @param req Objeto do request HTTP contendo as informações do jogador injetadas pelo AuthGuard.
   * @param query DTO de paginação com limite e offset.
   * @returns Lista de apostas paginada do jogador autenticado.
   */
  @Get("bets/me")
  @UseGuards(AuthGuard)
  async getPlayerBets(
    @Request() req: any,
    @Query() query: PaginationQueryDto,
  ): Promise<{
    items: BetResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { items, total } = await this.gameService.getPlayerBets(
      req.user.id,
      query.limit ?? 20,
      query.offset ?? 0,
    );
    return {
      items: items.map((b) => BetResponseDto.fromEntity(b)),
      total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  /**
   * Realiza uma nova aposta na rodada ativa atual (que deve estar na fase BETTING).
   * Despacha um comando para o microsserviço de carteiras para debitar o valor de forma assíncrona.
   *
   * @param req Objeto do request HTTP contendo o ID e username do jogador autenticado.
   * @param body DTO contendo o valor da aposta (em centavos/Satoshis) e a moeda (currency).
   * @returns DTO representando a aposta criada com status PENDING.
   */
  @Post("bet")
  @UseGuards(AuthGuard)
  async placeBet(
    @Request() req: any,
    @Body() body: PlaceBetDto,
  ): Promise<BetResponseDto> {
    const bet = await this.gameService.placeBet(
      req.user.id,
      req.user.username,
      BigInt(body.amount),
      body.currency || "BRL",
    );
    return BetResponseDto.fromEntity(bet);
  }

  /**
   * Solicita o cash out (saque) da aposta ativa do jogador na rodada em andamento (GAMEPLAY).
   * Valida se a rodada não crashou no multiplicador informado e dispara o crédito correspondente.
   *
   * @param req Objeto do request contendo os dados do jogador.
   * @param body DTO contendo o multiplicador no qual o jogador solicitou o cash out.
   * @returns DTO da aposta atualizada com status CASHOUT e o valor do payout.
   */
  @Post("bet/cashout")
  @UseGuards(AuthGuard)
  async cashout(
    @Request() req: any,
    @Body() body: CashoutDto,
  ): Promise<BetResponseDto> {
    const bet = await this.gameService.cashout(req.user.id, body.multiplier);
    return BetResponseDto.fromEntity(bet);
  }
}
