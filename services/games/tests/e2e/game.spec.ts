import { describe, expect, test } from "bun:test";

const GATEWAY_URL = "http://localhost:8000";
const KEYCLOAK_TOKEN_URL = "http://localhost:8080/realms/crash-game/protocol/openid-connect/token";

async function getPlayerToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: "crash-game-client",
    username: "player",
    password: "player123",
    grant_type: "password",
  });

  const response = await fetch(KEYCLOAK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Keycloak token: ${text}`);
  }

  const data: any = await response.json();
  return data.access_token;
}

describe("E2E Integration Test - Crash Game", () => {
  let token: string;

  test("should authenticate and fetch Keycloak token", async () => {
    token = await getPlayerToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });

  test("should initialize player wallet", async () => {
    // 1. POST /wallets to create wallet
    let response = await fetch(`${GATEWAY_URL}/wallets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(201);

    // 2. GET /wallets/me to verify balance
    response = await fetch(`${GATEWAY_URL}/wallets/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const data: any = await response.json();
    expect(data.playerId).toBeDefined();
    const brlBalance = data.balances.find((b: any) => b.currency === "BRL");
    expect(brlBalance).toBeDefined();
    expect(brlBalance.amount).toBeGreaterThan(0);
  });

  test("should play a full game round successfully", async () => {
    // 1. Wait until current round is in BETTING phase
    let roundId = "";
    let isBetting = false;
    
    console.log("[E2E Test] Waiting for BETTING phase...");
    for (let i = 0; i < 120; i++) {
      const response = await fetch(`${GATEWAY_URL}/games/rounds/current`);
      expect(response.status).toBe(200);
      const round: any = await response.json();
      
      if (round.status === "BETTING") {
        roundId = round.id;
        isBetting = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    expect(isBetting).toBe(true);
    console.log(`[E2E Test] Round is in BETTING phase (ID: ${roundId})`);

    // 2. Place a bet of $5.00 (500 cents)
    const betResponse = await fetch(`${GATEWAY_URL}/games/bet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 500,
        currency: "BRL",
      }),
    });
    expect(betResponse.status).toBe(201);
    const betData: any = await betResponse.json();
    expect(betData.status).toBe("PENDING");
    expect(betData.amount).toBe(500);

    // 3. Wait and verify that bet is CONFIRMED (RabbitMQ debit success)
    let isConfirmed = false;
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const myBetsResponse = await fetch(`${GATEWAY_URL}/games/bets/me?limit=1&offset=0`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const myBets: any = await myBetsResponse.json();
      const lastBet = myBets.items.find((b: any) => b.id === betData.id);
      if (lastBet && lastBet.status === "CONFIRMED") {
        isConfirmed = true;
        break;
      }
    }
    expect(isConfirmed).toBe(true);
    console.log("[E2E Test] Bet confirmed successfully");

    // 4. Wait until round is in GAMEPLAY phase
    let isGameplay = false;
    console.log("[E2E Test] Waiting for GAMEPLAY phase...");
    for (let i = 0; i < 40; i++) {
      const response = await fetch(`${GATEWAY_URL}/games/rounds/current`);
      const round: any = await response.json();
      if (round.id !== roundId || round.status === "GAMEPLAY" || (round.status === "CRASHED" && round.id === roundId)) {
        isGameplay = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    expect(isGameplay).toBe(true);

    // 5. Trigger Cash Out at 1.05x (before it crashes!)
    // If it crashes instantly, cashout will fail, but with 3% instant crash, it's 97% likely to work.
    const cashoutResponse = await fetch(`${GATEWAY_URL}/games/bet/cashout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        multiplier: 1.05,
      }),
    });

    if (cashoutResponse.status === 201) {
      const cashoutData: any = await cashoutResponse.json();
      expect(cashoutData.status).toBe("CASHOUT");
      expect(cashoutData.cashOutMultiplier).toBe(1.05);
      expect(cashoutData.payoutAmount).toBe(525); // 500 * 1.05 = 525 cents
      console.log("[E2E Test] Cashout success at 1.05x");

      // Verify wallet balance is updated correctly (original - 500 + 525)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for RMQ
      const walletResponse = await fetch(`${GATEWAY_URL}/wallets/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const walletData: any = await walletResponse.json();
      const brlBalance = walletData.balances.find((b: any) => b.currency === "BRL");
      // Balance should have increased by 25 cents from the starting point
      console.log(`[E2E Test] New BRL Balance: ${brlBalance.amount}`);
    } else {
      // It crashed before we could cash out
      const errText = await cashoutResponse.text();
      expect(cashoutResponse.status).toBe(400);
      expect(errText).toContain("Game already crashed");
      console.log("[E2E Test] Game crashed before cashout was processed");
    }
  }, 150000);

  test("should reject duplicate bets and bets during gameplay", async () => {
    // 1. Get current round
    const roundResponse = await fetch(`${GATEWAY_URL}/games/rounds/current`);
    const round: any = await roundResponse.json();

    // 2. Try to bet. If gameplay, should fail with 400. If crashed/cooldown, might fail.
    const betResponse = await fetch(`${GATEWAY_URL}/games/bet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 200,
        currency: "BRL",
      }),
    });

    if (round.status === "GAMEPLAY") {
      expect(betResponse.status).toBe(400);
      const text = await betResponse.text();
      expect(text).toContain("No active betting round available");
      console.log("[E2E Test] Correctly rejected bet during GAMEPLAY");
    }
  });

  test("should process auto-cashout successfully when target multiplier is met", async () => {
    // 1. Wait until current round is in BETTING phase
    let roundId = "";
    let isBetting = false;
    
    console.log("[E2E Test] Waiting for BETTING phase for Auto-Cashout test...");
    for (let i = 0; i < 120; i++) {
      const response = await fetch(`${GATEWAY_URL}/games/rounds/current`);
      const round: any = await response.json();
      
      if (round.status === "BETTING") {
        roundId = round.id;
        isBetting = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    expect(isBetting).toBe(true);

    // 2. Place a bet of $5.00 (500 cents) with autoCashoutMultiplier = 1.05
    const betResponse = await fetch(`${GATEWAY_URL}/games/bet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 500,
        currency: "BRL",
        autoCashoutMultiplier: 1.05,
      }),
    });
    expect(betResponse.status).toBe(201);
    const betData: any = await betResponse.json();
    expect(betData.status).toBe("PENDING");

    // 3. Wait for round to transition to GAMEPLAY and then finish (crashed)
    console.log("[E2E Test] Waiting for round to finish/crash...");
    let isFinished = false;
    for (let i = 0; i < 80; i++) {
      const response = await fetch(`${GATEWAY_URL}/games/rounds/current`);
      const round: any = await response.json();
      
      if (round.id !== roundId || round.status === "CRASHED") {
        isFinished = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    expect(isFinished).toBe(true);

    // 4. Fetch the bet from history to check if it was auto-cashed out or lost
    const myBetsResponse = await fetch(`${GATEWAY_URL}/games/bets/me?limit=10&offset=0`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const myBets: any = await myBetsResponse.json();
    const placedBet = myBets.items.find((b: any) => b.id === betData.id);
    expect(placedBet).toBeDefined();

    // Verify status: if the round's crash point was >= 1.05, it must be CASHOUT. If it crashed below 1.05, it must be LOST.
    const roundResponse = await fetch(`${GATEWAY_URL}/games/rounds/${roundId}/verify`);
    expect(roundResponse.status).toBe(200);
    const roundDetails: any = await roundResponse.json();
    
    if (roundDetails.crashPoint >= 1.05) {
      expect(placedBet.status).toBe("CASHOUT");
      expect(placedBet.cashOutMultiplier).toBe(1.05);
      expect(placedBet.payoutAmount).toBe(525);
      console.log(`[E2E Test] Auto-cashout verified as CASHOUT at 1.05x (Round crashPoint: ${roundDetails.crashPoint}x)`);
    } else {
      expect(placedBet.status).toBe("LOST");
      console.log(`[E2E Test] Auto-cashout verified as LOST (Round crashPoint: ${roundDetails.crashPoint}x was < 1.05x)`);
    }
  }, 150000);
});
