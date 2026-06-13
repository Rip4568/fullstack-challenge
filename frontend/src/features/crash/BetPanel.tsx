import { useCallback, useEffect, useRef, useState } from "react";
import { apiService } from "../../core/api.service";
import { mockEngine } from "../../core/mock-engine";
import { gameStore, useGameState } from "../../core/store";

// Convert display unit betAmount to raw integer value
const getRawAmount = (amountStr: string, currency: string): number => {
	const parsed = parseFloat(amountStr);
	if (Number.isNaN(parsed) || parsed <= 0) return 0;
	if (currency === "BTC") return Math.round(parsed * 100000000);
	if (currency === "ETH") return Math.round(parsed * 1000000000000000000);
	return Math.round(parsed * 100);
};

// Format display values according to currency type
const formatValue = (val: number, currency: string) => {
	if (currency === "BTC" || currency === "ETH") {
		return val.toFixed(8);
	}
	return val.toFixed(2);
};

const BetPanel = () => {
	const state = useGameState();

	// Currency selector state
	const [selectedCurrency, setSelectedCurrency] = useState("BRL");

	// Input States
	const [betAmount, setBetAmount] = useState("10.00");
	const [autoCashout, setAutoCashout] = useState("2.00");
	const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual");

	// Auto-Betting States
	const [autoRounds, setAutoRounds] = useState("10");
	const [remainingRounds, setRemainingRounds] = useState(0);
	const [isAutoBetActive, setIsAutoBetActive] = useState(false);

	// Ref to track round triggering to prevent duplicate bets per round
	const lastPlacedRoundId = useRef("");

	// Find active balance based on selected currency
	const activeBalance = state.balances.find(
		(b) => b.currency === selectedCurrency,
	);

	// Sync selectedCurrency with the first balance on mount, if available
	useEffect(() => {
		if (
			state.balances.length > 0 &&
			!state.balances.some((b) => b.currency === selectedCurrency)
		) {
			setSelectedCurrency(state.balances[0].currency);
		}
	}, [state.balances, selectedCurrency]);

	const handleHalf = () => {
		const val = parseFloat(betAmount);
		if (!Number.isNaN(val)) {
			setBetAmount(
				formatValue(Math.max(0.00000001, val / 2), selectedCurrency),
			);
		}
	};

	const handleDouble = () => {
		const val = parseFloat(betAmount);
		if (!Number.isNaN(val)) {
			setBetAmount(formatValue(val * 2, selectedCurrency));
		}
	};

	const handleMax = () => {
		if (activeBalance) {
			setBetAmount(
				formatValue(activeBalance.amountFormatted, selectedCurrency),
			);
		}
	};

	// Place bet core logic
	const handlePlaceBet = useCallback(async () => {
		const rawAmount = getRawAmount(betAmount, selectedCurrency);
		if (rawAmount <= 0) return;

		const numericAuto = parseFloat(autoCashout);
		const autoCashoutVal =
			Number.isNaN(numericAuto) || numericAuto <= 1.0 ? null : numericAuto;

		try {
			if (state.mode === "mock") {
				mockEngine.userPlaceBet(rawAmount, selectedCurrency, autoCashoutVal);
			} else {
				await apiService.placeBet(rawAmount, selectedCurrency, autoCashoutVal);
			}
		} catch (err) {
			console.error("Failed to place bet:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Error placing bet";
			gameStore.setState({ error: errorMessage });
			// If we are in auto bet mode, cancel the loop on error (e.g. Insufficient balance)
			setIsAutoBetActive(false);
		}
	}, [betAmount, selectedCurrency, autoCashout, state.mode]);

	const handleCashout = async () => {
		try {
			if (state.mode === "mock") {
				mockEngine.userCashout(state.currentMultiplier);
			} else {
				await apiService.cashout(state.currentMultiplier);
			}
		} catch (err) {
			console.error("Failed to cash out:", err);
		}
	};

	// Start or Stop Auto Betting
	const handleToggleAutoBet = () => {
		if (isAutoBetActive) {
			setIsAutoBetActive(false);
			setRemainingRounds(0);
		} else {
			const roundsVal = parseInt(autoRounds, 10);
			if (Number.isNaN(roundsVal) || roundsVal <= 0) return;
			setIsAutoBetActive(true);
			setRemainingRounds(roundsVal);
		}
	};

	// Auto-Betting Client-Side Loop simulator
	useEffect(() => {
		if (
			state.roundState === "BETTING" &&
			state.roundId !== lastPlacedRoundId.current
		) {
			if (isAutoBetActive && remainingRounds > 0 && !state.userBet) {
				lastPlacedRoundId.current = state.roundId;
				handlePlaceBet();
				setRemainingRounds((prev) => {
					const next = prev - 1;
					if (next <= 0) {
						setIsAutoBetActive(false);
					}
					return next;
				});
			}
		}
	}, [
		state.roundState,
		state.roundId,
		isAutoBetActive,
		remainingRounds,
		state.userBet,
		handlePlaceBet,
	]);

	// Dynamic cashout return calculator
	const getDynamicPayout = () => {
		if (!state.userBet) return "0.00";
		const payout =
			(state.userBet.amount /
				(selectedCurrency === "BTC"
					? 100000000
					: selectedCurrency === "ETH"
						? 1000000000000000000
						: 100)) *
			state.currentMultiplier;
		if (selectedCurrency === "BRL") return `R$ ${payout.toFixed(2)}`;
		if (selectedCurrency === "USD") return `$${payout.toFixed(2)}`;
		return `${payout.toFixed(8)} ${selectedCurrency}`;
	};

	// Conversions display (BTC, ETH -> USD/BRL)
	const getConvertedValues = () => {
		const val = parseFloat(betAmount);
		if (Number.isNaN(val) || val <= 0) return null;

		if (selectedCurrency === "BTC") {
			const usdValue = val * 65000;
			const brlValue = usdValue / 0.18;
			return { usd: usdValue, brl: brlValue };
		}
		if (selectedCurrency === "ETH") {
			const usdValue = val * 3500;
			const brlValue = usdValue / 0.18;
			return { usd: usdValue, brl: brlValue };
		}
		return null;
	};

	const convertedValues = getConvertedValues();

	return (
		<div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col gap-4">
			{/* Tabs header */}
			<div className="grid grid-cols-2 bg-surface-container-lowest rounded-xl p-1 border border-outline-variant">
				<button
					onClick={() => setActiveTab("manual")}
					type="button"
					className={`py-2 rounded-lg text-xs font-bold font-mono tracking-wider cursor-pointer transition-all ${
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
					className={`py-2 rounded-lg text-xs font-bold font-mono tracking-wider cursor-pointer transition-all ${
						activeTab === "auto"
							? "bg-surface-container-high text-white shadow-sm"
							: "text-on-surface-variant hover:text-white"
					}`}
				>
					Automatic
				</button>
			</div>

			{/* Currency pills selector */}
			<div className="space-y-1">
				<span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider block">
					Currency
				</span>
				<div className="flex gap-1.5 overflow-x-auto py-1">
					{state.balances.map((b) => (
						<button
							key={b.currency}
							type="button"
							onClick={() => {
								if (!state.userBet || state.userBet.status === "REJECTED") {
									setSelectedCurrency(b.currency);
								}
							}}
							disabled={!!state.userBet && state.userBet.status !== "REJECTED"}
							className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer disabled:opacity-50 ${
								selectedCurrency === b.currency
									? "bg-primary/20 text-primary border border-primary/30 active-neon-border"
									: "bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-white"
							}`}
						>
							{b.currency}
						</button>
					))}
				</div>
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
						step={
							selectedCurrency === "BTC" || selectedCurrency === "ETH"
								? "0.0001"
								: "0.01"
						}
						min={
							selectedCurrency === "BTC" || selectedCurrency === "ETH"
								? "0.00000001"
								: "0.10"
						}
						value={betAmount}
						onChange={(e) => setBetAmount(e.target.value)}
						disabled={!!state.userBet && state.userBet.status !== "REJECTED"}
					/>
					<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
						<button
							onClick={handleHalf}
							type="button"
							disabled={!!state.userBet && state.userBet.status !== "REJECTED"}
							className="bg-surface-container border border-outline-variant hover:border-primary/50 text-[10px] text-on-surface font-bold py-1.5 px-2.5 rounded-lg active:scale-95 cursor-pointer disabled:opacity-50"
						>
							½
						</button>
						<button
							onClick={handleDouble}
							type="button"
							disabled={!!state.userBet && state.userBet.status !== "REJECTED"}
							className="bg-surface-container border border-outline-variant hover:border-primary/50 text-[10px] text-on-surface font-bold py-1.5 px-2.5 rounded-lg active:scale-95 cursor-pointer disabled:opacity-50"
						>
							2x
						</button>
						<button
							onClick={handleMax}
							type="button"
							disabled={!!state.userBet && state.userBet.status !== "REJECTED"}
							className="bg-surface-container border border-outline-variant hover:border-primary/50 text-[10px] text-on-surface font-bold py-1.5 px-2.5 rounded-lg active:scale-95 cursor-pointer disabled:opacity-50"
						>
							MAX
						</button>
					</div>
				</div>

				{/* Crypto Coin Converter Display */}
				{convertedValues && (
					<div className="text-[10px] font-mono text-on-surface-variant mt-1.5 flex justify-between items-center bg-surface-container-lowest/60 px-3 py-2 rounded-lg border border-outline-variant/30">
						<span>
							Est. USD:{" "}
							<span className="text-white font-bold">
								$
								{convertedValues.usd.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</span>
						<span>
							Est. BRL:{" "}
							<span className="text-white font-bold">
								R${" "}
								{convertedValues.brl.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</span>
					</div>
				)}
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
						disabled={!!state.userBet && state.userBet.status !== "REJECTED"}
					/>
					<span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-on-surface-variant/40">
						x
					</span>
				</div>
			</div>

			{/* Auto tab config: Rounds selection */}
			{activeTab === "auto" && (
				<div className="space-y-1.5">
					<span className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider block">
						Number of Rounds
					</span>
					<input
						className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 text-sm text-white font-mono outline-none focus:border-primary transition-all"
						type="number"
						min="1"
						value={autoRounds}
						onChange={(e) => setAutoRounds(e.target.value)}
						disabled={isAutoBetActive}
					/>
				</div>
			)}

			{/* Big Action button */}
			{/* Case 1: Active Bet in Gameplay phase -> Show Cash Out */}
			{state.userBet &&
			(state.userBet.status === "PENDING" ||
				state.userBet.status === "CONFIRMED") &&
			state.roundState === "GAMEPLAY" ? (
				<button
					onClick={handleCashout}
					type="button"
					className="w-full bg-amber-500 text-white py-4.5 rounded-xl font-black cursor-pointer text-sm tracking-wider uppercase text-center active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]"
				>
					CASH OUT ({getDynamicPayout()})
				</button>
			) : /* Case 2: Active Bet in Betting phase -> Show Cancel Bet */
			state.userBet &&
				(state.userBet.status === "PENDING" ||
					state.userBet.status === "CONFIRMED") &&
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
			) : /* Case 3: Bet completed (Cashout / Lost) -> Show round result status badge */
			state.userBet &&
				state.userBet.status !== "PENDING" &&
				state.userBet.status !== "CONFIRMED" &&
				state.userBet.status !== "REJECTED" ? (
				<div className="flex flex-col gap-2">
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
					{/* For auto-betting, let the user cancel the auto run if it's currently between rounds */}
					{activeTab === "auto" && isAutoBetActive && (
						<button
							onClick={handleToggleAutoBet}
							type="button"
							className="w-full bg-red-500/20 border border-red-500/40 text-red-400 py-2.5 rounded-xl font-bold cursor-pointer text-xs tracking-wider uppercase text-center active:scale-95 transition-all"
						>
							Stop Auto Bet ({remainingRounds} Left)
						</button>
					)}
				</div>
			) : /* Case 4: No active bet in progress -> Render standard tab bet buttons */
			activeTab === "auto" ? (
				<button
					onClick={handleToggleAutoBet}
					type="button"
					className={`w-full py-4.5 rounded-xl font-bold active:scale-95 cursor-pointer text-sm tracking-wider uppercase text-center transition-all ${
						isAutoBetActive
							? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
							: "bg-primary text-on-primary neon-btn-glow"
					}`}
				>
					{isAutoBetActive
						? `Stop Auto Bet (${remainingRounds} Left)`
						: `Start Auto Bet (${autoRounds} Rounds)`}
				</button>
			) : (
				<button
					onClick={handlePlaceBet}
					type="button"
					disabled={state.roundState !== "BETTING"}
					className="w-full bg-primary text-on-primary py-4.5 rounded-xl font-bold active:scale-95 cursor-pointer text-sm tracking-wider uppercase text-center neon-btn-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
				>
					Place Bet (
					{selectedCurrency === "BRL"
						? `R$ ${parseFloat(betAmount).toFixed(2)}`
						: selectedCurrency === "USD"
							? `$${parseFloat(betAmount).toFixed(2)}`
							: `${parseFloat(betAmount).toFixed(6)} ${selectedCurrency}`}
					)
				</button>
			)}

			{/* Client error warnings */}
			{state.error && (
				<p className="text-[10px] text-red-400 text-center font-mono mt-1 bg-red-500/5 py-1 px-3 rounded border border-red-500/10">
					{state.error}
				</p>
			)}
		</div>
	);
};

export default BetPanel;
