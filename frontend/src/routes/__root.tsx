import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import BottomNav from "../components/BottomNav";
import CommunityChat from "../components/CommunityChat";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

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
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
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

        {/* Collapsible Community Chat */}
        {isChatOpen ? (
          <CommunityChat onClose={() => setIsChatOpen(false)} />
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            type="button"
            className="fixed right-6 bottom-6 lg:bottom-6 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-on-primary shadow-[0_0_20px_rgba(125,255,103,0.5)] active:scale-95 transition-all cursor-pointer z-50"
          >
            <span className="material-symbols-outlined fill">chat</span>
          </button>
        )}

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
                <a
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-on-surface-variant py-2 border-b border-outline-variant/30 hover:text-primary"
                >
                  <span className="material-symbols-outlined">explore</span>
                  <span>Lobby</span>
                </a>
                <a
                  href="/play/crash"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-on-surface-variant py-2 border-b border-outline-variant/30 hover:text-primary"
                >
                  <span className="material-symbols-outlined">
                    rocket_launch
                  </span>
                  <span>Jungle Crash</span>
                </a>
                <a
                  href="/deposit"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-on-surface-variant py-2 border-b border-outline-variant/30 hover:text-primary"
                >
                  <span className="material-symbols-outlined">
                    account_balance_wallet
                  </span>
                  <span>Deposit</span>
                </a>
                <a
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-on-surface-variant py-2 border-b border-outline-variant/30 hover:text-primary"
                >
                  <span className="material-symbols-outlined">person</span>
                  <span>Profile</span>
                </a>
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
