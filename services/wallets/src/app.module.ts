import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { WalletsRabbitMqController } from "./presentation/controllers/wallets-rabbitmq.controller";
import { WalletApplicationService } from "./application/services/wallet.application-service";
import { PrismaService } from "./infrastructure/persistence/prisma.service";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "GAMES_SERVICE",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672"],
          queue: "games_queue",
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [WalletsController, WalletsRabbitMqController],
  providers: [WalletApplicationService, PrismaService],
})
export class AppModule {}
