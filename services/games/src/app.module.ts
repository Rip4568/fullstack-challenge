import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { GamesController } from "./presentation/controllers/games.controller";
import { GamesRabbitMqController } from "./presentation/controllers/games-rabbitmq.controller";
import { GameApplicationService } from "./application/services/game.application-service";
import { PrismaService } from "./infrastructure/persistence/prisma.service";
import { GamesGateway } from "./infrastructure/websocket/games.gateway";
import { GameLoopEngine } from "./application/engine/game-loop.engine";
import { ProvablyFairService } from "./domain/services/provably-fair.service";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "WALLETS_SERVICE",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672"],
          queue: "wallets_queue",
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [GamesController, GamesRabbitMqController],
  providers: [
    GameApplicationService,
    PrismaService,
    GamesGateway,
    GameLoopEngine,
    ProvablyFairService,
  ],
  exports: [GameApplicationService, GamesGateway, ProvablyFairService],
})
export class AppModule {}
