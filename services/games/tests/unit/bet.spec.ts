import { describe, expect, test } from "bun:test";
import { Bet, BetStatus } from "../../src/domain/entities/bet.entity";

describe("Bet Entity", () => {
  const createPendingBet = (amount = 1000n) => {
    return new Bet(
      "b1",
      "r1",
      "p1",
      "player_one",
      amount,
      "BRL",
      BetStatus.PENDING,
      null,
      null,
      new Date()
    );
  };

  test("should initialize bet with correct values", () => {
    const createdAt = new Date();
    const bet = new Bet(
      "b1",
      "r1",
      "p1",
      "player_one",
      1000n,
      "BRL",
      BetStatus.PENDING,
      null,
      null,
      createdAt
    );

    expect(bet.id).toBe("b1");
    expect(bet.roundId).toBe("r1");
    expect(bet.playerId).toBe("p1");
    expect(bet.username).toBe("player_one");
    expect(bet.amount).toBe(1000n);
    expect(bet.currency).toBe("BRL");
    expect(bet.status).toBe(BetStatus.PENDING);
    expect(bet.cashOutMultiplier).toBeNull();
    expect(bet.payoutAmount).toBeNull();
    expect(bet.createdAt).toBe(createdAt);
  });

  test("should confirm pending bet", () => {
    const bet = createPendingBet();
    bet.confirm();
    expect(bet.status).toBe(BetStatus.CONFIRMED);
  });

  test("should throw when confirming non-pending bet", () => {
    const bet = createPendingBet();
    bet.confirm(); // Status is CONFIRMED now
    expect(() => bet.confirm()).toThrow("Cannot confirm bet in status CONFIRMED");
  });

  test("should reject pending bet", () => {
    const bet = createPendingBet();
    bet.reject();
    expect(bet.status).toBe(BetStatus.REJECTED);
  });

  test("should throw when rejecting non-pending bet", () => {
    const bet = createPendingBet();
    bet.reject(); // Status is REJECTED now
    expect(() => bet.reject()).toThrow("Cannot reject bet in status REJECTED");
  });

  test("should cashout confirmed bet and calculate payout correctly", () => {
    const bet = createPendingBet(1000n); // 10.00 BRL
    bet.confirm();

    bet.cashout(1.50);

    expect(bet.status).toBe(BetStatus.CASHOUT);
    expect(bet.cashOutMultiplier).toBe(1.50);
    expect(bet.payoutAmount).toBe(1500n); // 1000n * 1.5 = 1500n
  });

  test("should handle float multiplier precision in cashout payout calculation", () => {
    const bet = createPendingBet(1000n);
    bet.confirm();

    bet.cashout(1.557); // multiplierCents will be 155

    expect(bet.status).toBe(BetStatus.CASHOUT);
    expect(bet.cashOutMultiplier).toBe(1.557);
    expect(bet.payoutAmount).toBe(1550n); // 1000n * 155 / 100
  });

  test("should throw when cashout is called on non-confirmed bet", () => {
    const bet = createPendingBet();
    expect(() => bet.cashout(2.0)).toThrow("Cannot cashout bet in status PENDING");

    bet.reject();
    expect(() => bet.cashout(2.0)).toThrow("Cannot cashout bet in status REJECTED");
  });

  test("should mark pending/confirmed bet as lost", () => {
    const pendingBet = createPendingBet();
    pendingBet.markAsLost();
    expect(pendingBet.status).toBe(BetStatus.LOST);

    const confirmedBet = createPendingBet();
    confirmedBet.confirm();
    confirmedBet.markAsLost();
    expect(confirmedBet.status).toBe(BetStatus.LOST);
  });

  test("should not change status when marking as lost if bet already cashed out or rejected", () => {
    const cashedOutBet = createPendingBet();
    cashedOutBet.confirm();
    cashedOutBet.cashout(2.0);
    cashedOutBet.markAsLost();
    expect(cashedOutBet.status).toBe(BetStatus.CASHOUT);

    const rejectedBet = createPendingBet();
    rejectedBet.reject();
    rejectedBet.markAsLost();
    expect(rejectedBet.status).toBe(BetStatus.REJECTED);
  });
});
