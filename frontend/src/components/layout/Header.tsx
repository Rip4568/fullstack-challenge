import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { authService } from "../../core/auth.service";
import { gameStore, useGameState } from "../../core/store";

export default function Header() {
	const state = useGameState();
	const [selectedCurrency, setSelectedCurrency] = useState("BRL");
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const activeBalance = state.balances.find(
		(b) => b.currency === selectedCurrency,
	);

	const formatBalance = () => {
		if (!activeBalance) return "R$ 0,00";
		const val = activeBalance.amountFormatted;
		if (selectedCurrency === "BRL") {
			return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		}
		if (selectedCurrency === "USD") {
			return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		}
		return `${val.toFixed(8)} ${selectedCurrency}`;
	};

	// Close dropdown on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<header className="flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50 bg-surface border-b border-outline-variant glass">
			<div className="flex items-center gap-4">
				<Link
					to="/"
					className="text-headline-md font-sans font-extrabold text-primary tracking-tighter neon-glow"
				>
					Jungle Crash
				</Link>
			</div>

			<div className="flex items-center gap-3">
				{/* Balance Selector Dropdown */}
				<div className="relative" ref={dropdownRef}>
					<button
						onClick={() => setDropdownOpen(!dropdownOpen)}
						type="button"
						className="flex items-center gap-2 bg-surface-container-low px-4 py-1.5 rounded-lg border border-outline-variant cursor-pointer active:scale-95 transition-transform hover:border-primary/50"
					>
						<span className="material-symbols-outlined text-primary fill">
							account_balance_wallet
						</span>
						<span className="font-mono text-sm text-primary font-bold">
							{formatBalance()}
						</span>
						<span className="material-symbols-outlined text-xs text-on-surface-variant">
							keyboard_arrow_down
						</span>
					</button>

					{dropdownOpen && (
						<div className="absolute right-0 mt-2 w-48 bg-surface-container rounded-xl border border-outline-variant shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
							{state.balances.map((b) => (
								<button
									key={b.currency}
									onClick={() => {
										setSelectedCurrency(b.currency);
										setDropdownOpen(false);
									}}
									type="button"
									className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold font-mono transition-colors flex justify-between items-center cursor-pointer ${
										selectedCurrency === b.currency
											? "bg-secondary-container text-primary"
											: "text-on-surface hover:bg-surface-container-high"
									}`}
								>
									<span>{b.currency}</span>
									<span className="opacity-80">
										{b.currency === "BRL"
											? `R$ ${b.amountFormatted.toFixed(2)}`
											: b.currency === "USD"
												? `$${b.amountFormatted.toFixed(2)}`
												: b.amountFormatted.toFixed(5)}
									</span>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Auth status or login actions */}
				{state.username ? (
					<div className="flex items-center gap-3">
						<span className="hidden sm:inline text-xs font-mono text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant">
							@{state.username}
						</span>
						<button
							onClick={() => {
								if (state.mode === "real") {
									authService.logout();
								} else {
									gameStore.setState({ username: null, playerId: null });
								}
							}}
							type="button"
							className="text-xs hover:bg-surface-variant text-on-surface-variant hover:text-white transition-colors active:scale-95 transition-transform border border-outline-variant px-3 py-2 rounded-lg font-bold cursor-pointer"
						>
							Logout
						</button>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<button
							onClick={() => {
								if (state.mode === "real") {
									authService.redirectToLogin();
								} else {
									gameStore.setState({
										username: "GorillaGambler",
										playerId: "mock-player-id",
									});
									gameStore.addToast({
										type: "success",
										message: "Login efetuado com sucesso! Bem-vindo de volta.",
									});
								}
							}}
							type="button"
							className="hover:bg-surface-variant text-primary font-bold px-4 py-2 rounded-lg active:scale-95 transition-transform cursor-pointer"
						>
							Login
						</button>
						<button
							onClick={() => {
								if (state.mode === "real") {
									authService.redirectToRegister();
								} else {
									gameStore.setState({
										username: "LuckyHunter",
										playerId: "mock-player-id",
									});
									gameStore.addToast({
										type: "success",
										message:
											"Cadastro realizado com sucesso! Bem-vindo ao Jungle Crash.",
									});
								}
							}}
							type="button"
							className="bg-primary text-on-primary px-5 py-2 rounded-lg font-bold active:scale-95 transition-transform neon-btn-glow cursor-pointer"
						>
							Sign Up
						</button>
					</div>
				)}
			</div>
		</header>
	);
}
