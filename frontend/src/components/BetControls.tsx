import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/api.service";
import { useGameState } from "../services/store";

export default function BetControls() {
	const { roundState, currentMultiplier, userBet, balances } = useGameState();

	const [currency, setCurrency] = useState<string>("BRL");
	const [amountStr, setAmountStr] = useState<string>("10");
	const [autoCashoutStr, setAutoCashoutStr] = useState<string>("");
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	const selectedBalance = balances.find((b) => b.currency === currency) || {
		amount: 0,
		amountFormatted: 0,
		estimatedUsdValue: 0,
	};

	const handleCashout = useCallback(async () => {
		if (loading) return;
		setLoading(true);
		setErrorMsg(null);

		try {
			await apiService.cashout(currentMultiplier);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			setErrorMsg(msg);
		} finally {
			setLoading(false);
		}
	}, [loading, currentMultiplier]);

	// Clear errors when changing currency or amount
	useEffect(() => {
		setErrorMsg(null);
	}, []);

	// Handle auto-cashout on store updates if in Gameplay phase
	useEffect(() => {
		if (
			roundState === "GAMEPLAY" &&
			userBet &&
			userBet.status === "CONFIRMED"
		) {
			const autoCashoutVal = parseFloat(autoCashoutStr);
			if (
				!Number.isNaN(autoCashoutVal) &&
				autoCashoutVal > 1.0 &&
				currentMultiplier >= autoCashoutVal
			) {
				// Trigger automatic cashout
				handleCashout();
			}
		}
	}, [
		roundState,
		currentMultiplier,
		userBet,
		autoCashoutStr, // Trigger automatic cashout
		handleCashout,
	]);

	const handlePlaceBet = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMsg(null);
		setLoading(true);

		try {
			const inputVal = parseFloat(amountStr);
			if (Number.isNaN(inputVal) || inputVal <= 0) {
				throw new Error("Por favor insira um valor válido.");
			}

			// Convert to minor unit based on currency
			let finalAmount = 0;
			if (currency === "BRL" || currency === "USD") {
				finalAmount = Math.round(inputVal * 100);
				if (finalAmount < 100 || finalAmount > 100000) {
					throw new Error(
						"O valor da aposta deve ser entre R$/$ 1.00 e 1,000.00.",
					);
				}
			} else {
				// BTC (Satoshis) and ETH (Wei) are passed directly as integers
				finalAmount = Math.floor(inputVal);
				if (finalAmount < 100 || finalAmount > 100000) {
					throw new Error(
						`O valor da aposta em ${currency} deve ser entre 100 e 100,000 ${currency === "BTC" ? "Satoshis" : "Wei"}.`,
					);
				}
			}

			if (selectedBalance.amount < finalAmount) {
				throw new Error("Saldo insuficiente para realizar esta aposta.");
			}

			const autoMult = parseFloat(autoCashoutStr);
			const finalAutoMult =
				!Number.isNaN(autoMult) && autoMult > 1.0 ? autoMult : null;

			await apiService.placeBet(finalAmount, currency, finalAutoMult);
		} catch (err: any) {
			setErrorMsg(err.message || "Erro desconhecido ao apostar.");
		} finally {
			setLoading(false);
		}
	};

	// Shortcut handlers
	const handleHalf = () => {
		const val = parseFloat(amountStr);
		if (!Number.isNaN(val) && val > 0) {
			if (currency === "BRL" || currency === "USD") {
				setAmountStr(Math.max(1.0, val / 2).toFixed(2));
			} else {
				setAmountStr(Math.max(100, Math.floor(val / 2)).toString());
			}
		}
	};

	const handleDouble = () => {
		const val = parseFloat(amountStr);
		if (!Number.isNaN(val) && val > 0) {
			if (currency === "BRL" || currency === "USD") {
				setAmountStr(Math.min(1000.0, val * 2).toFixed(2));
			} else {
				setAmountStr(Math.min(100000, val * 2).toString());
			}
		}
	};

	const handleMax = () => {
		if (currency === "BRL" || currency === "USD") {
			const maxVal = Math.min(1000.0, selectedBalance.amountFormatted);
			setAmountStr(maxVal.toFixed(2));
		} else {
			const maxVal = Math.min(100000, selectedBalance.amount);
			setAmountStr(maxVal.toString());
		}
	};

	const formatBalance = () => {
		if (currency === "BRL") {
			return `R$ ${selectedBalance.amountFormatted.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
		}
		if (currency === "USD") {
			return `$ ${selectedBalance.amountFormatted.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
		}
		if (currency === "BTC") {
			return `${selectedBalance.amountFormatted.toFixed(8)} BTC (${selectedBalance.amount.toLocaleString()} Sats)`;
		}
		if (currency === "ETH") {
			// Show Wei if small, or formatted ETH
			return `${selectedBalance.amountFormatted.toFixed(6)} ETH (${(selectedBalance.amount / 1e18).toFixed(4)} ETH)`;
		}
		return selectedBalance.amountFormatted.toString();
	};

	const getButtonState = () => {
		if (roundState === "BETTING") {
			if (!userBet) {
				return {
					text: loading ? "Enviando..." : "Apostar",
					onClick: handlePlaceBet,
					disabled: loading,
					className:
						"bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black",
				};
			}
			return {
				text: "Aposta Confirmada",
				onClick: undefined,
				disabled: true,
				className:
					"bg-emerald-950/40 text-emerald-500 border border-emerald-500/20 cursor-not-allowed",
			};
		}

		if (roundState === "GAMEPLAY") {
			if (userBet && userBet.status === "CONFIRMED") {
				// Calculate dynamic cashout payout in real-time
				let payoutDisplay = "";
				const potentialPayout = userBet.amount * currentMultiplier;
				if (userBet.currency === "BRL") {
					payoutDisplay = `R$ ${(potentialPayout / 100).toFixed(2)}`;
				} else if (userBet.currency === "USD") {
					payoutDisplay = `$ ${(potentialPayout / 100).toFixed(2)}`;
				} else if (userBet.currency === "BTC") {
					payoutDisplay = `${Math.floor(potentialPayout).toLocaleString()} Sats`;
				} else if (userBet.currency === "ETH") {
					payoutDisplay = `${(potentialPayout / 1e18).toFixed(6)} ETH`;
				}

				return {
					text: `CASH OUT (${payoutDisplay})`,
					onClick: handleCashout,
					disabled: loading,
					className:
						"bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-black shadow-lg shadow-amber-500/20 animate-pulse font-bold",
				};
			}

			if (userBet && userBet.status === "CASHOUT") {
				let winDisplay = "";
				if (userBet.payoutAmount) {
					const div =
						userBet.currency === "BTC"
							? 1e8
							: userBet.currency === "ETH"
								? 1e18
								: 100;
					winDisplay = (userBet.payoutAmount / div).toFixed(
						userBet.currency === "BTC" ? 6 : userBet.currency === "ETH" ? 6 : 2,
					);
				}
				return {
					text: `Ganhou ${winDisplay} ${userBet.currency}!`,
					onClick: undefined,
					disabled: true,
					className:
						"bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed font-semibold",
				};
			}

			if (userBet && userBet.status === "LOST") {
				return {
					text: "Aposta Perdida",
					onClick: undefined,
					disabled: true,
					className:
						"bg-rose-950/40 text-rose-500 border border-rose-500/20 cursor-not-allowed",
				};
			}

			return {
				text: "Aposta Fechada",
				onClick: undefined,
				disabled: true,
				className:
					"bg-gray-800/40 text-gray-500 border border-gray-700/30 cursor-not-allowed",
			};
		}

		// CRASHED
		if (userBet && userBet.status === "CASHOUT") {
			let winDisplay = "";
			if (userBet.payoutAmount) {
				const div =
					userBet.currency === "BTC"
						? 1e8
						: userBet.currency === "ETH"
							? 1e18
							: 100;
				winDisplay = (userBet.payoutAmount / div).toFixed(
					userBet.currency === "BTC" ? 6 : userBet.currency === "ETH" ? 6 : 2,
				);
			}
			return {
				text: `Ganhou ${winDisplay} ${userBet.currency}!`,
				onClick: undefined,
				disabled: true,
				className:
					"bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed font-semibold",
			};
		}

		if (userBet && userBet.status === "LOST") {
			return {
				text: "Aposta Perdida",
				onClick: undefined,
				disabled: true,
				className:
					"bg-rose-950/40 text-rose-500 border border-rose-500/20 cursor-not-allowed",
			};
		}

		return {
			text: "Aguardando próxima rodada...",
			onClick: undefined,
			disabled: true,
			className:
				"bg-gray-800/40 text-gray-500 border border-gray-700/30 cursor-not-allowed",
		};
	};

	const btn = getButtonState();

	return (
		<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-[inset_0_1px_0_var(--inset-glint)] backdrop-blur-md flex flex-col gap-5">
			{/* Wallet Balance Info */}
			<div>
				<div className="text-xs text-[var(--sea-ink-soft)] font-medium mb-1.5 uppercase tracking-wider">
					Seu Saldo
				</div>
				<div className="flex items-baseline justify-between gap-2">
					<div className="text-xl font-bold font-mono text-white tracking-tight">
						{formatBalance()}
					</div>
					<div className="text-xs text-[var(--sea-ink-soft)] font-mono">
						≈{" "}
						{selectedBalance.estimatedUsdValue.toLocaleString("en-US", {
							minimumFractionDigits: 2,
						})}{" "}
						USD
					</div>
				</div>
			</div>

			{/* Currency Tabs */}
			<div className="grid grid-cols-4 gap-1.5 bg-black/30 p-1 rounded-xl">
				{["BRL", "USD", "BTC", "ETH"].map((cur) => (
					<button
						key={cur}
						type="button"
						onClick={() => {
							if (roundState !== "BETTING" || userBet) return;
							setCurrency(cur);
							if (cur === "BRL" || cur === "USD") {
								setAmountStr("10");
							} else if (cur === "BTC") {
								setAmountStr("1000"); // 1000 Sats
							} else {
								setAmountStr("10000"); // 10000 Wei
							}
						}}
						disabled={roundState !== "BETTING" || !!userBet}
						className={`py-2 text-xs font-semibold rounded-lg transition-all ${
							currency === cur
								? "bg-[var(--lagoon)] text-black shadow-sm"
								: "text-[var(--sea-ink-soft)] hover:text-white disabled:hover:text-[var(--sea-ink-soft)] disabled:opacity-50"
						}`}
					>
						{cur}
					</button>
				))}
			</div>

			{/* Inputs Form */}
			<form
				onSubmit={
					btn.onClick ? (e) => btn.onClick?.(e) : (e) => e.preventDefault()
				}
				className="flex flex-col gap-4"
			>
				{/* Bet Amount Input */}
				<div>
					<div className="flex justify-between items-center mb-1.5">
						<label
							htmlFor="bet-amount-input"
							className="text-xs text-[var(--sea-ink-soft)] font-medium uppercase tracking-wide"
						>
							Valor da Aposta (
							{currency === "BRL" || currency === "USD"
								? currency
								: currency === "BTC"
									? "Satoshis"
									: "Wei"}
							)
						</label>
						<span className="text-[10px] text-[var(--sea-ink-soft)] font-mono">
							Lims:{" "}
							{currency === "BRL" || currency === "USD"
								? "1.00 - 1,000.00"
								: "100 - 100,000"}
						</span>
					</div>

					<div className="relative">
						<input
							type="text"
							id="bet-amount-input"
							value={amountStr}
							onChange={(e) =>
								setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))
							}
							disabled={roundState !== "BETTING" || !!userBet}
							className="w-full bg-black/40 border border-[var(--line)] rounded-xl py-3 px-4 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[var(--lagoon)] disabled:opacity-60"
						/>
						{/* Quick buttons */}
						<div className="absolute right-2 top-1.5 flex gap-1">
							<button
								type="button"
								onClick={handleHalf}
								disabled={roundState !== "BETTING" || !!userBet}
								className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-[10px] font-bold text-white px-2 py-1.5 rounded-lg border border-gray-700/50"
							>
								½
							</button>
							<button
								type="button"
								onClick={handleDouble}
								disabled={roundState !== "BETTING" || !!userBet}
								className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-[10px] font-bold text-white px-2 py-1.5 rounded-lg border border-gray-700/50"
							>
								2x
							</button>
							<button
								type="button"
								onClick={handleMax}
								disabled={roundState !== "BETTING" || !!userBet}
								className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-[10px] font-bold text-white px-2.5 py-1.5 rounded-lg border border-gray-700/50"
							>
								MAX
							</button>
						</div>
					</div>
				</div>

				{/* Auto Cashout Input */}
				<div>
					<div className="flex justify-between items-center mb-1.5">
						<label
							htmlFor="auto-cashout-input"
							className="text-xs text-[var(--sea-ink-soft)] font-medium uppercase tracking-wide"
						>
							Saque Automático (Auto Cashout)
						</label>
						<span className="text-[10px] text-[var(--sea-ink-soft)]">
							Opcional
						</span>
					</div>
					<input
						type="text"
						id="auto-cashout-input"
						value={autoCashoutStr}
						placeholder="Ex: 2.00"
						onChange={(e) =>
							setAutoCashoutStr(e.target.value.replace(/[^0-9.]/g, ""))
						}
						disabled={roundState !== "BETTING" || !!userBet}
						className="w-full bg-black/40 border border-[var(--line)] rounded-xl py-3 px-4 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[var(--lagoon)] disabled:opacity-60"
					/>
				</div>

				{/* Local Error Output */}
				{errorMsg && (
					<div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 rounded-xl font-medium">
						⚠️ {errorMsg}
					</div>
				)}

				{/* Action Button */}
				<button
					type="submit"
					onClick={btn.onClick}
					disabled={btn.disabled}
					className={`w-full py-4 rounded-xl text-sm font-semibold tracking-wide transition-all border border-transparent flex justify-center items-center gap-2 ${btn.className}`}
				>
					{loading && (
						<svg
							className="animate-spin h-4 w-4 text-current"
							viewBox="0 0 24 24"
							fill="none"
							aria-label="Carregando"
						>
							<title>Carregando</title>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					)}
					{btn.text}
				</button>
			</form>
		</div>
	);
}
