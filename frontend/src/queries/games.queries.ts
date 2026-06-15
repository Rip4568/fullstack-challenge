import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../core/apiClient";

export interface BetItem {
	id: string;
	roundId: string;
	playerId: string;
	username: string;
	amount: number;
	currency: string;
	status: "PENDING" | "CONFIRMED" | "CASHOUT" | "LOST" | "REJECTED";
	cashOutMultiplier: number | null;
	payoutAmount: number | null;
	createdAt: string;
	round?: {
		status: string;
		crashPoint: number | null;
		serverSeedHash: string;
	};
}

export interface BetHistoryResponse {
	items: BetItem[];
	total: number;
	limit: number;
	offset: number;
}

export const betHistoryQueryOptions = (limit = 20, offset = 0) =>
	queryOptions({
		queryKey: ["games", "bets", "me", limit, offset],
		queryFn: async () => {
			const { data } = await apiClient.get<BetHistoryResponse>(
				`/games/bets/me?limit=${limit}&offset=${offset}`,
			);
			return data;
		},
		staleTime: 30_000,
	});
