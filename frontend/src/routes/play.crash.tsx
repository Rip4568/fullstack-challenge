import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { mockEngine } from "../core/mock-engine";
import { socketService } from "../core/socket.service";
import { useGameState } from "../core/store";
import BetPanel from "../features/crash/BetPanel";
import CrashGraph from "../features/crash/CrashGraph";
import PlayersList from "../features/crash/PlayersList";
import ProvablyFairAuditor from "../features/crash/ProvablyFairAuditor";
import RecentMultipliers from "../features/crash/RecentMultipliers";

export const Route = createFileRoute("/play/crash")({
	component: CrashGamePage,
});

export function CrashGamePage() {
	const state = useGameState();
	const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

	// Sync mode (Mock vs Real) mounting
	useEffect(() => {
		if (state.mode === "mock") {
			socketService.disconnect();
			mockEngine.start();
		} else {
			mockEngine.stop();
			socketService.connect();
		}

		return () => {
			mockEngine.stop();
			socketService.disconnect();
		};
	}, [state.mode]);

	return (
		<main className="min-h-screen pt-4 pb-20 px-6 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-jungle-glow">
			{/* LEFT SECTION (8 Columns): Graph and History */}
			<section className="lg:col-span-8 flex flex-col gap-6">
				{/* Rounds History Multiplier Badges */}
				<RecentMultipliers />

				{/* Graphical Canvas Area */}
				<CrashGraph />

				{/* Cryptographic verification panel */}
				<div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<span className="material-symbols-outlined text-primary text-3xl">
							verified_user
						</span>
						<div>
							<h4 className="text-sm font-bold text-white">
								Provably Fair System
							</h4>
							<p className="text-on-surface-variant text-xs mt-0.5">
								Verifique a integridade matemática da rodada usando as sementes
								fornecidas.
							</p>
						</div>
					</div>
					<button
						onClick={() => setIsVerifyModalOpen(true)}
						type="button"
						className="w-full md:w-auto bg-primary/10 border border-primary/30 text-primary font-bold py-2.5 px-6 rounded-xl hover:bg-primary hover:text-on-primary transition-all text-xs cursor-pointer shadow-[0_0_10px_rgba(125,255,103,0.05)]"
					>
						Verify Round
					</button>
				</div>
			</section>

			{/* RIGHT SECTION (4 Columns): Betting panel & Players list */}
			<section className="lg:col-span-4 flex flex-col gap-6">
				{/* Bet Panel Container */}
				<BetPanel />

				{/* Current Bets Room List */}
				<PlayersList />
			</section>

			{/* PROVABLY FAIR AUDITOR MODAL */}
			<ProvablyFairAuditor
				isOpen={isVerifyModalOpen}
				onClose={() => setIsVerifyModalOpen(false)}
			/>
		</main>
	);
}
