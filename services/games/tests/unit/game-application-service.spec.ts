/**
 * Unit tests for GameApplicationService.
 * Prisma and RabbitMQ client are fully mocked — no database or broker required.
 */
import { describe, expect, test, beforeEach, mock } from "bun:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { GameApplicationService } from "../../src/application/services/game.application-service";
import { BetStatus, GameStatus, RoundStatus } from "../../src/infrastructure/persistence/prisma/client";

// ─── Fixtures ────────────────────────────────────────────────────────────────
const GAME_ID   = "game-1";
const ROUND_ID  = "round-1";
const PLAYER_ID = "player-1";
const BET_ID    = "bet-1";

const mockGame = { id: GAME_ID, slug: "crash", name: "Crash Game", status: GameStatus.ACTIVE };

const mockBettingRound  = { id: ROUND_ID, gameId: GAME_ID, status: RoundStatus.BETTING,  crashPoint: 2.5, bets: [] };
const mockGameplayRound = { id: ROUND_ID, gameId: GAME_ID, status: RoundStatus.GAMEPLAY, crashPoint: 2.5, bets: [] };
const mockCrashedRound  = { id: ROUND_ID, gameId: GAME_ID, status: RoundStatus.CRASHED,  crashPoint: 2.5, serverSeed: "secret", serverSeedHash: "hash" };

const mockPendingBet   = { id: BET_ID, roundId: ROUND_ID, playerId: PLAYER_ID, username: "player", amount: 1000n, currency: "BRL", status: BetStatus.PENDING,   cashOutMultiplier: null, payoutAmount: null };
const mockConfirmedBet = { ...mockPendingBet, status: BetStatus.CONFIRMED };
const mockCashoutBet   = { ...mockConfirmedBet, status: BetStatus.CASHOUT, cashOutMultiplier: 1.5, payoutAmount: 1500n };

// ─── Mock factory ─────────────────────────────────────────────────────────────
function createPrismaMock() {
  const tx = {
    bet: {
      findUnique: mock(async () => mockConfirmedBet),
      update:     mock(async () => mockCashoutBet),
    },
  };

  return {
    game:      { upsert:     mock(async () => mockGame) },
    gameRound: {
      findFirst:  mock(async () => mockBettingRound),
      findUnique: mock(async () => null as any),
      findMany:   mock(async () => [mockCrashedRound]),
      count:      mock(async () => 1),
    },
    bet: {
      create:    mock(async () => mockPendingBet),
      findUnique: mock(async () => null as any),
      update:    mock(async () => mockPendingBet),
      findMany:  mock(async () => [mockPendingBet]),
      count:     mock(async () => 1),
    },
    $transaction: mock(async (fn: (tx: typeof tx) => unknown) => fn(tx)),
    _tx: tx,
  };
}

function createClientMock() {
  return { emit: mock((_event: string, _data: unknown) => {}) };
}

function createGatewayMock() {
  return {
    broadcastBetPlaced: mock((_playerId: string, _username: string, _amount: number) => {}),
    broadcastBetCashout: mock((_playerId: string, _username: string, _multiplier: number, _payout: number) => {}),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("GameApplicationService", () => {
  let service: GameApplicationService;
  let prisma:  ReturnType<typeof createPrismaMock>;
  let client:  ReturnType<typeof createClientMock>;
  let gateway: ReturnType<typeof createGatewayMock>;

  beforeEach(() => {
    prisma  = createPrismaMock();
    client  = createClientMock();
    gateway = createGatewayMock();
    service = new GameApplicationService(prisma as any, client as any, gateway as any);
  });


  // ───────────────────────────────────────────────────────────────────────────
  describe("ensureDefaultGameExists", () => {
    test("upserts crash game and returns its ID", async () => {
      const id = await service.ensureDefaultGameExists();

      expect(id).toBe(GAME_ID);
      expect(prisma.game.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: "crash" } })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("placeBet", () => {
    test("creates PENDING bet and emits wallet.debit on success", async () => {
      // Arrange: no duplicate bet
      prisma.bet.findUnique = mock(async () => null);

      // Act
      const bet = await service.placeBet(PLAYER_ID, "player", 1000n, "BRL");

      // Assert: bet created and debit event emitted
      expect(bet.status).toBe(BetStatus.PENDING);
      expect(prisma.bet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ playerId: PLAYER_ID, amount: 1000n, currency: "BRL", status: BetStatus.PENDING }),
      });
      expect(client.emit).toHaveBeenCalledWith(
        "wallet.debit",
        expect.objectContaining({ betId: BET_ID, playerId: PLAYER_ID, amount: "1000", currency: "BRL" })
      );
    });

    test("throws BadRequestException when no active BETTING round exists", async () => {
      prisma.gameRound.findFirst = mock(async () => null);

      await expect(service.placeBet(PLAYER_ID, "player", 1000n)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.placeBet(PLAYER_ID, "player", 1000n)).rejects.toThrow(
        "No active betting round available"
      );
    });

    test("throws BadRequestException when bet amount is below minimum (100 centavos = R$1.00)", async () => {
      prisma.bet.findUnique = mock(async () => null);

      await expect(service.placeBet(PLAYER_ID, "player", 99n)).rejects.toThrow(
        "Bet amount must be between 1.00 and 1,000.00"
      );
    });

    test("throws BadRequestException when bet amount exceeds maximum (100000 centavos = R$1000.00)", async () => {
      prisma.bet.findUnique = mock(async () => null);

      await expect(service.placeBet(PLAYER_ID, "player", 100001n)).rejects.toThrow(
        "Bet amount must be between 1.00 and 1,000.00"
      );
    });

    test("accepts bets at boundary values (100n and 100000n)", async () => {
      prisma.bet.findUnique = mock(async () => null);

      await expect(service.placeBet(PLAYER_ID, "player", 100n)).resolves.toBeDefined();
      prisma.bet.findUnique = mock(async () => null);
      await expect(service.placeBet(PLAYER_ID, "player", 100000n)).resolves.toBeDefined();
    });

    test("throws BadRequestException when player already has a bet in the current round", async () => {
      // Existing bet found for this player/round combination
      prisma.bet.findUnique = mock(async () => mockPendingBet);

      await expect(service.placeBet(PLAYER_ID, "player", 1000n)).rejects.toThrow(
        "Player has already placed a bet in this round"
      );
    });

    test("enforces cryptocurrency specific limits (BTC and ETH)", async () => {
      // BTC boundaries: min 1000n, max 10000000000n
      prisma.bet.findUnique = mock(async () => null);
      await expect(service.placeBet(PLAYER_ID, "player", 999n, "BTC")).rejects.toThrow(
        "Bet amount must be between 1.00 and 1,000.00"
      );

      prisma.bet.findUnique = mock(async () => null);
      await expect(service.placeBet(PLAYER_ID, "player", 10000000001n, "BTC")).rejects.toThrow(
        "Bet amount must be between 1.00 and 1,000.00"
      );

      prisma.bet.findUnique = mock(async () => null);
      await expect(service.placeBet(PLAYER_ID, "player", 1000n, "BTC")).resolves.toBeDefined();

      // ETH boundaries: min 10000000000000n, max 100000000000000000000n
      prisma.bet.findUnique = mock(async () => null);
      await expect(service.placeBet(PLAYER_ID, "player", 9999999999999n, "ETH")).rejects.toThrow(
        "Bet amount must be between 1.00 and 1,000.00"
      );

      prisma.bet.findUnique = mock(async () => null);
      await expect(service.placeBet(PLAYER_ID, "player", 100000000000000000001n, "ETH")).rejects.toThrow(
        "Bet amount must be between 1.00 and 1,000.00"
      );

      prisma.bet.findUnique = mock(async () => null);
      await expect(service.placeBet(PLAYER_ID, "player", 10000000000000n, "ETH")).resolves.toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("confirmBet", () => {
    test("transitions bet from PENDING to CONFIRMED", async () => {
      prisma.bet.findUnique = mock(async () => mockPendingBet);
      prisma.bet.update     = mock(async () => ({ ...mockPendingBet, status: BetStatus.CONFIRMED }));

      const result = await service.confirmBet(BET_ID);

      expect(result.status).toBe(BetStatus.CONFIRMED);
      expect(prisma.bet.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: BetStatus.CONFIRMED } })
      );
    });

    test("returns existing bet unchanged when already CONFIRMED (idempotent)", async () => {
      // Bet is already CONFIRMED — no update should happen
      prisma.bet.findUnique = mock(async () => mockConfirmedBet);

      const result = await service.confirmBet(BET_ID);

      expect(result.status).toBe(BetStatus.CONFIRMED);
      expect(prisma.bet.update).not.toHaveBeenCalled();
    });

    test("throws NotFoundException when bet with given ID does not exist", async () => {
      prisma.bet.findUnique = mock(async () => null);

      await expect(service.confirmBet("nonexistent-id")).rejects.toThrow(NotFoundException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("rejectBet", () => {
    test("transitions bet from PENDING to REJECTED", async () => {
      prisma.bet.findUnique = mock(async () => mockPendingBet);
      prisma.bet.update     = mock(async () => ({ ...mockPendingBet, status: BetStatus.REJECTED }));

      const result = await service.rejectBet(BET_ID);

      expect(result.status).toBe(BetStatus.REJECTED);
    });

    test("returns existing bet unchanged when already non-PENDING (idempotent)", async () => {
      prisma.bet.findUnique = mock(async () => ({ ...mockPendingBet, status: BetStatus.REJECTED }));

      await service.rejectBet(BET_ID);

      expect(prisma.bet.update).not.toHaveBeenCalled();
    });

    test("throws NotFoundException when bet does not exist", async () => {
      prisma.bet.findUnique = mock(async () => null);

      await expect(service.rejectBet("nonexistent-id")).rejects.toThrow(NotFoundException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("cashout", () => {
    beforeEach(() => {
      // Default: active gameplay round and confirmed bet
      prisma.gameRound.findFirst = mock(async () => mockGameplayRound);
      prisma.bet.findUnique      = mock(async () => mockConfirmedBet);
    });

    test("processes cashout and calculates payout correctly (amount × multiplier / 100)", async () => {
      // amount=1000n, multiplier=1.5 → multiplierCents=150, payout = 1000*150/100 = 1500
      const result = await service.cashout(PLAYER_ID, 1.5);

      expect(result.status).toBe(BetStatus.CASHOUT);
      expect(result.cashOutMultiplier).toBe(1.5);
      expect(result.payoutAmount).toBe(1500n);
    });

    test("emits wallet.credit with correct payout amount after cashout", async () => {
      await service.cashout(PLAYER_ID, 1.5);

      expect(client.emit).toHaveBeenCalledWith(
        "wallet.credit",
        expect.objectContaining({ betId: BET_ID, playerId: PLAYER_ID, amount: "1500", referenceType: "CASHOUT" })
      );
    });

    test("throws BadRequestException when there is no active GAMEPLAY round", async () => {
      prisma.gameRound.findFirst = mock(async () => null);

      await expect(service.cashout(PLAYER_ID, 1.5)).rejects.toThrow("No active gameplay round");
    });

    test("throws BadRequestException when player has no bet in the current round", async () => {
      prisma.bet.findUnique = mock(async () => null);

      await expect(service.cashout(PLAYER_ID, 1.5)).rejects.toThrow("No bet found for this round");
    });

    test("throws BadRequestException when bet is not CONFIRMED (still PENDING)", async () => {
      prisma.bet.findUnique = mock(async () => mockPendingBet);

      await expect(service.cashout(PLAYER_ID, 1.5)).rejects.toThrow("Cannot cashout");
    });

    test("throws 'Game already crashed' when multiplier equals crashPoint (2.5)", async () => {
      await expect(service.cashout(PLAYER_ID, 2.5)).rejects.toThrow("Game already crashed");
    });

    test("throws 'Game already crashed' when multiplier exceeds crashPoint", async () => {
      await expect(service.cashout(PLAYER_ID, 9.99)).rejects.toThrow("Game already crashed");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getCurrentRound", () => {
    test("returns the active round when one exists (BETTING or GAMEPLAY)", async () => {
      prisma.gameRound.findFirst = mock(async () => mockBettingRound);

      const round = await service.getCurrentRound();

      expect(round.status).toBe(RoundStatus.BETTING);
    });

    test("falls back to the last created round when no active round exists", async () => {
      // First call (active round query) returns null, second call (fallback) returns crashed round
      prisma.gameRound.findFirst = mock(async () => null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCrashedRound);

      const round = await service.getCurrentRound();

      expect(round.status).toBe(RoundStatus.CRASHED);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getRoundsHistory", () => {
    test("returns paginated CRASHED rounds with correct total count", async () => {
      prisma.gameRound.findMany = mock(async () => [mockCrashedRound]);
      prisma.gameRound.count    = mock(async () => 5);

      const result = await service.getRoundsHistory(1, 0);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(5);
    });

    test("applies pagination params (limit and offset)", async () => {
      await service.getRoundsHistory(5, 10);

      expect(prisma.gameRound.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, skip: 10 })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("verifyRound", () => {
    test("returns round with revealed server seed when round is CRASHED", async () => {
      prisma.gameRound.findUnique = mock(async () => mockCrashedRound);

      const round = await service.verifyRound(ROUND_ID);

      expect(round.serverSeed).toBe("secret");
      expect(round.status).toBe(RoundStatus.CRASHED);
    });

    test("throws NotFoundException when round ID does not exist", async () => {
      prisma.gameRound.findUnique = mock(async () => null);

      await expect(service.verifyRound("nonexistent")).rejects.toThrow(NotFoundException);
    });

    test("throws BadRequestException when round has not finished yet (not CRASHED)", async () => {
      prisma.gameRound.findUnique = mock(async () => mockGameplayRound);

      await expect(service.verifyRound(ROUND_ID)).rejects.toThrow("Cannot verify an active round");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getPlayerBets", () => {
    test("returns paginated bet history for the given player", async () => {
      prisma.bet.findMany = mock(async () => [mockPendingBet]);
      prisma.bet.count    = mock(async () => 1);

      const result = await service.getPlayerBets(PLAYER_ID, 10, 0);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    test("filters bets by playerId", async () => {
      await service.getPlayerBets(PLAYER_ID, 10, 0);

      expect(prisma.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { playerId: PLAYER_ID } })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("processAutoCashout", () => {
    test("should cashout eligible bets and emit wallet.credit", async () => {
      const mockAutoBet = {
        id: "bet-auto-1",
        roundId: ROUND_ID,
        playerId: "player-auto",
        username: "auto_user",
        amount: 2000n,
        currency: "USD",
        status: BetStatus.CONFIRMED,
        autoCashoutMultiplier: 1.8,
        cashOutMultiplier: null,
        payoutAmount: null,
      };

      prisma.bet.findMany = mock(async () => [mockAutoBet]);
      prisma._tx.bet.findUnique = mock(async () => mockAutoBet);
      prisma._tx.bet.update = mock(async () => ({ ...mockAutoBet, status: BetStatus.CASHOUT, cashOutMultiplier: 1.8, payoutAmount: 3600n }));

      await service.processAutoCashout(ROUND_ID, 1.9);

      expect(prisma._tx.bet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "bet-auto-1" },
          data: expect.objectContaining({ status: BetStatus.CASHOUT, cashOutMultiplier: 1.8, payoutAmount: 3600n }),
        })
      );

      expect(client.emit).toHaveBeenCalledWith(
        "wallet.credit",
        expect.objectContaining({ betId: "bet-auto-1", playerId: "player-auto", amount: "3600", currency: "USD" })
      );

      expect(gateway.broadcastBetCashout).toHaveBeenCalledWith(
        "player-auto",
        "auto_user",
        1.8,
        36.0
      );
    });

    test("should ignore bets with target multiplier above current multiplier", async () => {
      prisma.bet.findMany = mock(async () => []);
      prisma._tx.bet.update = mock(async () => ({} as any));

      await service.processAutoCashout(ROUND_ID, 1.5);

      expect(prisma.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            autoCashoutMultiplier: expect.objectContaining({ lte: 1.5 }),
          }),
        })
      );
      expect(prisma._tx.bet.update).not.toHaveBeenCalled();
    });
  });
});

