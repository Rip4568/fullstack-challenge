import { mockEngine } from "./mock-engine";
import type { Balance, Bet } from "./store";
import { gameStore } from "./store";

const API_BASE = "http://localhost:8000";

class ApiService {
	private getHeaders() {
		const state = gameStore.getState();
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (state.token) {
			headers.Authorization = `Bearer ${state.token}`;
		}
		return headers;
	}

	public async getWallet(): Promise<Balance[]> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return state.balances;
		}

		try {
			const res = await fetch(`${API_BASE}/wallets/me`, {
				method: "GET",
				headers: this.getHeaders(),
			});
			if (!res.ok) {
				throw new Error((await res.text()) || "Failed to fetch wallet info");
			}
			const data = await res.json();
			// Ensure we update balances in store
			gameStore.setState({ balances: data.balances });
			return data.balances;
		} catch (err) {
			console.error("[ApiService] Error fetching wallet:", err);
			throw err;
		}
	}

	public async createWallet(): Promise<Balance[]> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return state.balances;
		}

		try {
			const res = await fetch(`${API_BASE}/wallets`, {
				method: "POST",
				headers: this.getHeaders(),
			});
			if (!res.ok) {
				throw new Error((await res.text()) || "Failed to create wallet");
			}
			const data = await res.json();
			gameStore.setState({ balances: data.balances });
			return data.balances;
		} catch (err) {
			console.error("[ApiService] Error creating wallet:", err);
			throw err;
		}
	}

	public async placeBet(
		amount: number,
		currency: string,
		autoCashoutMultiplier?: number | null,
	): Promise<Bet> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return mockEngine.userPlaceBet(amount, currency, autoCashoutMultiplier);
		}

		try {
			const res = await fetch(`${API_BASE}/games/bet`, {
				method: "POST",
				headers: this.getHeaders(),
				body: JSON.stringify({ amount, currency }),
			});
			if (!res.ok) {
				const errorText = await res.text();
				let errorMsg = "Failed to place bet";
				try {
					const parsed = JSON.parse(errorText);
					errorMsg = parsed.message || errorMsg;
				} catch {
					errorMsg = errorText || errorMsg;
				}
				throw new Error(errorMsg);
			}
			const bet = await res.json();

			// Store autoCashoutMultiplier locally in the bet if provided
			if (autoCashoutMultiplier) {
				bet.autoCashoutMultiplier = autoCashoutMultiplier;
			}

			// Prepend to active bets and set user bet
			gameStore.setState({
				userBet: bet,
				activeBets: [bet, ...gameStore.getState().activeBets],
			});

			// Update balance locally for better responsiveness
			gameStore.updateBalance(currency, -amount);

			return bet;
		} catch (err) {
			console.error("[ApiService] Error placing bet:", err);
			throw err;
		}
	}

	public async cashout(multiplier: number): Promise<Bet> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return mockEngine.userCashout(multiplier);
		}

		try {
			const res = await fetch(`${API_BASE}/games/bet/cashout`, {
				method: "POST",
				headers: this.getHeaders(),
				body: JSON.stringify({ multiplier }),
			});
			if (!res.ok) {
				const errorText = await res.text();
				let errorMsg = "Failed to cashout";
				try {
					const parsed = JSON.parse(errorText);
					errorMsg = parsed.message || errorMsg;
				} catch {
					errorMsg = errorText || errorMsg;
				}
				throw new Error(errorMsg);
			}
			const bet = await res.json();

			// Update user bet and active bets list
			gameStore.setState({
				userBet: bet,
				activeBets: gameStore
					.getState()
					.activeBets.map((b) => (b.playerId === state.playerId ? bet : b)),
			});

			// Refetch wallet to get fresh balance
			await this.getWallet();

			return bet;
		} catch (err) {
			console.error("[ApiService] Error during cashout:", err);
			throw err;
		}
	}

	public async getCurrentRound(): Promise<any> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return null;
		}

		try {
			const res = await fetch(`${API_BASE}/games/rounds/current`, {
				method: "GET",
				headers: this.getHeaders(),
			});
			if (!res.ok) {
				throw new Error("Failed to get current round");
			}
			return await res.json();
		} catch (err) {
			console.error("[ApiService] Error getting current round:", err);
			throw err;
		}
	}

	public async getRoundsHistory(limit = 20, offset = 0): Promise<any> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return { items: state.roundHistory, total: state.roundHistory.length };
		}

		try {
			const res = await fetch(
				`${API_BASE}/games/rounds/history?limit=${limit}&offset=${offset}`,
				{
					method: "GET",
					headers: this.getHeaders(),
				},
			);
			if (!res.ok) {
				throw new Error("Failed to get history");
			}
			return await res.json();
		} catch (err) {
			console.error("[ApiService] Error getting rounds history:", err);
			throw err;
		}
	}

	public async verifyRound(roundId: string): Promise<any> {
		try {
			const res = await fetch(`${API_BASE}/games/rounds/${roundId}/verify`, {
				method: "GET",
				headers: this.getHeaders(),
			});
			if (!res.ok) {
				throw new Error("Failed to verify round");
			}
			return await res.json();
		} catch (err) {
			console.error("[ApiService] Error verifying round:", err);
			throw err;
		}
	}
}

export const apiService = new ApiService();
export default apiService;
