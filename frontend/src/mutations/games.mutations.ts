import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "../core/apiClient";
import type { Bet } from "../core/store";
import { gameStore } from "../core/store";

// Plain async function — usável em contextos não-React (socket.service.ts)
export async function cashoutFn(multiplier: number): Promise<Bet> {
	const { playerId } = gameStore.getState();
	try {
		const { data } = await apiClient.post<Bet>("/games/bet/cashout", {
			multiplier,
		});
		gameStore.setState({
			userBet: data,
			activeBets: gameStore
				.getState()
				.activeBets.map((b) => (b.playerId === playerId ? data : b)),
		});
		return data;
	} catch (err) {
		throw parseApiError(err, "Failed to cashout");
	}
}

export function usePlaceBet() {
	return useMutation({
		mutationFn: async ({
			amount,
			currency,
			autoCashoutMultiplier,
		}: {
			amount: number;
			currency: string;
			autoCashoutMultiplier?: number | null;
		}): Promise<Bet> => {
			const { data } = await apiClient.post<Bet>("/games/bet", {
				amount,
				currency,
				autoCashoutMultiplier,
			});
			const bet: Bet = {
				...data,
				...(autoCashoutMultiplier ? { autoCashoutMultiplier } : {}),
			};
			gameStore.setState({
				userBet: bet,
				activeBets: [bet, ...gameStore.getState().activeBets],
			});
			gameStore.updateBalance(currency, -amount);
			return bet;
		},
		onError: (err) => {
			const error = parseApiError(err, "Failed to place bet");
			gameStore.setState({ error: error.message });
		},
	});
}

export function useCashout() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cashoutFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
		},
		onError: (err) => {
			console.error(
				"[useCashout]",
				parseApiError(err, "Failed to cashout").message,
			);
		},
	});
}
