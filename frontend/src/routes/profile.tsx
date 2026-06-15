import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { gameStore, useGameState } from "../core/store";
import MetricsGrid from "../features/profile/MetricsGrid";
import ProfileVipBanner from "../features/profile/ProfileVipBanner";
import RecentActivityTable from "../features/profile/RecentActivityTable";
import SecurityPanel from "../features/profile/SecurityPanel";
import { betHistoryQueryOptions } from "../queries/games.queries";

/*
🎨 DESIGN COMMITMENT: JUNGLE DIGITAL
- Estilo: Liquid Digital / Bauhaus Remix
- Geometria: Sharp (0px) borders and bold thick outlines (2px) to create high digital contrast.
- Traição Topológica: Broken layout with asymmetric grid spans (Metrics Grid spans 2/1/2 cols in a 5-column space) and offset vertical gaps.
- Risk Factor: Uses absolute sharp-edge shadows and highly vibrant interactive switches with detailed key states.
- Cliché Liquidation: Killed standard bento grid splits and boring standard rounded status badges. Replaced them with raw, high-contrast digital monospace displays.
*/

export const Route = createFileRoute("/profile")({
	loader: ({ context: { queryClient } }) => {
		const { token, mode } = gameStore.getState();
		if (token && mode === "real") {
			return queryClient.ensureQueryData(betHistoryQueryOptions());
		}
	},
	component: ProfilePage,
});

function betTimeAgo(date: string | Date): string {
	const diff = Date.now() - new Date(date).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins} min ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

function formatWager(amount: number, currency: string): string {
	if (currency === "BRL") return `R$ ${(amount / 100).toFixed(2)}`;
	if (currency === "USD") return `$${(amount / 100).toFixed(2)}`;
	if (currency === "BTC") return `${(amount / 1e8).toFixed(5)} BTC`;
	if (currency === "ETH") return `${(amount / 1e18).toFixed(5)} ETH`;
	return `${amount} ${currency}`;
}

export function ProfilePage() {
	const state = useGameState();
	const usernameDisplay = state.username || "CyberGambler";

	const { data, isLoading } = useQuery({
		...betHistoryQueryOptions(),
		enabled: state.mode === "real" && !!state.token,
	});

	const items = data?.items ?? [];

	const betHistory = items.map((b) => {
		const isCashout = b.status === "CASHOUT";
		const isLost = b.status === "LOST";
		const multi = isCashout
			? `${Number(b.cashOutMultiplier).toFixed(2)}x`
			: isLost
				? `${b.round?.crashPoint ? Number(b.round.crashPoint).toFixed(2) : "—"}x (Bust)`
				: b.status;
		const wagerAmt = Number(b.amount);
		const payoutAmt = Number(b.payoutAmount ?? 0);
		const profitRaw = isCashout ? payoutAmt - wagerAmt : -wagerAmt;
		const profit = `${profitRaw >= 0 ? "+" : ""}${formatWager(profitRaw, b.currency)}`;
		return {
			id: b.id,
			game: "Jungle Crash",
			time: betTimeAgo(b.createdAt),
			wager: formatWager(wagerAmt, b.currency),
			multi,
			profit,
			win: isCashout,
		};
	});

	let totalWagered = 0;
	let totalProfit = 0;
	let maxMulti = 0;
	for (const b of items) {
		if (b.currency === "BRL") {
			totalWagered += Number(b.amount);
			if (b.status === "CASHOUT")
				totalProfit += Number(b.payoutAmount ?? 0) - Number(b.amount);
		}
		const m = Number(b.cashOutMultiplier ?? 0);
		if (m > maxMulti) maxMulti = m;
	}

	const metrics = {
		totalWageredAmount: Number((totalWagered / 100).toFixed(2)),
		totalWageredCurrency: "BRL",
		accumulatedProfitsAmount: Number((totalProfit / 100).toFixed(2)),
		highestMultiplier: maxMulti > 0 ? `${maxMulti.toFixed(2)}x` : "—",
	};

	// Get active currency stats
	const activeCurrency = state.balances[0]?.currency || "BRL";
	const activeBalance = state.balances.find(
		(b) => b.currency === activeCurrency,
	);
	const activeBalanceAmount = activeBalance ? activeBalance.amountFormatted : 0;
	const estimatedUsdValue = activeBalance ? activeBalance.estimatedUsdValue : 0;

	return (
		<main className="min-h-screen pt-4 pb-20 px-6 max-w-[1400px] mx-auto flex flex-col gap-8 bg-jungle-glow">
			{/* Profile VIP Banner */}
			<ProfileVipBanner username={usernameDisplay} onOpenSettings={() => {}} />

			{/* Metrics Stats Cards Grid */}
			<MetricsGrid
				activeBalanceAmount={activeBalanceAmount}
				activeCurrency={activeCurrency}
				estimatedUsdValue={estimatedUsdValue}
				totalWageredAmount={metrics.totalWageredAmount}
				totalWageredCurrency={metrics.totalWageredCurrency}
				accumulatedProfitsAmount={metrics.accumulatedProfitsAmount}
				highestMultiplier={metrics.highestMultiplier}
			/>

			{/* Activity and Security Split Layout */}
			<section className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
				{/* Left Side: Recent Betting Activity table */}
				<div className="xl:col-span-2">
					<RecentActivityTable activityHistory={betHistory} isLoading={isLoading} />
				</div>

				{/* Right Side: Security 2FA settings panel */}
				<div>
					<SecurityPanel
						tfaInitiallyEnabled={false}
						onChangePassword={() => {}}
						onViewSessions={() => {}}
					/>
				</div>
			</section>
		</main>
	);
}
