/**
 * Unit tests for WalletApplicationService.
 * Prisma is fully mocked — no database connection required.
 *
 * Covers: getOrCreateWallet, debit, credit, getTransactions
 */
import { describe, expect, test, beforeEach, mock } from "bun:test";
import { WalletApplicationService } from "../../src/application/services/wallet.application-service";
import { InsufficientBalanceException } from "../../src/domain/wallet.entity";
import { TransactionType } from "../../src/infrastructure/persistence/prisma/client";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PLAYER_ID = "player-1";
const WALLET_ID = "wallet-1";
const now = new Date();

const mockWalletRecord = {
  id: WALLET_ID,
  playerId: PLAYER_ID,
  createdAt: now,
  updatedAt: now,
  balances: [
    { id: "bal-brl", walletId: WALLET_ID, currency: "BRL", amount: 10000n },
    { id: "bal-usd", walletId: WALLET_ID, currency: "USD", amount: 10000n },
    { id: "bal-btc", walletId: WALLET_ID, currency: "BTC", amount: 150000000n },
    { id: "bal-eth", walletId: WALLET_ID, currency: "ETH", amount: 2500000000000000000n },
  ],
};

// Raw SQL $queryRaw returns snake_case field names
const mockRawBalance = { id: "bal-brl", wallet_id: WALLET_ID, currency: "BRL", amount: 10000n };

// ─── Mock factory ─────────────────────────────────────────────────────────────
function createTxMock() {
  return {
    wallet: {
      findUnique: mock(async () => null as any),
      create:     mock(async () => ({ id: WALLET_ID, playerId: PLAYER_ID, createdAt: now, updatedAt: now })),
    },
    balance: {
      create: mock(async ({ data }: any) => ({
        id: `bal-${data.currency.toLowerCase()}`,
        walletId: WALLET_ID,
        currency: data.currency,
        amount: data.amount,
      })),
      update: mock(async () => mockRawBalance),
    },
    walletTransaction: {
      findUnique: mock(async () => null as any),
      create:     mock(async () => ({ id: "tx-1" })),
    },
    $queryRaw: mock(async () => [mockRawBalance] as any),
  };
}

function createPrismaMock() {
  const tx = createTxMock();
  return {
    wallet: {
      findUnique: mock(async () => mockWalletRecord as any),
    },
    $transaction: mock(async (fn: (tx: typeof tx) => unknown) => fn(tx)),
    _tx: tx,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("WalletApplicationService", () => {
  let service: WalletApplicationService;
  let prisma:  ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma  = createPrismaMock();
    service = new WalletApplicationService(prisma as any);
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getOrCreateWallet", () => {
    test("returns existing wallet mapped to domain entity when player already has one", async () => {
      const wallet = await service.getOrCreateWallet(PLAYER_ID);

      expect(wallet.id).toBe(WALLET_ID);
      expect(wallet.playerId).toBe(PLAYER_ID);
      expect(wallet.balances).toHaveLength(4);
      // No transaction should be needed for an existing wallet
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("creates new wallet with 4 seeded balances (BRL, USD, BTC, ETH) when player is new", async () => {
      // Simulate first-time player — no wallet exists
      prisma.wallet.findUnique = mock(async () => null);
      prisma._tx.wallet.findUnique = mock(async () => null); // double-check inside tx also null

      const wallet = await service.getOrCreateWallet(PLAYER_ID);

      expect(wallet.id).toBe(WALLET_ID);
      expect(wallet.balances).toHaveLength(4);
      expect(wallet.balances.map((b) => b.currency)).toContain("BRL");
      expect(wallet.balances.map((b) => b.currency)).toContain("USD");
      expect(wallet.balances.map((b) => b.currency)).toContain("BTC");
      expect(wallet.balances.map((b) => b.currency)).toContain("ETH");
      expect(prisma._tx.balance.create).toHaveBeenCalledTimes(4);
    });

    test("handles race condition: returns existing wallet if another process created it inside tx", async () => {
      // First findUnique (outside tx) = null, but inside tx double-check finds a wallet
      prisma.wallet.findUnique = mock(async () => null);
      prisma._tx.wallet.findUnique = mock(async () => mockWalletRecord as any);

      const wallet = await service.getOrCreateWallet(PLAYER_ID);

      // Should NOT create again — returns the found wallet from double-check
      expect(wallet.id).toBe(WALLET_ID);
      expect(prisma._tx.wallet.create).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("debit", () => {
    beforeEach(() => {
      // Wallet exists and has 10000n BRL
      prisma._tx.wallet.findUnique = mock(async () => ({
        id: WALLET_ID, playerId: PLAYER_ID, createdAt: now, updatedAt: now,
      }));
      prisma._tx.$queryRaw = mock(async () => [mockRawBalance] as any);
      prisma._tx.walletTransaction.findUnique = mock(async () => null);
    });

    test("debits the balance and creates a DEBIT ledger entry on success", async () => {
      await service.debit(PLAYER_ID, 500n, "BRL", "bet-1", "BET_PLACEMENT");

      expect(prisma._tx.balance.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { amount: 9500n } })
      );
      expect(prisma._tx.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: TransactionType.DEBIT, referenceId: "bet-1", amount: -500n }),
        })
      );
    });

    test("throws when debit amount is zero or negative (invalid operation)", async () => {
      await expect(service.debit(PLAYER_ID, 0n,  "BRL", "bet-x", "BET")).rejects.toThrow(
        "Debit amount must be greater than zero"
      );
      await expect(service.debit(PLAYER_ID, -10n, "BRL", "bet-x", "BET")).rejects.toThrow(
        "Debit amount must be greater than zero"
      );
    });

    test("throws when wallet does not exist for the given player", async () => {
      prisma._tx.wallet.findUnique = mock(async () => null);

      await expect(service.debit(PLAYER_ID, 100n, "BRL", "bet-1", "BET")).rejects.toThrow(
        `Wallet not found for player ${PLAYER_ID}`
      );
    });

    test("throws InsufficientBalanceException when balance is lower than debit amount", async () => {
      // Balance is 10000n — trying to debit 99999n should fail
      await expect(service.debit(PLAYER_ID, 99999n, "BRL", "bet-1", "BET")).rejects.toThrow(
        InsufficientBalanceException
      );
    });

    test("skips debit silently when the same referenceId was already processed (idempotent)", async () => {
      // An existing DEBIT transaction for this referenceId already exists
      prisma._tx.walletTransaction.findUnique = mock(async () => ({ id: "existing-tx" }));

      await service.debit(PLAYER_ID, 500n, "BRL", "bet-1", "BET_PLACEMENT");

      // Should NOT update balance or create a new transaction
      expect(prisma._tx.balance.update).not.toHaveBeenCalled();
      expect(prisma._tx.walletTransaction.create).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("credit", () => {
    beforeEach(() => {
      prisma._tx.wallet.findUnique = mock(async () => ({
        id: WALLET_ID, playerId: PLAYER_ID, createdAt: now, updatedAt: now,
      }));
      prisma._tx.$queryRaw = mock(async () => [mockRawBalance] as any);
      prisma._tx.walletTransaction.findUnique = mock(async () => null);
    });

    test("credits an existing balance and creates a CREDIT ledger entry", async () => {
      await service.credit(PLAYER_ID, 500n, "BRL", "cashout-1", "CASHOUT");

      expect(prisma._tx.balance.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { amount: 10500n } })
      );
      expect(prisma._tx.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: TransactionType.CREDIT, referenceId: "cashout-1", amount: 500n }),
        })
      );
    });

    test("creates a new balance entry when the currency does not yet exist in the wallet", async () => {
      // No existing EUR balance — $queryRaw returns empty array
      prisma._tx.$queryRaw = mock(async () => [] as any);

      await service.credit(PLAYER_ID, 200n, "EUR", "ref-1", "CREDIT");

      expect(prisma._tx.balance.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ currency: "EUR", amount: 0n }) })
      );
    });

    test("records a REFUND transaction type when type='REFUND' is specified", async () => {
      await service.credit(PLAYER_ID, 1000n, "BRL", "ref-1", "REFUND", "REFUND");

      expect(prisma._tx.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: TransactionType.REFUND }),
        })
      );
    });

    test("throws when credit amount is zero or negative", async () => {
      await expect(service.credit(PLAYER_ID, 0n,  "BRL", "ref-x", "CREDIT")).rejects.toThrow(
        "Credit amount must be greater than zero"
      );
      await expect(service.credit(PLAYER_ID, -5n, "BRL", "ref-x", "CREDIT")).rejects.toThrow(
        "Credit amount must be greater than zero"
      );
    });

    test("skips credit silently when the same referenceId was already processed (idempotent)", async () => {
      prisma._tx.walletTransaction.findUnique = mock(async () => ({ id: "existing-credit" }));

      await service.credit(PLAYER_ID, 500n, "BRL", "cashout-1", "CASHOUT");

      expect(prisma._tx.balance.update).not.toHaveBeenCalled();
      expect(prisma._tx.walletTransaction.create).not.toHaveBeenCalled();
    });

    test("throws when wallet does not exist for the given player", async () => {
      prisma._tx.wallet.findUnique = mock(async () => null);

      await expect(service.credit(PLAYER_ID, 500n, "BRL", "ref-1", "CREDIT")).rejects.toThrow(
        `Wallet not found for player ${PLAYER_ID}`
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getTransactions", () => {
    test("returns transactions sorted by createdAt descending", async () => {
      const older = new Date("2026-01-01T10:00:00Z");
      const newer = new Date("2026-01-01T11:00:00Z");

      // Wallet with 2 transactions out of order
      prisma.wallet.findUnique = mock(async () => ({
        ...mockWalletRecord,
        balances: [
          {
            ...mockWalletRecord.balances[0],
            transactions: [
              { id: "tx-old", amount: -500n, type: "DEBIT",  referenceType: "BET", referenceId: "b1", createdAt: older },
              { id: "tx-new", amount:  500n, type: "CREDIT", referenceType: "CASHOUT", referenceId: "b2", createdAt: newer },
            ],
          },
        ],
      } as any));

      const txs = await service.getTransactions(PLAYER_ID, 20);

      expect(txs[0].id).toBe("tx-new"); // newest first
      expect(txs[1].id).toBe("tx-old");
    });

    test("returns empty array when wallet does not exist for the player", async () => {
      prisma.wallet.findUnique = mock(async () => null);

      const txs = await service.getTransactions("unknown-player", 20);

      expect(txs).toEqual([]);
    });

    test("maps currency from the parent balance onto each transaction", async () => {
      prisma.wallet.findUnique = mock(async () => ({
        ...mockWalletRecord,
        balances: [
          {
            currency: "ETH",
            transactions: [
              { id: "tx-eth", amount: 1000n, type: "CREDIT", referenceType: "CASHOUT", referenceId: "b1", createdAt: now },
            ],
          },
        ],
      } as any));

      const txs = await service.getTransactions(PLAYER_ID, 20);

      expect(txs[0].currency).toBe("ETH");
    });
  });
});
