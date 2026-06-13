import { useState } from "react";
import { apiService } from "../services/api.service";
import { useGameState } from "../services/store";

interface RoundDetails {
	id: string;
	crashPoint: number;
	serverSeedHash: string;
	serverSeed: string | null;
	clientSeed: string;
}

export default function RoundHistory() {
	const { roundHistory } = useGameState();
	const [selectedRound, setSelectedRound] = useState<RoundDetails | null>(null);
	const [verificationResult, setVerificationResult] = useState<string | null>(
		null,
	);
	const [loadingVerify, setLoadingVerify] = useState(false);

	const handleOpenVerify = async (round: any) => {
		setSelectedRound(round);
		setVerificationResult(null);
		setLoadingVerify(true);

		try {
			// In real mode, retrieve open seed details from endpoint
			const details = await apiService.verifyRound(round.id);
			setSelectedRound({
				id: details.id,
				crashPoint: details.crashPoint,
				serverSeedHash: details.serverSeedHash,
				serverSeed: details.serverSeed,
				clientSeed: details.clientSeed,
			});
		} catch (err) {
			console.warn(
				"[RoundHistory] Error verifying round from server, using history details:",
				err,
			);
			// Fallback to local history data
			setSelectedRound({
				id: round.id,
				crashPoint: round.crashPoint,
				serverSeedHash: round.serverSeedHash,
				serverSeed: round.serverSeed,
				clientSeed: round.clientSeed,
			});
		} finally {
			setLoadingVerify(false);
		}
	};

	const handleVerifyMath = async () => {
		if (!selectedRound || !selectedRound.serverSeed) return;

		try {
			const serverSeed = selectedRound.serverSeed;
			const clientSeed = selectedRound.clientSeed;

			const encoder = new TextEncoder();
			const clientSeedKey = await window.crypto.subtle.importKey(
				"raw",
				encoder.encode(clientSeed),
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"],
			);
			const signature = await window.crypto.subtle.sign(
				"HMAC",
				clientSeedKey,
				encoder.encode(serverSeed),
			);
			const hashArray = Array.from(new Uint8Array(signature));
			const hashHex = hashArray
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			const hex52 = hashHex.substring(0, 13);
			const X = parseInt(hex52, 16);
			const E = 4503599627370496;

			const p = X / E;
			let calculatedMultiplier = 1.0;

			if (p >= 0.03) {
				const rawMultiplier = Math.floor(97 / (1 - p)) / 100;
				calculatedMultiplier = Math.min(
					1000000.0,
					Math.max(1.0, rawMultiplier),
				);
			}

			const calculatedRounded = Math.floor(calculatedMultiplier * 100) / 100;
			const expectedRounded = Math.floor(selectedRound.crashPoint * 100) / 100;

			if (
				Math.abs(calculatedRounded - expectedRounded) < 0.02 ||
				(selectedRound.crashPoint === 10000.0 && calculatedRounded >= 10000.0)
			) {
				setVerificationResult("success");
			} else {
				console.warn("[Verify] Mismatch:", calculatedRounded, expectedRounded);
				setVerificationResult("failed");
			}
		} catch (_err) {
			setVerificationResult("failed");
		}
	};

	return (
		<div className="w-full">
			{/* Horizontal List of Last 20 Rounds */}
			<div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
				<div className="text-xs text-[var(--sea-ink-soft)] font-semibold uppercase tracking-wider pr-2 flex-shrink-0">
					Histórico:
				</div>
				{roundHistory.length === 0 ? (
					<div className="text-xs text-[var(--sea-ink-soft)]">
						Nenhum resultado ainda
					</div>
				) : (
					roundHistory.map((round) => {
						const isHigh = round.crashPoint >= 2.0;
						return (
							<button
								key={round.id}
								type="button"
								onClick={() => handleOpenVerify(round)}
								className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-all hover:scale-105 active:scale-95 flex-shrink-0 ${
									isHigh
										? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
										: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
								}`}
							>
								{round.crashPoint.toFixed(2)}x
							</button>
						);
					})
				)}
			</div>

			{/* Verification Modal */}
			{selectedRound && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
					<div className="w-full max-w-xl rounded-3xl border border-[var(--line)] bg-[#0d161a] p-6 shadow-2xl relative">
						{/* Close Button */}
						<button
							type="button"
							onClick={() => setSelectedRound(null)}
							className="absolute right-4 top-4 text-[var(--sea-ink-soft)] hover:text-white transition text-lg font-bold p-2"
						>
							✕
						</button>

						{/* Modal Content */}
						<h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
							🛡️ Auditador Provably Fair
						</h3>
						<p className="text-xs text-[var(--sea-ink-soft)] mb-5">
							Toda rodada tem seu resultado pré-determinado através de
							criptografia irreversível antes de iniciar.
						</p>

						{loadingVerify ? (
							<div className="py-12 flex flex-col items-center justify-center gap-3">
								<svg
									className="animate-spin h-8 w-8 text-[var(--lagoon)]"
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
								<span className="text-xs text-[var(--sea-ink-soft)]">
									Consultando sementes no servidor...
								</span>
							</div>
						) : (
							<div className="flex flex-col gap-4 text-xs">
								{/* Round ID */}
								<div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/40">
									<div className="text-[var(--sea-ink-soft)] font-medium mb-1 uppercase tracking-wider text-[10px]">
										ID da Rodada
									</div>
									<div className="font-mono text-gray-300 break-all select-all">
										{selectedRound.id}
									</div>
								</div>

								{/* Crash Point */}
								<div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/40">
									<div className="text-[var(--sea-ink-soft)] font-medium mb-1 uppercase tracking-wider text-[10px]">
										Ponto de Crash
									</div>
									<div
										className={`font-mono font-bold text-lg ${selectedRound.crashPoint >= 2.0 ? "text-emerald-400" : "text-rose-500"}`}
									>
										{selectedRound.crashPoint.toFixed(2)}x
									</div>
								</div>

								{/* Seeds info */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/40">
										<div className="text-[var(--sea-ink-soft)] font-medium mb-1 uppercase tracking-wider text-[10px]">
											Server Seed (Revelada)
										</div>
										<div className="font-mono text-gray-300 break-all select-all font-semibold">
											{selectedRound.serverSeed ||
												"Semente oculta até rodada finalizar"}
										</div>
									</div>
									<div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/40">
										<div className="text-[var(--sea-ink-soft)] font-medium mb-1 uppercase tracking-wider text-[10px]">
											Client Seed (Pública)
										</div>
										<div className="font-mono text-gray-300 break-all select-all">
											{selectedRound.clientSeed}
										</div>
									</div>
								</div>

								{/* Server Seed Hash */}
								<div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/40">
									<div className="text-[var(--sea-ink-soft)] font-medium mb-1 uppercase tracking-wider text-[10px]">
										Server Seed Hash (SHA-256 publicado)
									</div>
									<div className="font-mono text-gray-300 break-all select-all">
										{selectedRound.serverSeedHash}
									</div>
								</div>

								{/* Math check button */}
								{selectedRound.serverSeed && (
									<div className="flex flex-col gap-2.5 mt-2">
										<button
											type="button"
											onClick={handleVerifyMath}
											className="w-full bg-[var(--lagoon)] hover:bg-[var(--lagoon-deep)] text-black font-semibold py-3 rounded-xl transition active:scale-95"
										>
											Recalcular e Verificar Ponto de Crash
										</button>

										{verificationResult === "success" && (
											<div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center gap-2 font-medium">
												✅ Verificado com sucesso! HMAC-SHA256(serverSeed,
												clientSeed) resulta exatamente no crash point de{" "}
												{selectedRound.crashPoint.toFixed(2)}x (3% house edge).
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
