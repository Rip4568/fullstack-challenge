import { Link } from "@tanstack/react-router";

interface SidebarProps {
	onDepositClick?: () => void;
}

export default function Sidebar({ onDepositClick }: SidebarProps) {
	return (
		<aside className="fixed left-0 top-0 h-full flex flex-col pt-24 pb-4 border-r border-outline-variant bg-surface-container w-64 hidden lg:flex z-40">
			<nav className="flex flex-col gap-2 px-4 flex-grow">
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

				<Link
					to="/play/crash"
					className="flex items-center gap-3 text-on-surface-variant px-4 py-3 rounded-lg hover:text-primary hover:bg-surface-variant transition-all [&.active]:bg-secondary-container [&.active]:text-primary [&.active]:shadow-[0_0_15px_rgba(125,255,103,0.15)]"
				>
					<span className="material-symbols-outlined">rocket_launch</span>
					<span className="font-sans font-bold text-sm tracking-wide">
						Jungle Crash
					</span>
				</Link>

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
