import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseApiError } from "../core/apiClient";
import { gameStore } from "../core/store";
import type { WalletResponse } from "../queries/wallet.queries";

const formatAmount = (amount: number, currency: string) => {
	if (currency === "BRL" || currency === "USD") {
		return (amount / 100).toFixed(2);
	}
	if (currency === "BTC") {
		return (amount / 100000000).toFixed(8);
	}
	if (currency === "ETH") {
		return (amount / 1000000000000000000).toFixed(8);
	}
	return amount.toString();
};

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
		onSuccess: (_data, variables) => {
			const formatted = formatAmount(variables.amount, variables.currency);
			gameStore.addToast({
				type: "success",
				message: `Depósito de ${formatted} ${variables.currency} processado com sucesso!`,
			});
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
