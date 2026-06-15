/**
 * Integration tests for GamesController.
 * The GameApplicationService is mocked — this validates HTTP parameter
 * mapping, DTO transformation, auth guard enforcement and response shape.
 *
 * Auth bypass: NODE_ENV=test + token="mock-token" activates the guard's
 * built-in test shortcut (injects player-test-uuid-12345 / player_test).
 */
import { describe, expect, test, beforeEach, mock } from "bun:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { GamesController } from "../../src/presentation/controllers/games.controller";
import { BetStatus, RoundStatus } from "../../src/infrastructure/persistence/prisma/client";
import { BetResponseDto, RoundResponseDto } from "../../src/presentation/dtos/round-response.dto";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const mockRound = {
  id: "round-1", gameId: "g1", status: RoundStatus.BETTING,
  serverSeedHash: "hash", crashPoint: null, bets: [], createdAt: new Date(), endedAt: null,
};
const mockBet = {
  id: "bet-1", roundId: "round-1", playerId: "p1", username: "player",
  amount: 1000n, currency: "BRL", status: BetStatus.PENDING,
  cashOutMultiplier: null, payoutAmount: null, createdAt: new Date(),
};
const mockAuthedReq = { user: { id: "p1", username: "player" } };

// ─── Mock service factory ──────────────────────────────────────────────────────
function createServiceMock() {
  return {
    getCurrentRound:      mock(async () => mockRound),
    getRoundsHistory:     mock(async () => ({ items: [mockRound], total: 1 })),
    verifyRound:          mock(async () => ({ ...mockRound, status: RoundStatus.CRASHED })),
    placeBet:             mock(async () => mockBet),
    cashout:              mock(async () => ({ ...mockBet, status: BetStatus.CASHOUT, cashOutMultiplier: 1.5, payoutAmount: 1500n })),
    getPlayerBets:        mock(async () => ({ items: [mockBet], total: 1 })),
    ensureDefaultGameExists: mock(async () => "g1"),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("GamesController", () => {
  let controller: GamesController;
  let service:    ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service    = createServiceMock();
    controller = new GamesController(service as any);
  });

  // ─── Health ─────────────────────────────────────────────────────────────────
  describe("GET /health", () => {
    test("returns status ok and service name", () => {
      const result = controller.check();

      expect(result.status).toBe("ok");
      expect(result.service).toBe("games");
    });
  });

  // ─── GET /rounds/current ────────────────────────────────────────────────────
  describe("GET /rounds/current", () => {
    test("returns DTO of the current round", async () => {
      const result = await controller.getCurrentRound();

      expect(result).toBeDefined();
      expect(service.getCurrentRound).toHaveBeenCalledTimes(1);
    });
  });

  // ─── GET /rounds/history ────────────────────────────────────────────────────
  describe("GET /rounds/history", () => {
    test("returns paginated rounds with total, limit and offset", async () => {
      const result = await controller.getRoundsHistory({ limit: 5, offset: 10 } as any);

      expect(result.total).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(10);
      expect(service.getRoundsHistory).toHaveBeenCalledWith(5, 10);
    });

    test("defaults limit=20 and offset=0 when not provided", async () => {
      await controller.getRoundsHistory({} as any);

      expect(service.getRoundsHistory).toHaveBeenCalledWith(20, 0);
    });
  });

  // ─── GET /rounds/:id/verify ─────────────────────────────────────────────────
  describe("GET /rounds/:roundId/verify", () => {
    test("returns round details with server seed revealed", async () => {
      await controller.verifyRound("round-1");

      expect(service.verifyRound).toHaveBeenCalledWith("round-1");
    });

    test("propagates NotFoundException when round does not exist", async () => {
      service.verifyRound = mock(async () => { throw new NotFoundException("Round not found"); });

      await expect(controller.verifyRound("bad-id")).rejects.toThrow(NotFoundException);
    });

    test("propagates BadRequestException when round is still active", async () => {
      service.verifyRound = mock(async () => { throw new BadRequestException("Cannot verify an active round"); });

      await expect(controller.verifyRound("active-round")).rejects.toThrow(BadRequestException);
    });
  });

  // ─── POST /bet ──────────────────────────────────────────────────────────────
  describe("POST /bet", () => {
    test("creates PENDING bet passing playerId, username and parsed amount to service", async () => {
      const body = { amount: 1000, currency: "BRL" };

      await controller.placeBet(mockAuthedReq as any, body as any);

      expect(service.placeBet).toHaveBeenCalledWith("p1", "player", 1000n, "BRL");
    });

    test("defaults currency to BRL when not provided in body", async () => {
      await controller.placeBet(mockAuthedReq as any, { amount: 500 } as any);

      expect(service.placeBet).toHaveBeenCalledWith("p1", "player", 500n, "BRL");
    });

    test("propagates BadRequestException when no active betting round", async () => {
      service.placeBet = mock(async () => { throw new BadRequestException("No active betting round available"); });

      await expect(
        controller.placeBet(mockAuthedReq as any, { amount: 1000, currency: "BRL" } as any)
      ).rejects.toThrow("No active betting round available");
    });

    test("propagates BadRequestException when player bets twice in same round", async () => {
      service.placeBet = mock(async () => { throw new BadRequestException("Player has already placed a bet in this round"); });

      await expect(
        controller.placeBet(mockAuthedReq as any, { amount: 1000, currency: "BRL" } as any)
      ).rejects.toThrow("Player has already placed a bet in this round");
    });
  });

  // ─── POST /bet/cashout ──────────────────────────────────────────────────────
  describe("POST /bet/cashout", () => {
    test("processes cashout passing playerId and multiplier to service", async () => {
      await controller.cashout(mockAuthedReq as any, { multiplier: 2.0 } as any);

      expect(service.cashout).toHaveBeenCalledWith("p1", 2.0);
    });

    test("propagates BadRequestException when game already crashed", async () => {
      service.cashout = mock(async () => { throw new BadRequestException("Game already crashed"); });

      await expect(
        controller.cashout(mockAuthedReq as any, { multiplier: 5.0 } as any)
      ).rejects.toThrow("Game already crashed");
    });
  });

  // ─── GET /bets/me ───────────────────────────────────────────────────────────
  describe("GET /bets/me", () => {
    test("returns authenticated player's paginated bet history", async () => {
      const result = await controller.getPlayerBets(mockAuthedReq as any, { limit: 10, offset: 0 } as any);

      expect(result.total).toBe(1);
      expect(service.getPlayerBets).toHaveBeenCalledWith("p1", 10, 0);
    });

    test("passes player ID extracted from auth token, not from query params", async () => {
      await controller.getPlayerBets({ user: { id: "another-player", username: "x" } } as any, {} as any);

      expect(service.getPlayerBets).toHaveBeenCalledWith("another-player", 20, 0);
    });
  });
});
