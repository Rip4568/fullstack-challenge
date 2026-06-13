import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useGameState } from "../services/store";

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});

export function ProfilePage() {
	const state = useGameState();
	const [tfaEnabled, setTfaEnabled] = useState(false);
	const usernameDisplay = state.username || "CyberGambler";

	// Get active currency stats
	const activeCurrency = state.balances[0]?.currency || "BRL";
	const activeBalance = state.balances.find(
		(b) => b.currency === activeCurrency,
	);

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
		<main className="min-h-screen pt-4 pb-20 px-6 max-w-[1400px] mx-auto flex flex-col gap-6 bg-jungle-glow">
			{/* Profile VIP Banner */}
			<section className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col md:flex-row items-center justify-between gap-6">
				<div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
					{/* Avatar frame */}
					<div className="relative w-20 h-20 rounded-full border-2 border-primary overflow-hidden bg-surface-container-low flex items-center justify-center shadow-[0_0_15px_rgba(0,230,1,0.2)]">
						<span className="material-symbols-outlined text-primary text-5xl">
							person
						</span>
					</div>
					<div>
						<div className="flex flex-col sm:flex-row items-center gap-2">
							<h2 className="text-xl font-bold text-white tracking-tight">
								@{usernameDisplay}
							</h2>
							<span className="bg-primary/20 border border-primary/30 text-primary text-[9px] font-bold font-mono px-2 py-0.5 rounded shadow-sm">
								GOLD VIP LEVEL IV
							</span>
						</div>
						<p className="text-on-surface-variant text-[11px] font-mono mt-1">
							ACCOUNT STATUS: ACTIVE | REGISTERED: JUN 2026
						</p>
					</div>
				</div>

				<div className="flex gap-2 w-full md:w-auto">
					<Link
						to="/deposit"
						className="flex-1 md:flex-none bg-primary text-on-primary font-bold py-2.5 px-6 rounded-xl text-center text-xs neon-btn-glow active:scale-95 transition-all cursor-pointer"
					>
						Instant Deposit
					</Link>
					<button
						onClick={() => {}}
						type="button"
						className="flex-1 md:flex-none border border-outline-variant text-on-surface hover:bg-surface-container-high font-bold py-2.5 px-6 rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
					>
						Settings
					</button>
				</div>
			</section>

			{/* Metrics Stats Cards Grid */}
			<section className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Metric 1: Current balance progress */}
				<div className="bg-surface-container p-6 rounded-2xl border border-outline-variant hover:border-primary/30 transition-all flex flex-col justify-between group">
					<div className="flex items-center justify-between mb-4">
						<span className="text-on-surface-variant font-mono text-xs uppercase tracking-wider">
							Account Balance
						</span>
						<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
							account_balance_wallet
						</span>
					</div>
					<div>
						<div className="font-mono text-xl font-black text-white">
							{activeBalance
								? activeCurrency === "BRL"
									? `R$ ${activeBalance.amountFormatted.toFixed(2)}`
									: activeCurrency === "USD"
										? `$${activeBalance.amountFormatted.toFixed(2)}`
										: `${activeBalance.amountFormatted.toFixed(5)} ${activeCurrency}`
								: "R$ 0,00"}
						</div>
						<div className="mt-4 h-1.5 bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/30">
							<div className="h-full bg-primary shadow-[0_0_8px_#7dff67] w-[75%]" />
						</div>
						<div className="flex justify-between items-center text-[9px] font-mono text-on-surface-variant/40 mt-1.5">
							<span>
								ESTIMATED VALUE: $
								{activeBalance?.estimatedUsdValue.toFixed(2) || "0.00"} USD
							</span>
							<span>75% PROGRESS</span>
						</div>
					</div>
				</div>

				{/* Metric 2: Total wagered stats */}
				<div className="bg-surface-container p-6 rounded-2xl border border-outline-variant hover:border-primary/30 transition-all flex flex-col justify-between group">
					<div className="flex items-center justify-between mb-4">
						<span className="text-on-surface-variant font-mono text-xs uppercase tracking-wider">
							Total Wagered
						</span>
						<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
							monitoring
						</span>
					</div>
					<div>
						<div className="font-mono text-xl font-black text-white">
							148.52{" "}
							<span className="text-xs font-bold text-on-surface-variant ml-0.5">
								ETH
							</span>
						</div>
						<p className="text-[10px] text-primary font-bold mt-4 flex items-center gap-1.5">
							<span className="material-symbols-outlined text-xs">
								arrow_upward
							</span>
							+12.4% wager volume vs last month
						</p>
					</div>
				</div>

				{/* Metric 3: Total wins stats */}
				<div className="bg-surface-container p-6 rounded-2xl border border-outline-variant hover:border-primary/30 transition-all flex flex-col justify-between group">
					<div className="flex items-center justify-between mb-4">
						<span className="text-on-surface-variant font-mono text-xs uppercase tracking-wider">
							Accumulated Profits
						</span>
						<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
							emoji_events
						</span>
					</div>
					<div>
						<div className="font-mono text-xl font-black text-primary">
							$42,801.00{" "}
							<span className="text-xs font-bold text-on-surface-variant ml-0.5">
								USD
							</span>
						</div>
						<p className="text-[10px] text-on-surface-variant/60 mt-4">
							HIGHEST GAME MULTIPLIER:{" "}
							<span className="text-primary font-bold">420.00x</span>
						</p>
					</div>
				</div>
			</section>

			{/* Activity and Security Split Layout */}
			<section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				{/* Left Side: Recent Betting Activity table */}
				<div className="xl:col-span-2 space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-bold text-white flex items-center gap-2">
							<span className="material-symbols-outlined text-primary">
								history
							</span>
							Recent Activity
						</h3>
					</div>
					<div className="bg-surface-container rounded-2xl border border-outline-variant overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead className="bg-surface-container-high/40 border-b border-outline-variant">
									<tr className="text-[10px] font-bold font-mono text-on-surface-variant/60 uppercase tracking-wider">
										<th className="px-6 py-4">Game</th>
										<th className="px-6 py-4">Wager</th>
										<th className="px-6 py-4">Multiplier</th>
										<th className="px-6 py-4 text-right pr-6">Profit / Loss</th>
									</tr>
								</thead>
								<tbody className="text-xs font-mono divide-y divide-outline-variant/10">
									{betHistory.map((bet) => (
										<tr
											key={bet.id}
											className="hover:bg-surface-container-high/20 transition-colors"
										>
											<td className="px-6 py-3.5 flex items-center gap-3">
												<div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
													<span className="material-symbols-outlined text-sm">
														rocket_launch
													</span>
												</div>
												<div>
													<p className="font-bold text-white">{bet.game}</p>
													<p className="text-[9px] text-on-surface-variant/40">
														{bet.time}
													</p>
												</div>
											</td>
											<td className="px-6 py-3.5 text-on-surface-variant">
												{bet.wager}
											</td>
											<td className="px-6 py-3.5">
												<span
													className={`px-1.5 py-0.5 rounded text-[10px] ${bet.win ? "bg-primary/10 border border-primary/20 text-primary" : "bg-surface-container-highest border border-outline-variant text-on-surface-variant/60"}`}
												>
													{bet.multi}
												</span>
											</td>
											<td
												className={`px-6 py-3.5 text-right pr-6 ${bet.win ? "text-primary font-bold" : "text-red-400"}`}
											>
												{bet.profit}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* Right Side: Security 2FA settings panel */}
				<div className="space-y-4">
					<h3 className="text-sm font-bold text-white flex items-center gap-2">
						<span className="material-symbols-outlined text-primary">
							security
						</span>
						Security & MFA
					</h3>
					<div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-bold text-white">
									2-Factor Authentication (2FA)
								</p>
								<p className="text-[10px] text-on-surface-variant/60 mt-0.5">
									Protect your withdrawals with Google Authenticator.
								</p>
							</div>

							{/* iOS switch toggle */}
							<button
								onClick={() => setTfaEnabled(!tfaEnabled)}
								type="button"
								className={`relative w-12 h-6.5 rounded-full transition-colors cursor-pointer flex items-center px-1 border ${
									tfaEnabled
										? "bg-primary border-primary"
										: "bg-surface-container-lowest border-outline-variant"
								}`}
							>
								<div
									className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 ${
										tfaEnabled ? "translate-x-5" : "translate-x-0"
									}`}
								/>
							</button>
						</div>

						<div className="h-px bg-outline-variant/30" />

						<div className="space-y-2">
							<button
								onClick={() => {}}
								type="button"
								className="w-full border border-outline-variant hover:border-primary/50 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer active:scale-95 transition-all text-center"
							>
								Change Account Password
							</button>
							<button
								onClick={() => {}}
								type="button"
								className="w-full bg-surface-container-highest text-on-surface hover:bg-surface-container-high font-bold py-2.5 rounded-xl text-xs cursor-pointer active:scale-95 transition-all text-center"
							>
								View Active Sessions (2)
							</button>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
