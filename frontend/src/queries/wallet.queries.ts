import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../core/apiClient";
import type { Balance } from "../core/store";

export interface WalletResponse {
	id: string;
	playerId: string;
	balances: Balance[];
	createdAt: string;
	updatedAt: string;
}

export interface TransactionItem {
	id: string;
	amount: number;
	type: "DEBIT" | "CREDIT" | "REFUND";
	referenceType: string;
	referenceId: string;
	currency: string;
	createdAt: string;
}

export const walletQueryOptions = () =>
	queryOptions({
		queryKey: ["wallet", "me"],
		queryFn: async () => {
			const { data } = await apiClient.get<WalletResponse>("/wallets/me");
			return data;
		},
		staleTime: 30_000,
	});

export const walletTransactionsQueryOptions = () =>
	queryOptions({
		queryKey: ["wallet", "transactions"],
		queryFn: async () => {
			const { data } = await apiClient.get<TransactionItem[]>(
				"/wallets/transactions",
			);
			return data;
		},
		staleTime: 60_000,
	});
