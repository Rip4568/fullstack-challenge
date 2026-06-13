import { Link } from "@tanstack/react-router";

interface BottomNavProps {
	onMenuToggle?: () => void;
}

export default function BottomNav({ onMenuToggle }: BottomNavProps) {
	return (
		<nav className="fixed bottom-0 left-0 w-full z-50 rounded-t-xl bg-surface-container-high border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,230,1,0.15)] flex justify-around items-center h-20 pb-safe px-2 lg:hidden">
			<button
				onClick={onMenuToggle}
				type="button"
				className="flex flex-col items-center justify-center text-on-surface-variant py-1 px-3 hover:text-primary transition-all active:scale-90"
			>
				<span className="material-symbols-outlined">menu_open</span>
				<span className="text-[10px] uppercase font-mono tracking-wider mt-1">
					Menu
				</span>
			</button>

			<Link
				to="/"
				activeOptions={{ exact: true }}
				className="flex flex-col items-center justify-center text-on-surface-variant py-1 px-3 hover:text-primary transition-all [&.active]:text-primary [&.active]:font-bold active:scale-90"
			>
				<span className="material-symbols-outlined">explore</span>
				<span className="text-[10px] uppercase font-mono tracking-wider mt-1">
					Lobby
				</span>
			</Link>

			<Link
				to="/deposit"
				className="flex flex-col items-center justify-center text-primary bg-primary/10 rounded-xl py-2 px-4 shadow-[0_0_10px_rgba(125,255,103,0.3)] active:scale-90"
			>
				<span className="material-symbols-outlined fill">add_circle</span>
				<span className="text-[10px] uppercase font-mono tracking-wider mt-1">
					Deposit
				</span>
			</Link>

			<Link
				to="/play/crash"
				className="flex flex-col items-center justify-center text-on-surface-variant py-1 px-3 hover:text-primary transition-all [&.active]:text-primary [&.active]:font-bold active:scale-90"
			>
				<span className="material-symbols-outlined">rocket_launch</span>
				<span className="text-[10px] uppercase font-mono tracking-wider mt-1">
					Play
				</span>
			</Link>

			<Link
				to="/profile"
				className="flex flex-col items-center justify-center text-on-surface-variant py-1 px-3 hover:text-primary transition-all [&.active]:text-primary [&.active]:font-bold active:scale-90"
			>
				<span className="material-symbols-outlined">person</span>
				<span className="text-[10px] uppercase font-mono tracking-wider mt-1">
					Profile
				</span>
			</Link>
		</nav>
	);
}
