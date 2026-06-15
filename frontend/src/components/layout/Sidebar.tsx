import { Link } from "@tanstack/react-router";
import { useState } from "react";

interface SidebarProps {
	onDepositClick?: () => void;
}

export default function Sidebar({ onDepositClick }: SidebarProps) {
	const [isGamesOpen, setIsGamesOpen] = useState(true);

	return (
		<aside
			id="tour-sidebar"
			className="fixed left-0 top-0 h-full flex flex-col pt-24 pb-4 border-r border-outline-variant bg-surface-container w-64 hidden lg:flex z-40"
		>
			<nav className="flex flex-col gap-2 px-4 flex-grow">
				{/* Lobby Link */}
				<Link
					to="/"
					className="flex items-center gap-3 text-on-surface-variant px-4 py-3 rounded-lg hover:text-primary hover:bg-surface-variant transition-all [&.active]:bg-secondary-container [&.active]:text-primary [&.active]:shadow-[0_0_15px_rgba(125,255,103,0.15)]"
					activeOptions={{ exact: true }}
				>
					<span className="material-symbols-outlined">home</span>
					<span className="font-sans font-bold text-sm tracking-wide">
						Lobby
					</span>
				</Link>

				{/* Collapsible Games Accordion */}
				<div className="flex flex-col gap-1">
					<button
						onClick={() => setIsGamesOpen(!isGamesOpen)}
						type="button"
						className="flex items-center justify-between text-on-surface-variant px-4 py-3 rounded-lg hover:text-primary hover:bg-surface-variant transition-all cursor-pointer w-full text-left outline-none"
					>
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined">casino</span>
							<span className="font-sans font-bold text-sm tracking-wide">
								Games
							</span>
						</div>
						<span
							className={`material-symbols-outlined text-xs transition-transform duration-200 ${
								isGamesOpen ? "rotate-180" : ""
							}`}
						>
							keyboard_arrow_down
						</span>
					</button>

					{isGamesOpen && (
						<div className="pl-4 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
							<Link
								to="/play/crash"
								className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 rounded-lg hover:text-primary hover:bg-surface-variant transition-all [&.active]:bg-secondary-container/50 [&.active]:text-primary [&.active]:shadow-[0_0_10px_rgba(125,255,103,0.1)]"
							>
								<span className="material-symbols-outlined text-sm">
									rocket_launch
								</span>
								<span className="font-sans font-medium text-xs tracking-wide">
									Jungle Crash
								</span>
							</Link>
						</div>
					)}
				</div>

				{/* Wallet/Deposit Link */}
				<Link
					to="/deposit"
					className="flex items-center gap-3 text-on-surface-variant px-4 py-3 rounded-lg hover:text-primary hover:bg-surface-variant transition-all [&.active]:bg-secondary-container [&.active]:text-primary [&.active]:shadow-[0_0_15px_rgba(125,255,103,0.15)]"
				>
					<span className="material-symbols-outlined">
						account_balance_wallet
					</span>
					<span className="font-sans font-bold text-sm tracking-wide">
						Deposit
					</span>
				</Link>

				{/* Profile Link */}
				<Link
					to="/profile"
					className="flex items-center gap-3 text-on-surface-variant px-4 py-3 rounded-lg hover:text-primary hover:bg-surface-variant transition-all [&.active]:bg-secondary-container [&.active]:text-primary [&.active]:shadow-[0_0_15px_rgba(125,255,103,0.15)]"
				>
					<span className="material-symbols-outlined">person</span>
					<span className="font-sans font-bold text-sm tracking-wide">
						Profile
					</span>
				</Link>
			</nav>

			<div className="px-4 mt-auto space-y-2">
				<button
					id="tour-deposit-btn"
					onClick={onDepositClick}
					type="button"
					className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 neon-btn-glow active:scale-95 transition-all cursor-pointer"
				>
					<span className="material-symbols-outlined">add_circle</span>
					<span>Deposit Now</span>
				</button>
				<div className="h-px bg-outline-variant my-4"></div>
				<a
					className="flex items-center gap-3 text-on-surface-variant px-4 py-2 hover:text-primary transition-all"
					href="#support"
				>
					<span className="material-symbols-outlined">support_agent</span>
					<span className="font-sans text-sm font-bold">Support</span>
				</a>
			</div>
		</aside>
	);
}
