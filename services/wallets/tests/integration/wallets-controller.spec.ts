/**
 * Integration tests for WalletsController.
 * WalletApplicationService is mocked — validates HTTP parameter mapping,
 * DTO transformation, inline validation logic, and response shapes.
 *
 * Auth bypass: NODE_ENV=test + token="mock-token" activates the guard's
 * built-in test shortcut (injects player-test-uuid-12345 / player_test).
 */
import { describe, expect, test, beforeEach, mock } from "bun:test";
import { BadRequestException } from "@nestjs/common";
import { WalletsController } from "../../src/presentation/controllers/wallets.controller";
import { Balance, Wallet } from "../../src/domain/wallet.entity";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PLAYER_ID = "player-1";
const WALLET_ID = "wallet-1";
const now = new Date();

function makeWallet(currency = "BRL", rawAmount = 100000n): Wallet {
  const balance = new Balance("b1", WALLET_ID, currency, rawAmount);
  return new Wallet(WALLET_ID, PLAYER_ID, [balance], now, now);
}

const mockAuthedReq = { user: { id: PLAYER_ID, username: "player" } };

// ─── Mock service factory ──────────────────────────────────────────────────────
function createServiceMock() {
  return {
    getOrCreateWallet: mock(async () => makeWallet()),
    getTransactions:   mock(async () => [] as any[]),
    credit:            mock(async () => {}),
    debit:             mock(async () => {}),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("WalletsController", () => {
  let controller: WalletsController;
  let service:    ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service    = createServiceMock();
    controller = new WalletsController(service as any);
  });

  // ─── Health ─────────────────────────────────────────────────────────────────
  describe("GET /health", () => {
    test("returns status ok and service name", () => {
      const result = controller.check();

      expect(result.status).toBe("ok");
      expect(result.service).toBe("wallets");
    });
  });

  // ─── POST / (createWallet) ──────────────────────────────────────────────────
  describe("POST /", () => {
    test("creates or retrieves wallet for the authenticated player", async () => {
      const result = await controller.createWallet(mockAuthedReq as any);

      expect(service.getOrCreateWallet).toHaveBeenCalledWith(PLAYER_ID);
      expect(result.id).toBe(WALLET_ID);
      expect(result.playerId).toBe(PLAYER_ID);
      expect(result.balances).toHaveLength(1);
    });

    test("returns DTO with amountFormatted in BRL units (centavos ÷ 100)", async () => {
      const result = await controller.createWallet(mockAuthedReq as any);

      // 100000 centavos → R$1000.00
      expect(result.balances[0].amountFormatted).toBe(1000);
      expect(result.balances[0].currency).toBe("BRL");
    });
  });

  // ─── GET /me ────────────────────────────────────────────────────────────────
  describe("GET /me", () => {
    test("returns wallet with balance details for the authenticated player", async () => {
      const result = await controller.getWallet(mockAuthedReq as any);

      expect(service.getOrCreateWallet).toHaveBeenCalledWith(PLAYER_ID);
      expect(result.playerId).toBe(PLAYER_ID);
      expect(result.balances[0].currency).toBe("BRL");
    });

    test("includes estimated USD value in the balance DTO", async () => {
      const result = await controller.getWallet(mockAuthedReq as any);

      // 100000 centavos = R$1000 → USD estimate at 0.18 rate = $180
      expect(result.balances[0].estimatedUsdValue).toBe(180);
    });
  });

  // ─── GET /transactions ──────────────────────────────────────────────────────
  describe("GET /transactions", () => {
    test("returns transaction list for the authenticated player", async () => {
      const tx = [{ id: "tx-1", amount: 500, type: "CREDIT", currency: "BRL" }];
      service.getTransactions = mock(async () => tx);

      const result = await controller.getTransactions(mockAuthedReq as any);

      expect(result).toEqual(tx);
      expect(service.getTransactions).toHaveBeenCalledWith(PLAYER_ID);
    });

    test("returns empty array when player has no transactions", async () => {
      const result = await controller.getTransactions(mockAuthedReq as any);

      expect(result).toEqual([]);
    });
  });

  // ─── POST /deposit ───────────────────────────────────────────────────────────
  describe("POST /deposit", () => {
    test("credits the player and returns the updated wallet on a valid BRL deposit", async () => {
      const result = await controller.deposit(
        mockAuthedReq as any,
        { amount: "10000", currency: "BRL" }
      );

      expect(service.credit).toHaveBeenCalledWith(
        PLAYER_ID, 10000n, "BRL",
        expect.stringContaining("dep_"),
        "SIMULATED_DEPOSIT"
      );
      expect(service.getOrCreateWallet).toHaveBeenCalledWith(PLAYER_ID);
      expect(result.playerId).toBe(PLAYER_ID);
    });

    test("accepts all four supported currencies: BRL, USD, BTC, ETH", async () => {
      for (const currency of ["BRL", "USD", "BTC", "ETH"]) {
        await expect(
          controller.deposit(mockAuthedReq as any, { amount: "1000", currency })
        ).resolves.toBeDefined();
      }
    });

    test("throws BadRequestException when amount is an empty string", async () => {
      await expect(
        controller.deposit(mockAuthedReq as any, { amount: "", currency: "BRL" })
      ).rejects.toThrow(BadRequestException);
    });

    test("throws BadRequestException when currency is an empty string", async () => {
      await expect(
        controller.deposit(mockAuthedReq as any, { amount: "500", currency: "" })
      ).rejects.toThrow(BadRequestException);
    });

    test("throws BadRequestException for unsupported currency (EUR)", async () => {
      await expect(
        controller.deposit(mockAuthedReq as any, { amount: "500", currency: "EUR" })
      ).rejects.toThrow("Unsupported currency");
    });

    test("throws BadRequestException when amount string is a decimal (not parseable as BigInt)", async () => {
      await expect(
        controller.deposit(mockAuthedReq as any, { amount: "12.50", currency: "BRL" })
      ).rejects.toThrow("Invalid amount format");
    });

    test("throws BadRequestException when amount is zero", async () => {
      await expect(
        controller.deposit(mockAuthedReq as any, { amount: "0", currency: "BRL" })
      ).rejects.toThrow("Amount must be greater than zero");
    });

    test("throws BadRequestException when amount is negative", async () => {
      await expect(
        controller.deposit(mockAuthedReq as any, { amount: "-500", currency: "BRL" })
      ).rejects.toThrow("Amount must be greater than zero");
    });

    test("generates a unique referenceId prefixed with 'dep_' for each deposit", async () => {
      // Call twice; verify both calls include a 'dep_' referenceId but they differ
      await controller.deposit(mockAuthedReq as any, { amount: "100", currency: "BRL" });
      await controller.deposit(mockAuthedReq as any, { amount: "200", currency: "BRL" });

      const calls = service.credit.mock.calls;
      const ref1 = calls[0][3] as string;
      const ref2 = calls[1][3] as string;
      expect(ref1).toMatch(/^dep_/);
      expect(ref2).toMatch(/^dep_/);
      expect(ref1).not.toBe(ref2);
    });
  });
});
