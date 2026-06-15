/**
 * Unit tests for wallet mutations.
 * apiClient and gameStore are mocked. Tests validate:
 *   - Mock mode short-circuit (updateBalance called, API skipped)
 *   - Real mode API call with correct serialized arguments
 *   - gameStore.setState called with updated balances on success
 *
 * Uses renderHook + QueryClientProvider to exercise the full hook lifecycle.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("../core/apiClient", () => ({
	apiClient: { post: vi.fn() },
	parseApiError: (_err: unknown, defaultMsg: string) => new Error(defaultMsg),
}));

let mockMode: "mock" | "real" = "real";
const mockBalances = [{ currency: "BRL", amount: 10000, amountFormatted: 100, estimatedUsdValue: 18 }];

vi.mock("../core/store", () => ({
	gameStore: {
		getState: vi.fn(() => ({ mode: mockMode, balances: mockBalances })),
		setState: vi.fn(),
		updateBalance: vi.fn(),
	},
}));

import { useDeposit } from "./wallet.mutations";
import { apiClient } from "../core/apiClient";
import { gameStore } from "../core/store";

// ─── Test wrapper ─────────────────────────────────────────────────────────────
function wrapper({ children }: { children: React.ReactNode }) {
	const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
	return React.createElement(QueryClientProvider, { client: qc }, children);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const mockWalletResponse = {
	id: "w1",
	playerId: "p1",
	balances: [{ currency: "BRL", amount: 15000, amountFormatted: 150, estimatedUsdValue: 27 }],
};

// ─── useDeposit() ─────────────────────────────────────────────────────────────
describe("useDeposit()", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockMode = "real";
		vi.mocked(gameStore.getState).mockImplementation(() => ({ mode: mockMode, balances: mockBalances }));
	});

	// Real mode ────────────────────────────────────────────────────────────────
	it("posts to /wallets/deposit with amount as string and currency in real mode", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockWalletResponse });

		const { result } = renderHook(() => useDeposit(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({ currency: "BRL", amount: 5000 });
		});

		expect(apiClient.post).toHaveBeenCalledWith("/wallets/deposit", {
			amount: "5000",
			currency: "BRL",
		});
	});

	it("updates gameStore with the balances from the API response on success", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockWalletResponse });

		const { result } = renderHook(() => useDeposit(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({ currency: "BRL", amount: 5000 });
		});

		expect(gameStore.setState).toHaveBeenCalledWith(
			expect.objectContaining({ balances: mockWalletResponse.balances })
		);
	});

	it("returns the wallet response from the API on success", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockWalletResponse });

		const { result } = renderHook(() => useDeposit(), { wrapper });

		let returnValue: unknown;
		await act(async () => {
			returnValue = await result.current.mutateAsync({ currency: "USD", amount: 1000 });
		});

		expect(returnValue).toEqual(mockWalletResponse);
	});

	// Mock mode ────────────────────────────────────────────────────────────────
	it("bypasses API and calls updateBalance directly in mock mode", async () => {
		mockMode = "mock";
		vi.mocked(gameStore.getState).mockReturnValue({ mode: "mock", balances: mockBalances });

		const { result } = renderHook(() => useDeposit(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({ currency: "BRL", amount: 2000 });
		});

		expect(apiClient.post).not.toHaveBeenCalled();
		expect(gameStore.updateBalance).toHaveBeenCalledWith("BRL", 2000);
	});

	it("returns undefined in mock mode (no API response to return)", async () => {
		mockMode = "mock";
		vi.mocked(gameStore.getState).mockReturnValue({ mode: "mock", balances: mockBalances });

		const { result } = renderHook(() => useDeposit(), { wrapper });

		let returnValue: unknown = "not-undefined";
		await act(async () => {
			returnValue = await result.current.mutateAsync({ currency: "USD", amount: 500 });
		});

		expect(returnValue).toBeUndefined();
	});

	it("does not call gameStore.setState in mock mode (balance updated via updateBalance)", async () => {
		mockMode = "mock";
		vi.mocked(gameStore.getState).mockReturnValue({ mode: "mock", balances: mockBalances });

		const { result } = renderHook(() => useDeposit(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({ currency: "ETH", amount: 1000 });
		});

		expect(gameStore.setState).not.toHaveBeenCalled();
	});

	// Currency variants ────────────────────────────────────────────────────────
	it("works for all four supported currencies in real mode", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({ data: mockWalletResponse });

		for (const currency of ["BRL", "USD", "BTC", "ETH"]) {
			const { result } = renderHook(() => useDeposit(), { wrapper });
			await act(async () => {
				await result.current.mutateAsync({ currency, amount: 1000 });
			});
			expect(apiClient.post).toHaveBeenCalledWith("/wallets/deposit", { amount: "1000", currency });
			vi.clearAllMocks();
			vi.mocked(gameStore.getState).mockImplementation(() => ({ mode: "real", balances: mockBalances }));
		}
	});
});
