import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiService } from "../services/api.service";
import { mockEngine } from "../services/mock-engine";
import { socketService } from "../services/socket.service";
import { gameStore, useGameState } from "../services/store";

export const Route = createFileRoute("/play/crash")({
	component: CrashGamePage,
});

export function CrashGamePage() {
	const state = useGameState();

	// Input States
	const [betAmount, setBetAmount] = useState("10.00");
	const [autoCashout, setAutoCashout] = useState("2.00");
	const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual");
	const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
	const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

	// Active currency selected in header
	// Note: For BRL we scale the display by /100.
	const activeCurrency = state.balances[0]?.currency || "BRL";
	const activeBalance = state.balances.find(
		(b) => b.currency === activeCurrency,
	);

	// Sync mode (Mock vs Real) mounting
	useEffect(() => {
		if (state.mode === "mock") {
			socketService.disconnect();
			mockEngine.start();
		} else {
			mockEngine.stop();
			socketService.connect();
		}

		return () => {
			mockEngine.stop();
			socketService.disconnect();
		};
	}, [state.mode]);

	// Parallax effect on mouse move in Graph Area
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = (rect.width / 2 - (e.clientX - rect.left)) / 40;
		const y = (rect.height / 2 - (e.clientY - rect.top)) / 40;
		setParallaxOffset({ x, y });
	};

	const handlePlaceBet = async () => {
		const numericAmount = Math.round(parseFloat(betAmount) * 100); // Convert to cents
		if (Number.isNaN(numericAmount) || numericAmount <= 0) return;

		const numericAuto = parseFloat(autoCashout);
		const autoCashoutVal =
			Number.isNaN(numericAuto) || numericAuto <= 1.0 ? null : numericAuto;

		try {
			if (state.mode === "mock") {
				mockEngine.userPlaceBet(numericAmount, activeCurrency, autoCashoutVal);
			} else {
				await apiService.placeBet(numericAmount, autoCashoutVal);
			}
		} catch (err: any) {
			console.error("Failed to place bet:", err);
			gameStore.setState({ error: err.message || "Error placing bet" });
		}
	};

	const handleCashout = async () => {
		try {
			if (state.mode === "mock") {
				mockEngine.userCashout(state.currentMultiplier);
			} else {
				await apiService.cashout(state.currentMultiplier);
			}
		} catch (err: any) {
			console.error("Failed to cash out:", err);
		}
	};

	// Adjust Bet Amount Inputs
	const handleHalf = () => {
		const val = parseFloat(betAmount);
		if (!Number.isNaN(val)) setBetAmount(Math.max(1, val / 2).toFixed(2));
	};

	const handleDouble = () => {
		const val = parseFloat(betAmount);
		if (!Number.isNaN(val)) setBetAmount((val * 2).toFixed(2));
	};

	const handleMax = () => {
		if (activeBalance) {
			setBetAmount(activeBalance.amountFormatted.toFixed(2));
		}
	};

	// Calculate dynamic cashout returns
	const getDynamicPayout = () => {
		if (!state.userBet) return "0.00";
		const payout = (state.userBet.amount / 100) * state.currentMultiplier;
		if (activeCurrency === "BRL") return `R$ ${payout.toFixed(2)}`;
		if (activeCurrency === "USD") return `$${payout.toFixed(2)}`;
		return `${payout.toFixed(5)} ${activeCurrency}`;
	};

	// Draw growing SVG path for the crash curve
	const renderSVGPath = () => {
		if (state.roundState !== "GAMEPLAY") return null;
		// Normalize progress between 0 and 100
		const progress = Math.min(100, (state.elapsedMs / 10000) * 100);
		const height = Math.min(80, (state.currentMultiplier - 1.0) * 15);

		// Draw quad bezier curve from bottom-left (10, 90) to top-right
		const startX = 10;
		const startY = 270;
		const endX = 10 + (280 * progress) / 100;
		const endY = 270 - (200 * height) / 100;

		return (
			<svg
				className="absolute inset-0 w-full h-full pointer-events-none z-10"
				viewBox="0 0 350 300"
			>
				{/* Glow Filter */}
				<defs>
					<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="4" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
				</defs>
				{/* Dotted lines */}
				<line
					x1="10"
					y1="270"
					x2="330"
					y2="270"
					stroke="#24282E"
					strokeWidth="1"
					strokeDasharray="3"
				/>
				<line
					x1="10"
					y1="50"
					x2="10"
					y2="270"
					stroke="#24282E"
					strokeWidth="1"
					strokeDasharray="3"
				/>
				{/* Curve */}
				<path
					d={`M ${startX} ${startY} Q ${startX + (endX - startX) * 0.5} ${startY} ${endX} ${endY}`}
					fill="none"
					stroke="#7dff67"
					strokeWidth="3"
					filter="url(#glow)"
				/>
				{/* Rocket Node */}
				<circle cx={endX} cy={endY} r="6" fill="#7dff67" filter="url(#glow)" />
			</svg>
		);
	};

	return (
		<main className="min-h-screen pt-4 pb-20 px-6 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-jungle-glow">
			{/* LEFT SECTION (8 Columns): Graph and History */}
			<section className="lg:col-span-8 flex flex-col gap-6">
				{/* Rounds History Multiplier Badges */}
				<div className="flex items-center gap-2 overflow-x-auto py-2 px-3 bg-surface-container rounded-xl border border-outline-variant custom-scrollbar scrollbar-hide">
					<span className="text-[10px] font-bold font-mono text-on-surface-variant mr-2 tracking-wider">
						RECENT:
					</span>
					{state.roundHistory.map((item, idx) => (
						<span
							key={`${item.id}-${idx}`}
							className={`px-3 py-1 rounded text-xs font-bold font-mono tracking-tighter ${
								item.crashPoint >= 2.0
									? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_10px_rgba(125,255,103,0.15)]"
									: "bg-red-500/10 text-red-400 border border-red-500/10"
							}`}
						>
							{item.crashPoint.toFixed(2)}x
						</span>
					))}
				</div>

				{/* Graphical Canvas Area */}
				<div
					onMouseMove={handleMouseMove}
					onMouseLeave={() => setParallaxOffset({ x: 0, y: 0 })}
					className="relative graph-area rounded-2xl h-[400px] md:h-[480px] border border-outline-variant overflow-hidden flex flex-col items-center justify-center select-none"
				>
					{/* Jungle Parallax Background */}
					<img
						style={{
							transform: `scale(1.1) translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
							transition: "transform 0.1s ease-out",
						}}
						className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
						alt="Jungle background theme"
						src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwCuifWLYV146aT4TD5saPanUgbxZOhsgAkVHPfcvA4wzPK6_SQV4x5S-Sfy5FN9OAukUSgVwbfsExE4bd2AUASgRWmPOk1UTrFzfu-VHjgNs4ooUj-knJS3N0320M0cjGx3V7P3bgMJ6B1ij42DtPs4j4nLAtwu4fVOG6cs9Av4PJRF4rvJUkW7WtKporDErhWbZTJKKO7rBugUjRsYFN7KSzNepvJENcyY10znFCTPgX17BQqFdThXYlWcHPeAQWGDQXzeHL0VVT"
					/>

					{/* SVG growing line curve */}
					{renderSVGPath()}

					{/* Canvas Gameplay States overlay */}
					<div className="z-20 text-center flex flex-col items-center justify-center px-4">
						{state.roundState === "BETTING" && (
							<div className="flex flex-col items-center justify-center animate-pulse">
								<span className="text-sm font-extrabold uppercase font-mono tracking-widest text-primary mb-2">
									Próxima rodada inicia em
								</span>
								<span className="text-5xl md:text-7xl font-black font-mono text-white tracking-tighter">
									{state.bettingCountdown.toFixed(1)}s
								</span>
								<div className="w-48 h-1 bg-surface-container rounded-full mt-4 overflow-hidden">
									<div
										style={{ width: `${(state.bettingCountdown / 10) * 100}%` }}
										className="h-full bg-primary shadow-[0_0_8px_#7dff67] transition-all duration-100"
									/>
								</div>
							</div>
						)}

						{state.roundState === "GAMEPLAY" && (
							<div className="flex flex-col items-center">
								<span className="text-xs uppercase font-mono text-primary font-bold tracking-widest bg-primary/10 px-3 py-1 rounded border border-primary/20 mb-3 shadow-[0_0_10px_rgba(125,255,103,0.15)]">
									Jungle Rocket
								</span>
								<span className="text-6xl md:text-8xl font-black font-mono text-white tracking-tighter neon-glow animate-bounce">
									{state.currentMultiplier.toFixed(2)}x
								</span>
							</div>
						)}

						{state.roundState === "CRASHED" && (
							<div className="flex flex-col items-center">
								<span className="text-xs uppercase font-mono text-red-400 font-bold tracking-widest bg-red-500/10 px-3 py-1 rounded border border-red-500/20 mb-3">
									Exploded!
								</span>
								<span className="text-5xl md:text-7xl font-black font-mono text-red-500 tracking-tighter">
									@ {state.crashPoint?.toFixed(2) || "1.00"}x
								</span>
							</div>
						)}
					</div>

					{/* Bottom Bar inside Graph */}
					<div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] text-on-surface-variant/40 font-mono z-20">
						<span>ROUND ID: {state.roundId.substring(0, 12)}...</span>
						<div className="flex items-center gap-2">
							<div
								className={`w-2 h-2 rounded-full ${state.isConnected || state.mode === "mock" ? "bg-primary" : "bg-red-500"}`}
							/>
							<span>{state.mode === "mock" ? "OFFLINE MOCK" : "LIVE API"}</span>
						</div>
					</div>
				</div>

				{/* Cryptographic verification panel */}
				<div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="material-symbols-outlined text-primary text-3xl">
							verified_user
						</span>
						<div>
							<h4 className="text-sm font-bold text-white">
								Provably Fair System
							</h4>
							<p className="text-on-surface-variant text-xs mt-0.5">
								Verifique a integridade matemática da rodada usando as sementes
								fornecidas.
							</p>
						</div>
					</div>
					<button
						onClick={() => setIsVerifyModalOpen(true)}
						type="button"
						className="w-full md:w-auto bg-primary/10 border border-primary/30 text-primary font-bold py-2.5 px-6 rounded-xl hover:bg-primary hover:text-on-primary transition-all text-xs cursor-pointer shadow-[0_0_10px_rgba(125,255,103,0.05)]"
					>
						Verify Round
					</button>
				</div>
			</section>

			{/* RIGHT SECTION (4 Columns): Betting panel & Players list */}
			<section className="lg:col-span-4 flex flex-col gap-6">
				{/* Bet Panel Container */}
				<div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col gap-4">
					{/* Tabs header */}
					<div className="grid grid-cols-2 bg-surface-container-lowest rounded-xl p-1 border border-outline-variant">
						<button
							onClick={() => setActiveTab("manual")}
							type="button"
							className={`py-2 rounded-lg text-xs font-bold font-mono tracking-wider cursor-pointer ${
								activeTab === "manual"
									? "bg-surface-container-high text-white shadow-sm"
									: "text-on-surface-variant hover:text-white"
							}`}
						>
							Manual
						</button>
						<button
							onClick={() => setActiveTab("auto")}
							type="button"
							className={`py-2 rounded-lg text-xs font-bold font-mono tracking-wider cursor-pointer ${
								activeTab === "auto"
									? "bg-surface-container-high text-white shadow-sm"
									: "text-on-surface-variant hover:text-white"
							}`}
						>
							Automatic
						</button>
					</div>

					{/* Amount input */}
					<div className="space-y-1.5">
						<span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider block">
							Bet Amount
						</span>
						<div className="relative">
							<input
								className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 pr-28 text-sm text-white font-mono outline-none focus:border-primary transition-all"
								type="number"
								step="0.01"
								min="0.10"
								value={betAmount}
								onChange={(e) => setBetAmount(e.target.value)}
								disabled={
									!!state.userBet && state.userBet.status !== "REJECTED"
								}
							/>
							<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
								<button
									onClick={handleHalf}
									type="button"
									disabled={
										!!state.userBet && state.userBet.status !== "REJECTED"
									}
									className="bg-surface-container border border-outline-variant hover:border-primary/50 text-[10px] text-on-surface font-bold py-1.5 px-2.5 rounded-lg active:scale-95 cursor-pointer disabled:opacity-50"
								>
									½
								</button>
								<button
									onClick={handleDouble}
									type="button"
									disabled={
										!!state.userBet && state.userBet.status !== "REJECTED"
									}
									className="bg-surface-container border border-outline-variant hover:border-primary/50 text-[10px] text-on-surface font-bold py-1.5 px-2.5 rounded-lg active:scale-95 cursor-pointer disabled:opacity-50"
								>
									2x
								</button>
								<button
									onClick={handleMax}
									type="button"
									disabled={
										!!state.userBet && state.userBet.status !== "REJECTED"
									}
									className="bg-surface-container border border-outline-variant hover:border-primary/50 text-[10px] text-on-surface font-bold py-1.5 px-2.5 rounded-lg active:scale-95 cursor-pointer disabled:opacity-50"
								>
									MAX
								</button>
							</div>
						</div>
					</div>

					{/* Auto cashout input */}
					<div className="space-y-1.5">
						<span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider block">
							Auto Cashout (Multiplier)
						</span>
						<div className="relative">
							<input
								className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 text-sm text-white font-mono outline-none focus:border-primary transition-all"
								type="number"
								step="0.05"
								min="1.01"
								value={autoCashout}
								onChange={(e) => setAutoCashout(e.target.value)}
								disabled={
									!!state.userBet && state.userBet.status !== "REJECTED"
								}
							/>
							<span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-on-surface-variant/40">
								x
							</span>
						</div>
					</div>

					{/* Big Action button */}
					{!state.userBet || state.userBet.status === "REJECTED" ? (
						<button
							onClick={handlePlaceBet}
							type="button"
							disabled={state.roundState !== "BETTING"}
							className="w-full bg-primary text-on-primary py-4.5 rounded-xl font-bold active:scale-95 cursor-pointer text-sm tracking-wider uppercase text-center neon-btn-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
						>
							Place Bet (
							{activeCurrency === "BRL"
								? `R$ ${parseFloat(betAmount).toFixed(2)}`
								: `${betAmount} ${activeCurrency}`}
							)
						</button>
					) : state.userBet.status === "PENDING" ||
						state.userBet.status === "CONFIRMED" ? (
						state.roundState === "BETTING" ? (
							<button
								onClick={() => {
									// Refund balance in mock or let it stand
									if (state.mode === "mock" && state.userBet) {
										gameStore.updateBalance(
											state.userBet.currency,
											state.userBet.amount,
										);
									}
									gameStore.setState({ userBet: null });
								}}
								type="button"
								className="w-full bg-red-500/20 border border-red-500/40 text-red-400 py-4.5 rounded-xl font-bold cursor-pointer text-sm tracking-wider uppercase text-center active:scale-95 transition-all"
							>
								Cancel Bet (Pending)
							</button>
						) : (
							<button
								onClick={handleCashout}
								type="button"
								className="w-full bg-amber-500 text-white py-4.5 rounded-xl font-black cursor-pointer text-sm tracking-wider uppercase text-center active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]"
							>
								CASH OUT ({getDynamicPayout()})
							</button>
						)
					) : (
						<div
							className={`w-full py-4 rounded-xl text-xs font-mono font-bold text-center border ${
								state.userBet.status === "CASHOUT"
									? "bg-primary/20 border-primary/30 text-primary shadow-[0_0_15px_rgba(125,255,103,0.15)]"
									: "bg-red-500/10 border-red-500/20 text-red-400"
							}`}
						>
							{state.userBet.status === "CASHOUT"
								? `CASHED OUT @ ${state.userBet.cashOutMultiplier?.toFixed(2)}x`
								: "EXPLODED (LOST WAGER)"}
						</div>
					)}

					{/* Client error warnings */}
					{state.error && (
						<p className="text-[10px] text-red-400 text-center font-mono mt-1 bg-red-500/5 py-1 px-3 rounded border border-red-500/10">
							{state.error}
						</p>
					)}
				</div>

				{/* Current Bets Room List */}
				<div className="bg-surface-container rounded-2xl border border-outline-variant flex flex-col flex-grow min-h-[350px]">
					<div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-high/40 rounded-t-2xl">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
							<span className="text-[10px] font-bold font-mono tracking-wider text-on-surface-variant">
								{state.activeBets.length} Players Online
							</span>
						</div>
						<span className="text-[10px] font-bold font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
							{activeCurrency === "BRL"
								? `R$ ${state.activeBets.reduce((acc, curr) => acc + (curr.currency === "BRL" ? curr.amount / 100 : 0), 0).toFixed(2)}`
								: `${state.activeBets.length} Active`}
						</span>
					</div>

					<div className="flex-grow overflow-y-auto custom-scrollbar px-2 py-3 max-h-[350px]">
						<table className="w-full text-left">
							<thead>
								<tr className="text-[9px] font-bold font-mono text-on-surface-variant/60 uppercase tracking-wider border-b border-outline-variant/30">
									<th className="pb-3 pl-3">User</th>
									<th className="pb-3">Wager</th>
									<th className="pb-3">Multiplier</th>
									<th className="pb-3 text-right pr-3">Return</th>
								</tr>
							</thead>
							<tbody className="text-xs font-mono divide-y divide-outline-variant/10">
								{state.activeBets.map((bet) => (
									<tr
										key={bet.id}
										className={`transition-colors ${
											bet.playerId === state.playerId
												? "bg-primary/5 font-bold"
												: "hover:bg-surface-container-high/40"
										}`}
									>
										<td className="py-2.5 pl-3 flex items-center gap-2 text-on-surface">
											<div className="w-5 h-5 rounded-full bg-surface-container-highest text-[9px] flex items-center justify-center text-white font-bold">
												{bet.username.substring(0, 2).toUpperCase()}
											</div>
											<span className="truncate max-w-[90px]">
												{bet.username}
											</span>
										</td>
										<td className="py-2.5 text-on-surface-variant">
											{bet.currency === "BRL"
												? `R$ ${(bet.amount / 100).toFixed(2)}`
												: `${(bet.amount / 100).toFixed(2)} ${bet.currency}`}
										</td>
										<td className="py-2.5">
											{bet.status === "CASHOUT" ? (
												<span className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px]">
													{bet.cashOutMultiplier?.toFixed(2)}x
												</span>
											) : bet.status === "LOST" ? (
												<span className="text-red-400">Lost</span>
											) : (
												<span className="text-on-surface-variant/40">-</span>
											)}
										</td>
										<td
											className={`py-2.5 text-right pr-3 ${
												bet.status === "CASHOUT"
													? "text-primary font-bold"
													: "text-on-surface-variant/40"
											}`}
										>
											{bet.status === "CASHOUT" && bet.payoutAmount
												? bet.currency === "BRL"
													? `R$ ${(bet.payoutAmount / 100).toFixed(2)}`
													: `${(bet.payoutAmount / 100).toFixed(2)} ${bet.currency}`
												: "-"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* PROVABLY FAIR MODAL POPUP */}
			{isVerifyModalOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-surface-container rounded-2xl border border-outline-variant max-w-md w-full shadow-2xl p-6 relative">
						<button
							onClick={() => setIsVerifyModalOpen(false)}
							type="button"
							className="absolute right-4 top-4 text-on-surface-variant hover:text-white"
						>
							<span className="material-symbols-outlined">close</span>
						</button>
						<h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
							<span className="material-symbols-outlined text-primary">
								verified_user
							</span>
							Cryptographic Hash Audit
						</h3>
						<p className="text-on-surface-variant text-xs mb-6">
							Our games are mathematically fair. You can verify the crash point
							by feeding the server seed and client seed to the SHA-256 Pareto
							formula.
						</p>

						<div className="space-y-4 font-mono text-xs">
							<div className="space-y-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">
								<span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
									Server Seed SHA-256 Hash
								</span>
								<span className="text-white break-all">
									{state.serverSeedHash}
								</span>
							</div>

							<div className="space-y-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">
								<span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
									Client Seed (Public)
								</span>
								<span className="text-white break-all">{state.clientSeed}</span>
							</div>

							<div className="space-y-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">
								<span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
									Server Seed (Revealed)
								</span>
								<span className="text-white break-all">
									{state.serverSeed || "Revealed at the end of the round."}
								</span>
							</div>

							{state.crashPoint !== null && state.serverSeed && (
								<div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex justify-between items-center">
									<span className="text-primary font-bold">
										Audited Crash Point:
									</span>
									<span className="text-primary font-black">
										{state.crashPoint.toFixed(2)}x
									</span>
								</div>
							)}
						</div>

						<button
							onClick={() => setIsVerifyModalOpen(false)}
							type="button"
							className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl mt-6 neon-btn-glow active:scale-95"
						>
							Close Auditor
						</button>
					</div>
				</div>
			)}
		</main>
	);
}
