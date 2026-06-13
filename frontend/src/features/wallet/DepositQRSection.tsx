import { Check, Copy, QrCode } from "lucide-react";
import { useState } from "react";

interface DepositQRSectionProps {
	selectedAsset: string;
	selectedNetwork: string;
	onSelectNetwork: (network: string) => void;
	address: string;
	onOpenSimulator: () => void;
}

const DepositQRSection = ({
	selectedAsset,
	selectedNetwork,
	onSelectNetwork,
	address,
	onOpenSimulator,
}: DepositQRSectionProps) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(address);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="bg-surface-container rounded-[2px] border-2 border-outline-variant p-6 flex flex-col md:flex-row gap-8 items-center md:items-stretch shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
			{/* Vector QR Code SVG */}
			{/* Vector QR Code SVG */}
			<button
				onClick={onOpenSimulator}
				type="button"
				className="w-44 h-44 bg-surface-container-lowest rounded-[2px] border-2 border-outline-variant p-4 flex flex-col items-center justify-center relative group overflow-hidden cursor-pointer active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
				aria-label="Scan deposit QR Code. Click to open simulator modal."
			>
				<svg
					viewBox="0 0 100 100"
					className="w-full h-full text-primary fill-current transition-transform duration-300 group-hover:scale-95"
				>
					<title>Deposit QR Code Pattern</title>
					{/* Finder pattern Top Left */}
					<rect x="0" y="0" width="22" height="22" />
					<rect x="3" y="3" width="16" height="16" fill="#0c0e10" />
					<rect x="6" y="6" width="10" height="10" />

					{/* Finder pattern Top Right */}
					<rect x="78" y="0" width="22" height="22" />
					<rect x="81" y="3" width="16" height="16" fill="#0c0e10" />
					<rect x="84" y="6" width="10" height="10" />

					{/* Finder pattern Bottom Left */}
					<rect x="0" y="78" width="22" height="22" />
					<rect x="3" y="81" width="16" height="16" fill="#0c0e10" />
					<rect x="6" y="84" width="10" height="10" />

					{/* Internal QR details */}
					<rect x="30" y="4" width="6" height="6" />
					<rect x="42" y="4" width="10" height="6" />
					<rect x="58" y="4" width="6" height="12" />

					<rect x="30" y="16" width="12" height="6" />
					<rect x="48" y="16" width="6" height="6" />
					<rect x="68" y="16" width="6" height="12" />

					<rect x="4" y="32" width="6" height="18" />
					<rect x="18" y="32" width="6" height="6" />
					<rect x="30" y="32" width="22" height="6" />
					<rect x="58" y="32" width="6" height="6" />
					<rect x="78" y="32" width="12" height="6" />

					<rect x="4" y="56" width="12" height="6" />
					<rect x="22" y="56" width="6" height="12" />
					<rect x="38" y="56" width="16" height="6" />
					<rect x="66" y="56" width="12" height="12" />

					<rect x="30" y="78" width="6" height="18" />
					<rect x="42" y="78" width="18" height="6" />
					<rect x="68" y="78" width="6" height="6" />

					<rect x="42" y="90" width="6" height="6" />
					<rect x="54" y="90" width="18" height="6" />
				</svg>
				<div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-center">
					<QrCode className="w-8 h-8 text-primary animate-pulse" />
					<span className="text-[9px] font-mono text-primary font-bold tracking-widest">
						SIMULATE SCAN
					</span>
				</div>
			</button>

			{/* Form details */}
			<div className="flex-1 w-full flex flex-col justify-between gap-6">
				{/* Network selector */}
				<div>
					<span className="block text-[10px] font-bold font-mono text-on-surface-variant/70 uppercase tracking-widest mb-2">
						Deposit Network
					</span>
					<div className="flex flex-wrap gap-2">
						{selectedAsset === "BRL" ? (
							<button
								type="button"
								className="bg-surface-container-highest border-2 border-primary text-primary text-xs font-mono font-bold py-2 px-4 rounded-[2px] cursor-default focus:outline-none"
							>
								PIX (Immediate)
							</button>
						) : selectedAsset === "BTC" ? (
							<>
								<button
									onClick={() => onSelectNetwork("Bitcoin")}
									type="button"
									className={`text-xs font-mono font-bold py-2 px-4 rounded-[2px] cursor-pointer transition-all border-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
										selectedNetwork === "Bitcoin"
											? "bg-surface-container-highest border-primary text-primary"
											: "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-on-surface-variant/40"
									}`}
								>
									BTC (Native)
								</button>
								<button
									onClick={() => onSelectNetwork("Lightning")}
									type="button"
									className={`text-xs font-mono font-bold py-2 px-4 rounded-[2px] cursor-pointer transition-all border-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
										selectedNetwork === "Lightning"
											? "bg-surface-container-highest border-primary text-primary"
											: "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-on-surface-variant/40"
									}`}
								>
									Lightning Network
								</button>
							</>
						) : (
							<>
								<button
									onClick={() =>
										onSelectNetwork(
											selectedAsset === "ETH" ? "Ethereum" : "ERC20",
										)
									}
									type="button"
									className={`text-xs font-mono font-bold py-2 px-4 rounded-[2px] cursor-pointer transition-all border-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
										selectedNetwork ===
										(selectedAsset === "ETH" ? "Ethereum" : "ERC20")
											? "bg-surface-container-highest border-primary text-primary"
											: "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-on-surface-variant/40"
									}`}
								>
									{selectedAsset === "ETH"
										? "Ethereum (Mainnet)"
										: "USDC (ERC20)"}
								</button>
								<button
									onClick={() => onSelectNetwork("BSC")}
									type="button"
									className={`text-xs font-mono font-bold py-2 px-4 rounded-[2px] cursor-pointer transition-all border-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
										selectedNetwork === "BSC"
											? "bg-surface-container-highest border-primary text-primary"
											: "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-on-surface-variant/40"
									}`}
								>
									BEP20 (BSC)
								</button>
							</>
						)}
					</div>
				</div>

				{/* Address field */}
				<div>
					<label
						htmlFor="wallet-address-input"
						className="block text-[10px] font-bold font-mono text-on-surface-variant/70 uppercase tracking-widest mb-2"
					>
						Your Wallet Address
					</label>
					<div className="relative">
						<input
							id="wallet-address-input"
							className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-[2px] p-4 pr-16 text-xs text-primary font-mono outline-none focus-visible:border-primary select-all"
							readOnly
							type="text"
							value={address}
						/>
						<button
							onClick={handleCopy}
							type="button"
							className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-[2px] text-on-surface-variant hover:text-primary transition-all cursor-pointer active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							aria-label="Copy address to clipboard"
						>
							{copied ? (
								<Check className="w-5 h-5 text-primary" />
							) : (
								<Copy className="w-5 h-5" />
							)}
						</button>
					</div>
					<p className="mt-2 text-[10px] text-on-surface-variant/40 font-mono italic">
						Send only {selectedAsset} using network {selectedNetwork} to this
						endpoint. Sending other assets will cause losses.
					</p>
				</div>

				{/* Simulator CTA Button */}
				<button
					onClick={onOpenSimulator}
					type="button"
					className="bg-primary text-on-primary font-mono font-bold py-3.5 px-6 rounded-[2px] text-center active:scale-[0.98] transition-all text-xs cursor-pointer neon-btn-glow flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container hover:bg-primary/95"
				>
					<QrCode className="w-4 h-4" />
					SIMULATE PHONE QR SCANNER (Pix/Crypto Deposit)
				</button>
			</div>
		</div>
	);
};

export default DepositQRSection;
