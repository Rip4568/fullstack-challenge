import { describe, expect, test, beforeEach, mock } from "bun:test";
import { BadRequestException } from "@nestjs/common";
import { GameApplicationService } from "../../src/application/services/game.application-service";
import { GameStatus, RoundStatus, BetStatus } from "../../src/infrastructure/persistence/prisma/client";

// Fixtures
const GAME_ID   = "game-1";
const ROUND_ID  = "round-1";
const PLAYER_ID = "player-1";
const BET_ID    = "bet-1";

const mockGame = { id: GAME_ID, slug: "crash", name: "Crash Game", status: GameStatus.ACTIVE };
const mockBettingRound = { id: ROUND_ID, gameId: GAME_ID, status: RoundStatus.BETTING, crashPoint: 2.5, bets: [] };
const mockPendingBet = { id: BET_ID, roundId: ROUND_ID, playerId: PLAYER_ID, username: "player", amount: 1000n, currency: "BRL", status: BetStatus.PENDING, cashOutMultiplier: null, payoutAmount: null };

function createPrismaMock() {
  return {
    game: { upsert: mock(async () => mockGame) },
    gameRound: {
      findFirst: mock(async () => mockBettingRound),
    },
    bet: {
      create: mock(async ({ data }: any) => ({ ...mockPendingBet, amount: data.amount, currency: data.currency })),
      findUnique: mock(async () => null as any),
    },
  };
}

function createClientMock() {
  return { emit: mock((_event: string, _data: unknown) => {}) };
}

describe("Currency Limits Unit Tests", () => {
  let service: GameApplicationService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let client: ReturnType<typeof createClientMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    client = createClientMock();
    service = new GameApplicationService(prisma as any, client as any);
  });

  describe("BRL limits (100n to 100000n)", () => {
    const currency = "BRL";

    test("should reject bet below minimum limit of 100n BRL", async () => {
      await expect(service.placeBet(PLAYER_ID, "player", 99n, currency)).rejects.toThrow(
        BadRequestException
      );
    });

    test("should accept bet at minimum boundary of 100n BRL", async () => {
      const bet = await service.placeBet(PLAYER_ID, "player", 100n, currency);
      expect(bet.amount).toBe(100n);
      expect(bet.currency).toBe(currency);
    });

    test("should accept bet at maximum boundary of 100000n BRL", async () => {
      const bet = await service.placeBet(PLAYER_ID, "player", 100000n, currency);
      expect(bet.amount).toBe(100000n);
      expect(bet.currency).toBe(currency);
    });

    test("should reject bet above maximum limit of 100000n BRL", async () => {
      await expect(service.placeBet(PLAYER_ID, "player", 100001n, currency)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("USD limits (100n to 100000n)", () => {
    const currency = "USD";

    test("should reject bet below minimum limit of 100n USD", async () => {
      await expect(service.placeBet(PLAYER_ID, "player", 99n, currency)).rejects.toThrow(
        BadRequestException
      );
    });

    test("should accept bet at minimum boundary of 100n USD", async () => {
      const bet = await service.placeBet(PLAYER_ID, "player", 100n, currency);
      expect(bet.amount).toBe(100n);
      expect(bet.currency).toBe(currency);
    });

    test("should accept bet at maximum boundary of 100000n USD", async () => {
      const bet = await service.placeBet(PLAYER_ID, "player", 100000n, currency);
      expect(bet.amount).toBe(100000n);
      expect(bet.currency).toBe(currency);
    });

    test("should reject bet above maximum limit of 100000n USD", async () => {
      await expect(service.placeBet(PLAYER_ID, "player", 100001n, currency)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("BTC limits (1000n to 10000000000n)", () => {
    const currency = "BTC";

    test("should reject bet below minimum limit of 1000n satoshis (BTC)", async () => {
      await expect(service.placeBet(PLAYER_ID, "player", 999n, currency)).rejects.toThrow(
        BadRequestException
      );
    });

    test("should accept bet at minimum boundary of 1000n satoshis (BTC)", async () => {
      const bet = await service.placeBet(PLAYER_ID, "player", 1000n, currency);
      expect(bet.amount).toBe(1000n);
      expect(bet.currency).toBe(currency);
    });

    test("should accept bet at maximum boundary of 10,000,000,000n satoshis (BTC)", async () => {
      const bet = await service.placeBet(PLAYER_ID, "player", 10000000000n, currency);
      expect(bet.amount).toBe(10000000000n);
      expect(bet.currency).toBe(currency);
    });

    test("should reject bet above maximum limit of 10,000,000,000n satoshis (BTC)", async () => {
      await expect(service.placeBet(PLAYER_ID, "player", 10000000001n, currency)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("ETH limits (10,000,000,000,000n to 100,000,000,000,000,000,000n)", () => {
    const currency = "ETH";

    test("should reject bet below minimum limit of 1e13 Wei (ETH)", async () => {
      await expect(service.placeBet(PLAYER_ID, "player", 9999999999999n, currency)).rejects.toThrow(
        BadRequestException
      );
    });

    test("should accept bet at minimum boundary of 1e13 Wei (ETH)", async () => {
      const bet = await service.placeBet(PLAYER_ID, "player", 10000000000000n, currency);
      expect(bet.amount).toBe(10000000000000n);
      expect(bet.currency).toBe(currency);
    });

    test("should accept bet at maximum boundary of 1e20 Wei (ETH)", async () => {
      const bet = await service.placeBet(PLAYER_ID, "player", 100000000000000000000n, currency);
      expect(bet.amount).toBe(100000000000000000000n);
      expect(bet.currency).toBe(currency);
    });

    test("should reject bet above maximum limit of 1e20 Wei (ETH)", async () => {
      await expect(service.placeBet(PLAYER_ID, "player", 100000000000000000001n, currency)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
