import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
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
import { apiService } from "../core/api.service";
import { authService } from "../core/auth.service";
import { useGameState } from "../core/store";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var resolved='dark';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1.0, viewport-fit=cover",
			},
			{ title: "Jungle Crash | High-Stakes Gaming" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

function RootDocument() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const state = useGameState();

	useEffect(() => {
		const handleAuth = async () => {
			const success = await authService.handleCallback();
			if (!success) {
				authService.checkLocalSession();
			}
		};
		handleAuth();
	}, []);

	useEffect(() => {
		if (state.mode === "real" && state.token) {
			apiService.getWallet().catch(console.error);
		}
	}, [state.mode, state.token]);

	return (
		<html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme init script needs inline execution */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased text-on-surface bg-surface-container-lowest min-h-screen pb-20 lg:pb-0">
				{/* Main Header */}
				<Header />

				<div className="flex w-full min-h-screen pt-20">
					{/* Sidebar for Desktop */}
					<Sidebar onDepositClick={() => {}} />

					{/* Main Content Pane */}
					<div className="flex-1 lg:pl-64 w-full min-w-0 min-h-[calc(100vh-5rem)]">
						<Outlet />
					</div>
				</div>

				{/* Bottom Navigation for Mobile */}
				<BottomNav
					onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
				/>

				{/* Mobile Menu Drawer Overlay */}
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
									<span className="material-symbols-outlined">
										rocket_launch
									</span>
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
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
