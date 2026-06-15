import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	type QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import JungleBackground from "../components/layout/JungleBackground";
import Sidebar from "../components/layout/Sidebar";
import { authService } from "../core/auth.service";
import { gameStore, useGameState } from "../core/store";
import { startJungleTour } from "../core/tour";
import { walletQueryOptions } from "../queries/wallet.queries";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var resolved='dark';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
	{
		head: () => ({
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1.0, viewport-fit=cover",
				},
				{ title: "Jungle Crash | High-Stakes Gaming" },
			],
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "icon", href: "/icons/favicon.ico" },
			],
		}),
		shellComponent: RootDocument,
	},
);

function AppShell() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const state = useGameState();

	// Handle Keycloak callback on first load
	useEffect(() => {
		const handleAuth = async () => {
			const success = await authService.handleCallback();
			if (!success) {
				authService.checkLocalSession();
			}
		};
		handleAuth();
	}, []);

	// Run tour on mount if not completed before
	useEffect(() => {
		const timer = setTimeout(() => {
			startJungleTour(false);
		}, 1000);
		return () => clearTimeout(timer);
	}, []);

	// Fetch wallet with TanStack Query — syncs result to gameStore for real-time components
	const { data: walletData } = useQuery({
		...walletQueryOptions(),
		enabled: state.mode === "real" && !!state.token,
	});

	useEffect(() => {
		if (walletData?.balances) {
			gameStore.setState({ balances: walletData.balances });
		}
	}, [walletData]);

	return (
		<>
			<Header />
			<JungleBackground />

			<div className="flex w-full min-h-screen pt-20">
				<Sidebar onDepositClick={() => {}} />
				<div className="flex-1 lg:pl-64 w-full min-w-0 min-h-[calc(100vh-5rem)]">
					<Outlet />
				</div>
			</div>

			<BottomNav onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

			{isMobileMenuOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden animate-fade-in">
					<div className="w-64 h-full bg-surface-container border-r border-outline-variant p-6 flex flex-col">
						<div className="flex items-center justify-between mb-8">
							<span className="text-xl font-extrabold text-primary neon-glow">
								Jungle Menu
							</span>
							<button
								onClick={() => setIsMobileMenuOpen(false)}
								type="button"
								className="text-on-surface-variant hover:text-white"
							>
								<span className="material-symbols-outlined">close</span>
							</button>
						</div>
						<nav className="flex flex-col gap-4">
							<Link
								to="/"
								onClick={() => setIsMobileMenuOpen(false)}
								className="flex items-center gap-3 text-on-surface-variant py-2 border-b border-outline-variant/30 hover:text-primary"
							>
								<span className="material-symbols-outlined">explore</span>
								<span>Lobby</span>
							</Link>
							<Link
								to="/play/crash"
								onClick={() => setIsMobileMenuOpen(false)}
								className="flex items-center gap-3 text-on-surface-variant py-2 border-b border-outline-variant/30 hover:text-primary"
							>
								<span className="material-symbols-outlined">rocket_launch</span>
								<span>Jungle Crash</span>
							</Link>
							<Link
								to="/deposit"
								onClick={() => setIsMobileMenuOpen(false)}
								className="flex items-center gap-3 text-on-surface-variant py-2 border-b border-outline-variant/30 hover:text-primary"
							>
								<span className="material-symbols-outlined">
									account_balance_wallet
								</span>
								<span>Deposit</span>
							</Link>
							<Link
								to="/profile"
								onClick={() => setIsMobileMenuOpen(false)}
								className="flex items-center gap-3 text-on-surface-variant py-2 border-b border-outline-variant/30 hover:text-primary"
							>
								<span className="material-symbols-outlined">person</span>
								<span>Profile</span>
							</Link>
						</nav>
					</div>
				</div>
			)}

			{/* Toast Container */}
			<div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
				{state.toasts.map((toast) => (
					<div
						key={toast.id}
						className={`pointer-events-auto flex items-start justify-between p-4 rounded-lg shadow-lg border transition-all duration-300 ${
							toast.type === "success"
								? "bg-emerald-950/95 text-emerald-100 border-emerald-500/50"
								: toast.type === "error"
									? "bg-rose-950/95 text-rose-100 border-rose-500/50"
									: toast.type === "warning"
										? "bg-amber-950/95 text-amber-100 border-amber-500/50"
										: "bg-blue-950/95 text-blue-100 border-blue-500/50"
						}`}
					>
						<div className="flex items-start gap-3">
							<span className="material-symbols-outlined select-none mt-0.5">
								{toast.type === "success"
									? "check_circle"
									: toast.type === "error"
										? "error"
										: toast.type === "warning"
											? "warning"
											: "info"}
							</span>
							<p className="text-sm font-medium whitespace-pre-line leading-relaxed">
								{toast.message}
							</p>
						</div>
						<button
							onClick={() => gameStore.removeToast(toast.id)}
							type="button"
							className="ml-3 text-on-surface-variant hover:text-white transition-colors"
						>
							<span className="material-symbols-outlined text-base select-none">
								close
							</span>
						</button>
					</div>
				))}
			</div>

			<TanStackDevtools
				config={{ position: "bottom-right" }}
				plugins={[
					{ name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> },
				]}
			/>
		</>
	);
}

function RootDocument() {
	const { queryClient } = Route.useRouteContext();

	return (
		<html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme init script needs inline execution */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased text-on-surface bg-surface-container-lowest min-h-screen pb-20 lg:pb-0">
				<QueryClientProvider client={queryClient}>
					<AppShell />
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	);
}
