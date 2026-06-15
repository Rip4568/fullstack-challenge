/**
 * End-to-end flow tests for the wallet microservice.
 * Tests the full path: WalletsController → WalletApplicationService → (mocked) Prisma.
 * Validates that layers are wired correctly and that business rules apply across the
 * full request-to-response stack without a real database.
 */
import { describe, expect, test, beforeEach, mock } from "bun:test";
import { BadRequestException } from "@nestjs/common";
import { WalletsController } from "../../src/presentation/controllers/wallets.controller";
import { WalletApplicationService } from "../../src/application/services/wallet.application-service";
import { TransactionType } from "../../src/infrastructure/persistence/prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAYER_ID = "e2e-player-1";
const WALLET_ID = "e2e-wallet-1";
const now = new Date();
const INITIAL_BRL_AMOUNT = 100000n; // R$1000.00

// ─── Prisma mock factory ──────────────────────────────────────────────────────
function createPrismaMock(currentBalance = INITIAL_BRL_AMOUNT) {
  const walletRecord = { id: WALLET_ID, playerId: PLAYER_ID, createdAt: now, updatedAt: now };
  const brlBalance   = { id: "bal-brl", wallet_id: WALLET_ID, currency: "BRL", amount: currentBalance };

  const tx = {
    wallet: {
      findUnique: mock(async () => walletRecord as any),
      create:     mock(async () => walletRecord),
    },
    balance: {
      create: mock(async ({ data }: any) => ({
        id: `bal-${data.currency.toLowerCase()}`,
        walletId: WALLET_ID,
        currency: data.currency,
        amount: data.amount,
      })),
      update: mock(async ({ data }: any) => ({ ...brlBalance, amount: data.amount })),
    },
    walletTransaction: {
      findUnique: mock(async () => null as any),
      create:     mock(async () => ({ id: "tx-e2e" })),
    },
    $queryRaw: mock(async () => [brlBalance] as any),
  };

  return {
    wallet: {
      findUnique: mock(async () => ({
        ...walletRecord,
        balances: [{ id: "bal-brl", walletId: WALLET_ID, currency: "BRL", amount: currentBalance }],
      } as any)),
    },
    $transaction: mock(async (fn: (tx: typeof tx) => unknown) => fn(tx)),
    _tx: tx,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Wallet E2E — full request-to-response flow", () => {
  let controller: WalletsController;
  let prisma: ReturnType<typeof createPrismaMock>;
  const req = { user: { id: PLAYER_ID, username: "e2e-player" } };

  beforeEach(() => {
    prisma = createPrismaMock();
    const service = new WalletApplicationService(prisma as any);
    controller = new WalletsController(service);
  });

  // ─── GET /me ─────────────────────────────────────────────────────────────────
  describe("GET /me — read existing wallet", () => {
    test("returns wallet with formatted BRL balance and USD estimate", async () => {
      const result = await controller.getWallet(req as any);

      expect(result.id).toBe(WALLET_ID);
      expect(result.playerId).toBe(PLAYER_ID);
      expect(result.balances).toHaveLength(1);

      const brl = result.balances[0];
      expect(brl.currency).toBe("BRL");
      expect(brl.amountFormatted).toBe(1000);       // 100000 centavos = R$1000
      expect(brl.estimatedUsdValue).toBe(180);       // R$1000 × 0.18
    });

    test("creates a new wallet with 4 seeded balances on first access by a new player", async () => {
      // Simulate brand-new player — no wallet in DB
      prisma.wallet.findUnique = mock(async () => null);
      prisma._tx.wallet.findUnique = mock(async () => null);

      const result = await controller.getWallet(req as any);

      expect(result.playerId).toBe(PLAYER_ID);
      expect(prisma._tx.wallet.create).toHaveBeenCalledTimes(1);
      expect(prisma._tx.balance.create).toHaveBeenCalledTimes(4);
    });

    test("is idempotent: calling GET /me twice does not create duplicate wallets", async () => {
      await controller.getWallet(req as any);
      await controller.getWallet(req as any);

      // getOrCreateWallet checks existence first — transaction should never run
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ─── POST /deposit → GET /me ─────────────────────────────────────────────────
  describe("POST /deposit followed by GET /me — deposit flow", () => {
    test("deposits BRL and wallet reflects updated balance in subsequent read", async () => {
      const depositAmount = 50000n; // R$500.00

      // After credit the DB has R$1500; simulate with updated findUnique mock
      prisma.wallet.findUnique = mock(async () => ({
        id: WALLET_ID, playerId: PLAYER_ID, createdAt: now, updatedAt: now,
        balances: [{ id: "bal-brl", walletId: WALLET_ID, currency: "BRL", amount: 150000n }],
      } as any));

      const result = await controller.deposit(req as any, {
        amount: depositAmount.toString(),
        currency: "BRL",
      });

      // Verify ledger entry was created with correct type and referenceType
      expect(prisma._tx.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TransactionType.CREDIT,
            referenceType: "SIMULATED_DEPOSIT",
            amount: depositAmount,
          }),
        })
      );

      // Wallet returned from deposit should show the post-deposit balance
      expect(result.balances[0].amountFormatted).toBe(1500); // R$1500
    });

    test("deposit is rejected when amount is zero — no ledger entry created", async () => {
      await expect(
        controller.deposit(req as any, { amount: "0", currency: "BRL" })
      ).rejects.toThrow(BadRequestException);

      expect(prisma._tx.walletTransaction.create).not.toHaveBeenCalled();
      expect(prisma._tx.balance.update).not.toHaveBeenCalled();
    });

    test("deposit in ETH applies correct Wei → ETH unit conversion in response", async () => {
      const ethWeiAmount = 1000000000000000000n; // 1 ETH in Wei
      prisma._tx.$queryRaw = mock(async () => [
        { id: "bal-eth", wallet_id: WALLET_ID, currency: "ETH", amount: 2500000000000000000n }
      ] as any);
      prisma.wallet.findUnique = mock(async () => ({
        id: WALLET_ID, playerId: PLAYER_ID, createdAt: now, updatedAt: now,
        balances: [{ id: "bal-eth", walletId: WALLET_ID, currency: "ETH", amount: ethWeiAmount }],
      } as any));

      const result = await controller.deposit(req as any, {
        amount: ethWeiAmount.toString(),
        currency: "ETH",
      });

      // 1e18 Wei = 1 ETH; 1 ETH at mock rate $3500 = $3500 USD
      expect(result.balances[0].amountFormatted).toBe(1); // 1 ETH
      expect(result.balances[0].estimatedUsdValue).toBe(3500);
    });
  });

  // ─── Race condition safety ────────────────────────────────────────────────────
  describe("GET /me — race condition on wallet creation", () => {
    test("returns existing wallet without creating a duplicate when race is detected inside transaction", async () => {
      // First findUnique (outside tx) = null → triggers creation flow
      // Inside tx double-check finds a wallet created concurrently
      prisma.wallet.findUnique = mock(async () => null);
      prisma._tx.wallet.findUnique = mock(async () => ({
        id: WALLET_ID, playerId: PLAYER_ID, createdAt: now, updatedAt: now,
        balances: [{ id: "bal-brl", walletId: WALLET_ID, currency: "BRL", amount: 50000n }],
      } as any));

      const result = await controller.getWallet(req as any);

      expect(result.id).toBe(WALLET_ID);
      // wallet.create should NOT have been called — race was detected
      expect(prisma._tx.wallet.create).not.toHaveBeenCalled();
    });
  });
});
