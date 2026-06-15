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
import Sidebar from "../components/layout/Sidebar";
import { authService } from "../core/auth.service";
import { gameStore, useGameState } from "../core/store";
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
