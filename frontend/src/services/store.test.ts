import { beforeEach, describe, expect, it } from "vitest";
import { gameStore } from "./store";

describe("GameStore & MockEngine Business Logic", () => {
	beforeEach(() => {
		// Reset state to mock mode with default balances
		gameStore.setMode("mock");
	});

	it("should initialize with mock mode and default values", () => {
		const state = gameStore.getState();
		expect(state.mode).toBe("mock");
		expect(state.username).toBe("GorillaGambler");
		expect(state.playerId).toBe("mock-player-id");
		expect(state.balances.length).toBe(4);

		const brl = state.balances.find((b) => b.currency === "BRL");
		expect(brl?.amount).toBe(500000); // R$ 5000.00
		expect(brl?.amountFormatted).toBe(5000.0);
		expect(brl?.estimatedUsdValue).toBe(900.0); // 5000 * 0.18
	});

	it("should toggle mode and reset state correctly", () => {
		// Toggle to real mode
		gameStore.setMode("real");
		let state = gameStore.getState();
		expect(state.mode).toBe("real");
		expect(state.username).toBeNull();
		expect(state.balances.length).toBe(0);

		// Toggle back to mock mode
		gameStore.setMode("mock");
		state = gameStore.getState();
		expect(state.mode).toBe("mock");
		expect(state.username).toBe("GorillaGambler");
		expect(state.balances.length).toBe(4);
	});

	it("should update balances correctly and calculate USD estimates", () => {
		// Subtract BRL
		gameStore.updateBalance("BRL", -10000); // deduct R$ 100.00 (10000 cents)
		const brl = gameStore.getState().balances.find((b) => b.currency === "BRL");
		expect(brl?.amount).toBe(490000);
		expect(brl?.amountFormatted).toBe(4900.0);
		expect(brl?.estimatedUsdValue).toBe(882.0); // 4900 * 0.18

		// Add USD
		gameStore.updateBalance("USD", 25000); // add $ 250.00 (25000 cents)
		const usd = gameStore.getState().balances.find((b) => b.currency === "USD");
		expect(usd?.amount).toBe(125000);
		expect(usd?.amountFormatted).toBe(1250.0);
		expect(usd?.estimatedUsdValue).toBe(1250.0);

		// Update BTC
		gameStore.updateBalance("BTC", -50000000); // deduct 0.5 BTC (50,000,000 Satoshis)
		const btc = gameStore.getState().balances.find((b) => b.currency === "BTC");
		expect(btc?.amount).toBe(100000000);
		expect(btc?.amountFormatted).toBe(1.0);
		expect(btc?.estimatedUsdValue).toBe(65000.0); // 1.0 * 65000
	});

	it("should enforce non-negative balances", () => {
		// Try to deduct more than available
		gameStore.updateBalance("BRL", -1000000); // deduct R$ 10000.00 (exceeds balance)
		const brl = gameStore.getState().balances.find((b) => b.currency === "BRL");
		expect(brl?.amount).toBe(0); // Clamped at 0
		expect(brl?.amountFormatted).toBe(0);
		expect(brl?.estimatedUsdValue).toBe(0);
	});
});
