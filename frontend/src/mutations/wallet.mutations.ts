import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "../core/apiClient";
import { gameStore } from "../core/store";
import type { WalletResponse } from "../queries/wallet.queries";

export function useDeposit() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			currency,
			amount,
		}: {
			currency: string;
			amount: number;
		}): Promise<WalletResponse | undefined> => {
			const { mode } = gameStore.getState();
			if (mode === "mock") {
				gameStore.updateBalance(currency, amount);
				return undefined;
			}
			const { data } = await apiClient.post<WalletResponse>(
				"/wallets/deposit",
				{ amount: amount.toString(), currency },
			);
			gameStore.setState({ balances: data.balances });
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
			queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
		},
		onError: (err) => {
			console.error(
				"[useDeposit]",
				parseApiError(err, "Failed to deposit").message,
			);
		},
	});
}
