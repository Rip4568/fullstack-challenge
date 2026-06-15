import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/persistence/prisma.service";
import { ProvablyFairService } from "../../domain/services/provably-fair.service";
import { GamesGateway } from "../../infrastructure/websocket/games.gateway";
import { RoundStatus, BetStatus, GameStatus, Prisma } from "../../infrastructure/persistence/prisma/client";
import { GameApplicationService } from "../services/game.application-service";

/**
 * Engine responsável pelo loop contínuo de rodadas do Crash Game (máquina de estados do jogo).
 * Gerencia as transições entre as fases BETTING (apostas), GAMEPLAY (crescimento do multiplicador)
 * e CRASHED (queda e liquidação das apostas restantes), controlando timers e transmissões via WebSocket.
 */
@Injectable()
export class GameLoopEngine implements OnApplicationBootstrap {
  private activeRoundId: string | null = null;
  private isRunning = false;
  private _lastRetryInSeconds:number = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly provablyFair: ProvablyFairService,
    private readonly gateway: GamesGateway,
    private readonly gameService: GameApplicationService
  ) {}


  /**
   * Hook de inicialização do NestJS executado após a inicialização bem-sucedida do app.
   * Dispara o início do loop do jogo.
   */
  async onApplicationBootstrap() {
    this.start();
  }

  /**
   * Inicializa o loop contínuo de jogabilidade em background.
   * Evita inicializações duplicadas caso o loop já esteja em execução.
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[Game Engine] Starting Crash Game Loop...");

    // Clean up any old active rounds left stuck due to unexpected shutdown/crashes
    await this.cleanUpStuckRounds();

    // Start background loop
    this.loop();
  }

  /**
   * Loop principal em background que executa continuamente o ciclo de vida de cada rodada.
   * Em caso de falha de conexão com o banco ou outro erro grave, aguarda um intervalo de cooldown antes de tentar novamente.
   */
  private async loop() {
    while (this.isRunning) {
      try {
        await this.runRoundLifecycle();
        this._lastRetryInSeconds = 5;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Game Engine] Error in round lifecycle: ${errorMessage}`);
        // Wait 5 seconds before retrying in case of database or connection errors
        this._lastRetryInSeconds += 5; // soma a cada +5 segundos (5, 10, 15 20... para evitar chamadas excessivas desnecessarias) como o setTimeout espera milissegundos, multipliquei por 1000
        await new Promise((resolve) => setTimeout(resolve, this._lastRetryInSeconds * 1000));
      }
    }
  }

  /**
   * Gerencia todo o ciclo de vida de uma única rodada do Crash Game:
   * 1. Fase de Apostas (BETTING): Gera as sementes do Provably Fair, publica o hash da semente do servidor e aguarda 10 segundos para receber apostas.
   * 2. Fase de Jogabilidade (GAMEPLAY): Atualiza o status da rodada e inicia o incremento do multiplicador no tempo real (ticks de 50ms) baseado na curva exponencial até atingir o ponto de crash calculado.
   * 3. Fase de Crash (CRASHED): Atualiza o status da rodada, liquida todas as apostas pendentes/confirmadas como perdidas (LOST), revela a semente original do servidor e inicia um cooldown de 5 segundos antes da próxima rodada.
   */
  private async runRoundLifecycle() {
    const gameId = await this.ensureGameCreated();

    // 1. PHASE_BETTING: Create new round, publish hash, allow bets for 10s
    console.log("[Game Engine] Transitioning to BETTING phase...");
    
    // Generate Seeds
    const serverSeed = this.provablyFair.generateRandomSeed();
    const serverSeedHash = this.provablyFair.hashSeed(serverSeed);
    const clientSeed = "jungle-gaming-fair-seed-2026"; // Static public seed. mudar para busca no banco ou geração aleatoria.
    const crashPoint = this.provablyFair.calculateCrashPoint(serverSeed, clientSeed);

    const round = await this.prisma.gameRound.create({
      data: {
        gameId,
        status: RoundStatus.BETTING,
        serverSeed,
        serverSeedHash,
        clientSeed,
        crashPoint,
      },
    });

    this.activeRoundId = round.id;

    // Broadcast BETTING state to WS
    const bettingDurationMs = 10000;
    this.gateway.broadcastRoundState("round:betting", {
      roundId: round.id,
      durationMs: bettingDurationMs,
      serverSeedHash,
    });

    // Wait 10s for betting phase
    await new Promise((resolve) => setTimeout(resolve, bettingDurationMs));

    // 2. PHASE_GAMEPLAY: Start multiplier growth
    console.log(`[Game Engine] Transitioning to GAMEPLAY phase. Crash Point: ${crashPoint}x`);
    
    await this.prisma.gameRound.update({
      where: { id: round.id },
      data: { status: RoundStatus.GAMEPLAY },
    });

    this.gateway.broadcastRoundState("round:start", {
      roundId: round.id,
    });

    const startTime = Date.now();
    let crashed = false;
    let currentMultiplier = 1.00;

    // Growth Tick Interval: every 50ms (20 ticks/sec)
    const tickIntervalMs = 50;

    while (!crashed) {
      await new Promise((resolve) => setTimeout(resolve, tickIntervalMs));

      const elapsedMs = Date.now() - startTime;
      
      // Curve formula: M(t) = 1.00 * e^(0.00006 * t)
      const theoreticalMultiplier = 1.00 * Math.exp(0.00006 * elapsedMs);
      
      // Format to 2 decimal places
      currentMultiplier = Math.floor(theoreticalMultiplier * 100) / 100;

      if (currentMultiplier >= crashPoint) {
        crashed = true;
        currentMultiplier = crashPoint; // Clamp to exact crash point
      } else {
        // Process auto-cashout for eligible bets at this multiplier
        await this.gameService.processAutoCashout(round.id, currentMultiplier);

        // Broadcast tick multiplier
        this.gateway.broadcastTick(round.id, currentMultiplier, elapsedMs);
      }
    }

    // 3. PHASE_CRASHED: Liquidate remaining bets and reveal server seed
    console.log(`[Game Engine] CRASHED at ${crashPoint}x! Liquidating bets...`);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update round status
      const NOW = new Date();
    
      await tx.gameRound.update({
        where: { id: round.id },
        data: {
          status: RoundStatus.CRASHED,
          endedAt: NOW,
        },
      });

      // Liquidate all PENDING or CONFIRMED bets in this round as LOST
      await tx.bet.updateMany({
        where: {
          roundId: round.id,
          status: {
            in: [BetStatus.PENDING, BetStatus.CONFIRMED],
          },
        },
        data: {
          status: BetStatus.LOST,
        },
      });
    });

    // Broadcast CRASHED state to WS
    this.gateway.broadcastRoundState("round:crashed", {
      roundId: round.id,
      crashPoint,
      serverSeed,
    });

    // Cooldown phase: wait 5s before starting next round (talvez aumentar ou ate mesmo possibilitar essa configuração no Admin (demais outras configurações como tempo de inicio para partipação e etc tambem seria uma boa))
    const cooldownDurationMs = 5000;
    await new Promise((resolve) => setTimeout(resolve, cooldownDurationMs));
  }

  /**
   * Garante a criação física do jogo padrão Crash no banco para que as rodadas possam referenciá-lo.
   *
   * @returns O ID único do jogo.
   */
  private async ensureGameCreated(): Promise<string> {
    const existing = await this.prisma.game.findFirst({
      where: { slug: "crash" },
    });
    if (existing) return existing.id;

    const game = await this.prisma.game.create({
      data: {
        slug: "crash",
        name: "Crash Game",
        status: GameStatus.ACTIVE,
      },
    });
    return game.id;
  }

  /**
   * Corrige rodadas que ficaram presas em status ativo (BETTING ou GAMEPLAY)
   * devido a desligamentos inesperados do servidor, marcando-as como CRASHED.
   */
  private async cleanUpStuckRounds() {
    try {
      const gameId = await this.ensureGameCreated();
      
      const stuckRounds = await this.prisma.gameRound.findMany({
        where: {
          gameId,
          status: {
            in: [RoundStatus.BETTING, RoundStatus.GAMEPLAY],
          },
        },
      });

      if (stuckRounds.length > 0) {
        console.log(`[Game Engine] Found ${stuckRounds.length} stuck rounds. Cleaning them up...`);
        
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          for (const round of stuckRounds) {
            await tx.gameRound.update({
              where: { id: round.id },
              data: {
                status: RoundStatus.CRASHED,
                endedAt: new Date(),
              },
            });

            // Liquidate active bets in these stuck rounds
            await tx.bet.updateMany({
              where: {
                roundId: round.id,
                status: {
                  in: [BetStatus.PENDING, BetStatus.CONFIRMED],
                },
              },
              data: {
                status: BetStatus.LOST,
              },
            });
          }
        });
        
        console.log("[Game Engine] Stuck rounds cleanup completed.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Game Engine] Failed to clean up stuck rounds: ${errorMessage}`);
    }
  }
}
