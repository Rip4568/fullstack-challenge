import { RoundStatus } from "../../infrastructure/persistence/prisma/client";

export class BetResponseDto {
  id: string;
  roundId: string;
  playerId: string;
  username: string;
  amount: number;
  currency: string;
  status: string;
  cashOutMultiplier: number | null;
  payoutAmount: number | null;
  createdAt: Date;
  round?: {
    status: string;
    crashPoint: number | null;
    serverSeedHash: string;
  };

  static fromEntity(bet: any): BetResponseDto {
    const roundInfo = bet.round ? {
      status: bet.round.status,
      crashPoint: bet.round.status === RoundStatus.CRASHED ? bet.round.crashPoint : null,
      serverSeedHash: bet.round.serverSeedHash,
    } : undefined;

    return {
      id: bet.id,
      roundId: bet.roundId,
      playerId: bet.playerId,
      username: bet.username,
      amount: Number(bet.amount),
      currency: bet.currency,
      status: bet.status,
      cashOutMultiplier: bet.cashOutMultiplier,
      payoutAmount: bet.payoutAmount ? Number(bet.payoutAmount) : null,
      createdAt: bet.createdAt,
      round: roundInfo,
    };
  }
}

export class RoundResponseDto {
  id: string;
  gameId: string;
  status: string;
  serverSeed: string | null;
  serverSeedHash: string;
  clientSeed: string;
  crashPoint: number | null;
  createdAt: Date;
  endedAt: Date | null;
  bets?: BetResponseDto[];

  static fromEntity(round: any): RoundResponseDto {
    const isCrashed = round.status === RoundStatus.CRASHED;
    return {
      id: round.id,
      gameId: round.gameId,
      status: round.status,
      serverSeed: isCrashed ? round.serverSeed : null,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      crashPoint: isCrashed ? round.crashPoint : null,
      createdAt: round.createdAt,
      endedAt: round.endedAt,
      bets: round.bets ? round.bets.map((b: any) => BetResponseDto.fromEntity(b)) : undefined,
    };
  }
}
