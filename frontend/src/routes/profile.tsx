import { createFileRoute } from "@tanstack/react-router";
import { useGameState } from "../core/store";
import MetricsGrid from "../features/profile/MetricsGrid";
import ProfileVipBanner from "../features/profile/ProfileVipBanner";
import RecentActivityTable from "../features/profile/RecentActivityTable";
import SecurityPanel from "../features/profile/SecurityPanel";

/*
🎨 DESIGN COMMITMENT: JUNGLE DIGITAL
- Estilo: Liquid Digital / Bauhaus Remix
- Geometria: Sharp (0px) borders and bold thick outlines (2px) to create high digital contrast.
- Traição Topológica: Broken layout with asymmetric grid spans (Metrics Grid spans 2/1/2 cols in a 5-column space) and offset vertical gaps.
- Risk Factor: Uses absolute sharp-edge shadows and highly vibrant interactive switches with detailed key states.
- Cliché Liquidation: Killed standard bento grid splits and boring standard rounded status badges. Replaced them with raw, high-contrast digital monospace displays.
*/

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});

export function ProfilePage() {
	const state = useGameState();
	const usernameDisplay = state.username || "CyberGambler";

	// Get active currency stats
	const activeCurrency = state.balances[0]?.currency || "BRL";
	const activeBalance = state.balances.find(
		(b) => b.currency === activeCurrency,
	);

	const activeBalanceAmount = activeBalance ? activeBalance.amountFormatted : 0;
	const estimatedUsdValue = activeBalance ? activeBalance.estimatedUsdValue : 0;

	// Mock game history data
	const betHistory = [
		{
			id: "1",
			game: "Jungle Crash",
			time: "5 mins ago",
			wager: "R$ 50,00",
			multi: "2.45x",
			profit: "+R$ 72,50",
			win: true,
		},
		{
			id: "2",
			game: "Jungle Crash",
			time: "12 mins ago",
			wager: "R$ 10,00",
			multi: "1.05x",
			profit: "-R$ 10,00",
			win: false,
		},
		{
			id: "3",
			game: "Mines",
			time: "1 hour ago",
			wager: "0.0002 BTC",
			multi: "3.12x",
			profit: "+0.00042 BTC",
			win: true,
		},
		{
			id: "4",
			game: "Jungle Crash",
			time: "2 hours ago",
			wager: "0.0150 ETH",
			multi: "1.00x (Busted)",
			profit: "-0.0150 ETH",
			win: false,
		},
	];

	return (
		<main className="min-h-screen pt-4 pb-20 px-6 max-w-[1400px] mx-auto flex flex-col gap-8 bg-jungle-glow">
			{/* Profile VIP Banner */}
			<ProfileVipBanner username={usernameDisplay} onOpenSettings={() => {}} />

			{/* Metrics Stats Cards Grid */}
			<MetricsGrid
				activeBalanceAmount={activeBalanceAmount}
				activeCurrency={activeCurrency}
				estimatedUsdValue={estimatedUsdValue}
			/>

			{/* Activity and Security Split Layout */}
			<section className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
				{/* Left Side: Recent Betting Activity table */}
				<div className="xl:col-span-2">
					<RecentActivityTable activityHistory={betHistory} />
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
