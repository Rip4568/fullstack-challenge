import { describe, expect, test } from "bun:test";
import { Wallet, Balance, InsufficientBalanceException } from "../../src/domain/wallet.entity";

describe("Balance", () => {
  test("should initialize balance with correct values", () => {
    const balance = new Balance("b1", "w1", "BRL", 1000n);
    expect(balance.id).toBe("b1");
    expect(balance.walletId).toBe("w1");
    expect(balance.currency).toBe("BRL");
    expect(balance.amount).toBe(1000n);
  });

  test("should debit successfully when balance is sufficient", () => {
    const balance = new Balance("b1", "w1", "BRL", 1000n);
    balance.debit(300n);
    expect(balance.amount).toBe(700n);
  });

  test("should throw when debiting a non-positive amount", () => {
    const balance = new Balance("b1", "w1", "BRL", 1000n);
    expect(() => balance.debit(0n)).toThrow("Debit amount must be greater than zero");
    expect(() => balance.debit(-50n)).toThrow("Debit amount must be greater than zero");
  });

  test("should throw InsufficientBalanceException when balance is insufficient", () => {
    const balance = new Balance("b1", "w1", "BRL", 500n);
    expect(() => balance.debit(600n)).toThrow(InsufficientBalanceException);
    expect(() => balance.debit(600n)).toThrow("Insufficient balance for BRL. Required: 600, Available: 500");
  });

  test("should credit successfully when amount is positive", () => {
    const balance = new Balance("b1", "w1", "BRL", 1000n);
    balance.credit(500n);
    expect(balance.amount).toBe(1500n);
  });

  test("should throw when crediting a non-positive amount", () => {
    const balance = new Balance("b1", "w1", "BRL", 1000n);
    expect(() => balance.credit(0n)).toThrow("Credit amount must be greater than zero");
    expect(() => balance.credit(-50n)).toThrow("Credit amount must be greater than zero");
  });
});

describe("Wallet", () => {
  test("should initialize wallet with correct values", () => {
    const createdAt = new Date();
    const updatedAt = new Date();
    const balance = new Balance("b1", "w1", "BRL", 1000n);
    const wallet = new Wallet("w1", "p1", [balance], createdAt, updatedAt);

    expect(wallet.id).toBe("w1");
    expect(wallet.playerId).toBe("p1");
    expect(wallet.balances).toEqual([balance]);
    expect(wallet.createdAt).toBe(createdAt);
    expect(wallet.updatedAt).toBe(updatedAt);
  });

  test("should return a copy of the balances array", () => {
    const balance = new Balance("b1", "w1", "BRL", 1000n);
    const wallet = new Wallet("w1", "p1", [balance], new Date(), new Date());

    const balances = wallet.balances;
    balances.push(new Balance("b2", "w1", "USD", 500n));

    expect(wallet.balances.length).toBe(1);
  });

  test("should get balance by currency", () => {
    const balanceBrl = new Balance("b1", "w1", "BRL", 1000n);
    const balanceUsd = new Balance("b2", "w1", "USD", 500n);
    const wallet = new Wallet("w1", "p1", [balanceBrl, balanceUsd], new Date(), new Date());

    expect(wallet.getBalance("BRL")).toBe(balanceBrl);
    expect(wallet.getBalance("USD")).toBe(balanceUsd);
    expect(wallet.getBalance("EUR")).toBeUndefined();
  });

  test("should debit from correct balance", () => {
    const balanceBrl = new Balance("b1", "w1", "BRL", 1000n);
    const wallet = new Wallet("w1", "p1", [balanceBrl], new Date(), new Date());

    wallet.debit(400n, "BRL");
    expect(balanceBrl.amount).toBe(600n);
  });

  test("should throw InsufficientBalanceException when debiting currency with no balance", () => {
    const wallet = new Wallet("w1", "p1", [], new Date(), new Date());
    expect(() => wallet.debit(100n, "EUR")).toThrow(InsufficientBalanceException);
    expect(() => wallet.debit(100n, "EUR")).toThrow("Insufficient balance. No balance found for currency EUR");
  });

  test("should credit existing balance", () => {
    const balanceBrl = new Balance("b1", "w1", "BRL", 1000n);
    const wallet = new Wallet("w1", "p1", [balanceBrl], new Date(), new Date());

    wallet.credit(500n, "BRL");
    expect(balanceBrl.amount).toBe(1500n);
    expect(wallet.balances.length).toBe(1);
  });

  test("should create and credit new balance if currency not present", () => {
    const wallet = new Wallet("w1", "p1", [], new Date(), new Date());

    wallet.credit(500n, "EUR");
    const balance = wallet.getBalance("EUR");
    expect(balance).toBeDefined();
    expect(balance?.amount).toBe(500n);
    expect(balance?.walletId).toBe("w1");
    expect(wallet.balances.length).toBe(1);
  });
});
