import { describe, expect, test } from "bun:test";
import { GameRound, RoundStatus } from "../../src/domain/aggregates/round.aggregate";
import { Bet, BetStatus } from "../../src/domain/entities/bet.entity";

describe("GameRound Aggregate", () => {
  const createRound = (status = RoundStatus.BETTING, crashPoint = 2.5) => {
    return new GameRound(
      "r1",
      "g1",
      status,
      "serverSeed",
      "serverSeedHash",
      "clientSeed",
      crashPoint,
      [],
      new Date(),
      null
    );
  };

  const createBet = (playerId = "p1", status = BetStatus.PENDING) => {
    return new Bet(
      `b-${playerId}`,
      "r1",
      playerId,
      `player-${playerId}`,
      1000n,
      "BRL",
      status,
      null,
      null,
      new Date()
    );
  };

  test("should initialize round with correct values", () => {
    const createdAt = new Date();
    const round = new GameRound(
      "r1",
      "g1",
      RoundStatus.BETTING,
      "serverSeed",
      "serverSeedHash",
      "clientSeed",
      2.5,
      [],
      createdAt,
      null
    );

    expect(round.id).toBe("r1");
    expect(round.gameId).toBe("g1");
    expect(round.status).toBe(RoundStatus.BETTING);
    expect(round.serverSeed).toBe("serverSeed");
    expect(round.serverSeedHash).toBe("serverSeedHash");
    expect(round.clientSeed).toBe("clientSeed");
    expect(round.crashPoint).toBe(2.5);
    expect(round.bets).toEqual([]);
    expect(round.createdAt).toBe(createdAt);
    expect(round.endedAt).toBeNull();
  });

  test("should add bet successfully during BETTING phase", () => {
    const round = createRound();
    const bet = createBet();

    round.addBet(bet);
    expect(round.bets).toEqual([bet]);
  });

  test("should throw when adding bet outside of BETTING phase", () => {
    const roundGameplay = createRound(RoundStatus.GAMEPLAY);
    const roundCrashed = createRound(RoundStatus.CRASHED);
    const bet = createBet();

    expect(() => roundGameplay.addBet(bet)).toThrow("Bets are only allowed during the BETTING phase");
    expect(() => roundCrashed.addBet(bet)).toThrow("Bets are only allowed during the BETTING phase");
  });

  test("should throw when same player places multiple bets in the same round", () => {
    const round = createRound();
    const bet1 = createBet("p1");
    const bet2 = createBet("p1");

    round.addBet(bet1);
    expect(() => round.addBet(bet2)).toThrow("Player has already placed a bet in this round");
  });

  test("should retrieve bet by player ID", () => {
    const round = createRound();
    const bet = createBet("p1");
    round.addBet(bet);

    expect(round.getBetByPlayer("p1")).toBe(bet);
    expect(round.getBetByPlayer("p2")).toBeUndefined();
  });

  test("should confirm bet successfully", () => {
    const round = createRound();
    const bet = createBet("p1");
    round.addBet(bet);

    round.confirmBet("p1");
    expect(bet.status).toBe(BetStatus.CONFIRMED);
  });

  test("should throw when confirming non-existent bet", () => {
    const round = createRound();
    expect(() => round.confirmBet("p1")).toThrow("No bet found for player p1");
  });

  test("should reject bet successfully", () => {
    const round = createRound();
    const bet = createBet("p1");
    round.addBet(bet);

    round.rejectBet("p1");
    expect(bet.status).toBe(BetStatus.REJECTED);
  });

  test("should throw when rejecting non-existent bet", () => {
    const round = createRound();
    expect(() => round.rejectBet("p1")).toThrow("No bet found for player p1");
  });

  test("should transition to GAMEPLAY status", () => {
    const round = createRound();
    round.startGameplay();
    expect(round.status).toBe(RoundStatus.GAMEPLAY);
  });

  test("should throw when starting gameplay from non-BETTING status", () => {
    const roundGameplay = createRound(RoundStatus.GAMEPLAY);
    const roundCrashed = createRound(RoundStatus.CRASHED);

    expect(() => roundGameplay.startGameplay()).toThrow("Can only start gameplay from BETTING status");
    expect(() => roundCrashed.startGameplay()).toThrow("Can only start gameplay from BETTING status");
  });

  test("should cashout bet successfully during GAMEPLAY phase", () => {
    const round = createRound(RoundStatus.BETTING, 3.0);
    const bet = createBet("p1");
    bet.confirm();
    round.addBet(bet);
    round.startGameplay();

    const cashedOutBet = round.cashoutBet("p1", 2.0);
    expect(cashedOutBet.status).toBe(BetStatus.CASHOUT);
    expect(cashedOutBet.cashOutMultiplier).toBe(2.0);
    expect(cashedOutBet.payoutAmount).toBe(2000n);
  });

  test("should throw when cashing out outside of GAMEPLAY phase", () => {
    const roundBetting = createRound(RoundStatus.BETTING, 3.0);
    const bet = createBet("p1");
    bet.confirm();
    roundBetting.addBet(bet);

    expect(() => roundBetting.cashoutBet("p1", 2.0)).toThrow("Cash out is only allowed during the GAMEPLAY phase");
  });

  test("should throw when cashing out at or above crash point", () => {
    const round = createRound(RoundStatus.BETTING, 2.5);
    const bet = createBet("p1");
    bet.confirm();
    round.addBet(bet);
    round.startGameplay();

    expect(() => round.cashoutBet("p1", 2.5)).toThrow("Cannot cash out at 2.5x as the game crashed at 2.5x");
    expect(() => round.cashoutBet("p1", 3.0)).toThrow("Cannot cash out at 3x as the game crashed at 2.5x");
  });

  test("should throw when cashing out for a player with no bet in the round", () => {
    const round = createRound(RoundStatus.GAMEPLAY, 3.0);
    expect(() => round.cashoutBet("p2", 2.0)).toThrow("No bet placed by player p2 in this round");
  });

  test("should crash successfully from GAMEPLAY status and mark active bets as lost", () => {
    const round = createRound(RoundStatus.BETTING, 2.5);
    const bet1 = createBet("p1"); // pending
    const bet2 = createBet("p2"); // confirmed
    bet2.confirm();
    const bet3 = createBet("p3"); // cashed out
    bet3.confirm();
    bet3.cashout(1.8);

    round.addBet(bet1);
    round.addBet(bet2);
    round.addBet(bet3);
    round.startGameplay();

    round.crash();

    expect(round.status).toBe(RoundStatus.CRASHED);
    expect(round.endedAt).toBeInstanceOf(Date);
    expect(bet1.status).toBe(BetStatus.LOST);
    expect(bet2.status).toBe(BetStatus.LOST);
    expect(bet3.status).toBe(BetStatus.CASHOUT); // stays CASHOUT
  });

  test("should throw when crashing from non-GAMEPLAY status", () => {
    const roundBetting = createRound(RoundStatus.BETTING);
    const roundCrashed = createRound(RoundStatus.CRASHED);

    expect(() => roundBetting.crash()).toThrow("Can only crash from GAMEPLAY status");
    expect(() => roundCrashed.crash()).toThrow("Can only crash from GAMEPLAY status");
  });
});
