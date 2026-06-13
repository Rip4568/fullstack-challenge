import { Controller, Get, Post, UseGuards, Request } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { AuthGuard } from "../guards/auth.guard";
import { WalletApplicationService } from "../../application/services/wallet.application-service";
import { WalletResponseDto } from "../dtos/wallet-response.dto";

/**
 * Controlador REST responsável por expor operações financeiras da carteira do jogador.
 * Rotas expostas em /wallets.
 */
@Controller()
export class WalletsController {
  constructor(private readonly walletService: WalletApplicationService) {}

  /**
   * Endpoint de verificação de saúde (Health Check) do microsserviço de carteiras.
   *
   * @returns DTO de resposta simples indicando status de atividade.
   */
  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  /**
   * Cria a carteira para o jogador autenticado caso ela não exista.
   * Método idempotente devido à verificação interna de existência.
   *
   * @param req Objeto do request HTTP injetado, contendo os dados decodificados do AuthGuard.
   * @returns O DTO da carteira recém-criada ou existente com saldos zerados/semeados.
   */
  @Post()
  @UseGuards(AuthGuard)
  async createWallet(@Request() req: any): Promise<WalletResponseDto> {
    const wallet = await this.walletService.getOrCreateWallet(req.user.id);
    return WalletResponseDto.fromEntity(wallet);
  }

  /**
   * Retorna os dados consolidados da carteira e saldos do jogador autenticado.
   * Utiliza Lazy Initialization para criar a carteira caso seja o primeiro acesso.
   *
   * @param req Objeto do request HTTP contendo o jogador autenticado.
   * @returns DTO com saldos detalhados formatados em BRL, USD, BTC, ETH e estimativas de câmbio.
   */
  @Get("me")
  @UseGuards(AuthGuard)
  async getWallet(@Request() req: any): Promise<WalletResponseDto> {
    const wallet = await this.walletService.getOrCreateWallet(req.user.id);
    return WalletResponseDto.fromEntity(wallet);
  }
}
