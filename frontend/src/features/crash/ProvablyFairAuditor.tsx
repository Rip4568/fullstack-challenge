import { useState } from "react";
import { useGameState } from "../../core/store";

interface AuditorProps {
	isOpen: boolean;
	onClose: () => void;
}

const ProvablyFairAuditor = ({ isOpen, onClose }: AuditorProps) => {
	const state = useGameState();

	// Clipboard copy state tracking
	const [copiedField, setCopiedField] = useState<string | null>(null);

	if (!isOpen) return null;

	const handleCopy = async (field: string, text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => {
				setCopiedField(null);
			}, 1500);
		} catch (err) {
			console.error("Failed to copy text:", err);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-surface-container rounded-2xl border border-outline-variant max-w-md w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
				{/* Close Button */}
				<button
					onClick={onClose}
					type="button"
					className="absolute right-4 top-4 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
					aria-label="Close auditor"
				>
					<span className="material-symbols-outlined">close</span>
				</button>

				{/* Title Header */}
				<h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
					<span className="material-symbols-outlined text-primary">
						verified_user
					</span>
					Cryptographic Hash Audit
				</h3>
				<p className="text-on-surface-variant text-xs mb-6 leading-relaxed">
					Our games are mathematically fair. You can verify the crash point by
					feeding the server seed and client seed to the SHA-256 Pareto formula.
				</p>

				{/* Seeds Details */}
				<div className="space-y-4 font-mono text-xs">
					{/* Server Seed Hash */}
					<div className="space-y-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant relative group">
						<span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
							Server Seed SHA-256 Hash
						</span>
						<span className="text-white break-all pr-8 block">
							{state.serverSeedHash}
						</span>
						<button
							onClick={() => handleCopy("serverHash", state.serverSeedHash)}
							type="button"
							className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
							title="Copy to clipboard"
						>
							<span className="material-symbols-outlined text-sm">
								{copiedField === "serverHash" ? "check" : "content_copy"}
							</span>
						</button>
					</div>

					{/* Client Seed */}
					<div className="space-y-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant relative group">
						<span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
							Client Seed (Public)
						</span>
						<span className="text-white break-all pr-8 block">
							{state.clientSeed}
						</span>
						<button
							onClick={() => handleCopy("clientSeed", state.clientSeed)}
							type="button"
							className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
							title="Copy to clipboard"
						>
							<span className="material-symbols-outlined text-sm">
								{copiedField === "clientSeed" ? "check" : "content_copy"}
							</span>
						</button>
					</div>

					{/* Server Seed Revealed */}
					<div className="space-y-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant relative group">
						<span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
							Server Seed (Revealed)
						</span>
						<span className="text-white break-all pr-8 block">
							{state.serverSeed || "Revealed at the end of the round."}
						</span>
						{state.serverSeed && (
							<button
								onClick={() => handleCopy("serverSeed", state.serverSeed || "")}
								type="button"
								className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
								title="Copy to clipboard"
							>
								<span className="material-symbols-outlined text-sm">
									{copiedField === "serverSeed" ? "check" : "content_copy"}
								</span>
							</button>
						)}
					</div>

					{/* Audited Result */}
					{state.crashPoint !== null && state.serverSeed && (
						<div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex justify-between items-center shadow-[0_0_15px_rgba(125,255,103,0.1)]">
							<span className="text-primary font-bold">
								Audited Crash Point:
							</span>
							<span className="text-primary font-black text-sm">
								{state.crashPoint.toFixed(2)}x
							</span>
						</div>
					)}
				</div>

				{/* Close Action */}
				<button
					onClick={onClose}
					type="button"
					className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl mt-6 neon-btn-glow active:scale-95 transition-all cursor-pointer text-xs uppercase tracking-wider"
				>
					Close Auditor
				</button>
			</div>
		</div>
	);
};

export default ProvablyFairAuditor;
