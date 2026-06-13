import axios from "axios";
import { mockEngine } from "./mock-engine";
import type { Balance, Bet } from "./store";
import { gameStore } from "./store";

const API_BASE = "http://localhost:8000";

// Instantiate the custom Axios client
const apiClient = axios.create({
	baseURL: API_BASE,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

// Configure Request Interceptors to auto-inject token keys
apiClient.interceptors.request.use(
	(config) => {
		const state = gameStore.getState();
		if (state.token && config.headers) {
			config.headers.Authorization = `Bearer ${state.token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

class ApiService {
	private parseError(err: unknown, defaultMsg: string): Error {
		if (axios.isAxiosError(err)) {
			const serverMsg = err.response?.data?.message || err.response?.data;
			if (serverMsg) {
				return new Error(
					typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg),
				);
			}
			return new Error(err.message || defaultMsg);
		}
		return err instanceof Error ? err : new Error(defaultMsg);
	}

	public async getWallet(): Promise<Balance[]> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return state.balances;
		}

		try {
			const response = await apiClient.get("/wallets/me");
			const data = response.data;
			gameStore.setState({ balances: data.balances });
			return data.balances;
		} catch (err) {
			console.error("[ApiService] Error fetching wallet:", err);
			throw this.parseError(err, "Failed to fetch wallet info");
		}
	}

	public async createWallet(): Promise<Balance[]> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return state.balances;
		}

		try {
			const response = await apiClient.post("/wallets");
			const data = response.data;
			gameStore.setState({ balances: data.balances });
			return data.balances;
		} catch (err) {
			console.error("[ApiService] Error creating wallet:", err);
			throw this.parseError(err, "Failed to create wallet");
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: API response is dynamically typed
	public async deposit(currency: string, amount: number): Promise<any> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			gameStore.updateBalance(currency, amount);
			return;
		}

		try {
			const response = await apiClient.post("/wallets/deposit", {
				amount: amount.toString(),
				currency,
			});
			const data = response.data;
			gameStore.setState({ balances: data.balances });
			return data;
		} catch (err) {
			console.error("[ApiService] Error depositing:", err);
			throw this.parseError(err, "Failed to deposit funds");
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
			const response = await apiClient.post("/games/bet", { amount, currency });
			const bet = response.data;

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
			throw this.parseError(err, "Failed to place bet");
		}
	}

	public async cashout(multiplier: number): Promise<Bet> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return mockEngine.userCashout(multiplier);
		}

		try {
			const response = await apiClient.post("/games/bet/cashout", {
				multiplier,
			});
			const bet = response.data;

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
			throw this.parseError(err, "Failed to cashout");
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: API response is dynamically typed
	public async getCurrentRound(): Promise<any> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return null;
		}

		try {
			const response = await apiClient.get("/games/rounds/current");
			return response.data;
		} catch (err) {
			console.error("[ApiService] Error getting current round:", err);
			throw this.parseError(err, "Failed to get current round");
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: API response is dynamically typed
	public async getRoundsHistory(limit = 20, offset = 0): Promise<any> {
		const state = gameStore.getState();
		if (state.mode === "mock") {
			return { items: state.roundHistory, total: state.roundHistory.length };
		}

		try {
			const response = await apiClient.get(
				`/games/rounds/history?limit=${limit}&offset=${offset}`,
			);
			return response.data;
		} catch (err) {
			console.error("[ApiService] Error getting rounds history:", err);
			throw this.parseError(err, "Failed to get history");
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: API response is dynamically typed
	public async verifyRound(roundId: string): Promise<any> {
		try {
			const response = await apiClient.get(`/games/rounds/${roundId}/verify`);
			return response.data;
		} catch (err) {
			console.error("[ApiService] Error verifying round:", err);
			throw this.parseError(err, "Failed to verify round");
		}
	}
}

export const apiService = new ApiService();
export default apiService;
