/**
 * Unit tests for games mutations.
 * apiClient and gameStore are mocked — tests focus on correct API call
 * arguments, store update side-effects, and error propagation.
 *
 * The hook variants (usePlaceBet, useCashout) delegate heavy lifting to
 * TanStack Query internals; only cashoutFn (the plain async function used by
 * socket.service.ts in a non-React context) is unit-tested here in depth.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../core/apiClient", () => ({
	apiClient: { post: vi.fn() },
	parseApiError: (_err: unknown, defaultMsg: string) => new Error(defaultMsg),
}));

vi.mock("../core/store", () => ({
	gameStore: {
		getState: vi.fn(() => ({
			playerId: "player-1",
			activeBets: [] as Array<{ playerId: string }>,
			error: null as string | null,
		})),
		setState: vi.fn(),
		updateBalance: vi.fn(),
	},
}));

import { apiClient } from "../core/apiClient";
import { gameStore } from "../core/store";
import { cashoutFn } from "./games.mutations";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const mockBet = {
	id: "bet-1",
	roundId: "round-1",
	playerId: "player-1",
	username: "player",
	amount: 1000,
	currency: "BRL",
	status: "CASHOUT" as const,
	cashOutMultiplier: 1.5,
	payoutAmount: 1500,
};

// ─── cashoutFn() ──────────────────────────────────────────────────────────────
describe("cashoutFn()", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(gameStore.getState).mockReturnValue({
			playerId: "player-1",
			activeBets: [{ playerId: "player-1" }] as any,
		} as any);
	});

	it("posts to /games/bet/cashout with the given multiplier", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockBet });

		await cashoutFn(1.5);

		expect(apiClient.post).toHaveBeenCalledWith("/games/bet/cashout", {
			multiplier: 1.5,
		});
	});

	it("calls gameStore.setState with the returned bet as userBet", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockBet });

		await cashoutFn(1.5);

		expect(gameStore.setState).toHaveBeenCalledWith(
			expect.objectContaining({ userBet: mockBet }),
		);
	});

	it("updates activeBets: maps own bet to the returned updated bet", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockBet });

		await cashoutFn(1.5);

		const call = vi.mocked(gameStore.setState).mock.calls[0][0] as {
			activeBets: unknown[];
		};
		expect(call.activeBets[0]).toEqual(mockBet);
	});

	it("returns the bet object from the API response", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockBet });

		const result = await cashoutFn(2.0);

		expect(result).toEqual(mockBet);
	});

	it("throws an error when the API call fails", async () => {
		vi.mocked(apiClient.post).mockRejectedValue(new Error("network error"));

		await expect(cashoutFn(1.5)).rejects.toThrow("Failed to cashout");
	});

	it("calls the API regardless of the multiplier value (includes 1.0x)", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockBet });

		await cashoutFn(1.0);

		expect(apiClient.post).toHaveBeenCalledWith("/games/bet/cashout", {
			multiplier: 1.0,
		});
	});
});
