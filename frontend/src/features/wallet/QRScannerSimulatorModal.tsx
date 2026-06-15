import { Camera, CheckCircle, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDeposit } from "../../mutations/wallet.mutations";

interface QRScannerSimulatorModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedAsset: string;
	address: string;
}

const QRScannerSimulatorModal = ({
	isOpen,
	onClose,
	selectedAsset,
	address,
}: QRScannerSimulatorModalProps) => {
	const [scanStep, setScanStep] = useState<
		"scanning" | "processing" | "success"
	>("scanning");
	const { mutate: deposit } = useDeposit();

	const closeButtonRef = useRef<HTMLButtonElement>(null);

	// Focus close button on mount for accessibility
	useEffect(() => {
		if (isOpen) {
			closeButtonRef.current?.focus();
		}
	}, [isOpen]);

	// Escape key listener for accessibility
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

	// Run scanner stages
	useEffect(() => {
		if (!isOpen) return;

		setScanStep("scanning");

		// Stage 2: Processing after 2s
		const pTimer = setTimeout(() => {
			setScanStep("processing");
		}, 2000);

		// Stage 3: Success after 3.8s
		const sTimer = setTimeout(() => {
			setScanStep("success");

			// Credit simulated funds
			let mockIncrement = 10000; // R$ 100.00 / $100.00
			if (selectedAsset === "BTC") {
				mockIncrement = 200000; // 0.002 BTC
			} else if (selectedAsset === "ETH") {
				mockIncrement = 50000000000000000; // 0.05 ETH
			}

			deposit({ currency: selectedAsset, amount: mockIncrement });
		}, 3800);

		// Auto close scanner after 5.5s
		const cTimer = setTimeout(() => {
			onClose();
		}, 5500);

		return () => {
			clearTimeout(pTimer);
			clearTimeout(sTimer);
			clearTimeout(cTimer);
		};
	}, [isOpen, selectedAsset, onClose]);

	if (!isOpen) return null;

	const getAmountText = () => {
		if (selectedAsset === "BTC") return "0.002 BTC";
		if (selectedAsset === "ETH") return "0.05 ETH";
		if (selectedAsset === "USD") return "$100.00";
		return "R$ 100,00";
	};

	return (
		<div
			className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="scanner-dialog-title"
		>
			<style>{`
				@keyframes scan-laser {
					0%, 100% { top: 0%; }
					50% { top: 100%; }
				}
				.laser-line {
					animation: scan-laser 2s infinite linear;
				}
			`}</style>

			{/* Phone Wrapper Container */}
			<div className="w-[320px] h-[540px] bg-neutral-950 border-[6px] border-neutral-800 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col p-4 z-50 ring-4 ring-primary/20">
				{/* Phone Notch */}
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-800 rounded-b-2xl z-30 flex justify-center items-center">
					<div className="w-12 h-1.5 bg-black rounded-full" />
				</div>

				{/* Close button inside simulator overlay */}
				<button
					ref={closeButtonRef}
					onClick={onClose}
					type="button"
					className="absolute top-8 right-6 text-on-surface-variant hover:text-white z-30 cursor-pointer p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 active:scale-95 transition-all"
					aria-label="Close Scanner Simulator"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Phone Screen Area */}
				<div className="flex-1 bg-black rounded-[30px] overflow-hidden flex flex-col p-4 pt-10 relative border border-neutral-900">
					{/* Scanning Visor */}
					{scanStep === "scanning" && (
						<div className="flex-grow flex flex-col items-center justify-center z-10">
							<h4
								id="scanner-dialog-title"
								className="text-[9px] font-mono text-primary font-bold tracking-widest mb-6 animate-pulse"
							>
								ALIGN WITH SYSTEM QR CODE
							</h4>
							<div className="w-40 h-40 border-2 border-primary/40 rounded-xl relative overflow-hidden flex items-center justify-center">
								{/* Finder corner markers */}
								<div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary" />
								<div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary" />
								<div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary" />
								<div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary" />

								{/* Oscillating laser line */}
								<div className="laser-line w-full h-[3px] bg-primary shadow-[0_0_8px_#7dff67] absolute" />

								{/* Inner target frame icon */}
								<Camera className="w-10 h-10 text-primary/30 animate-pulse" />
							</div>
							<p className="text-[10px] text-on-surface-variant/80 font-mono mt-8 text-center px-4 leading-relaxed">
								Targeting address:
								<span className="block text-primary text-[9px] mt-1 truncate max-w-[180px] mx-auto select-all">
									{address}
								</span>
							</p>
						</div>
					)}

					{/* Processing Stage */}
					{scanStep === "processing" && (
						<div className="flex-grow flex flex-col items-center justify-center z-10 text-center animate-pulse">
							<RefreshCw className="w-12 h-12 text-primary animate-spin mb-6" />
							<h4 className="text-white text-sm font-bold font-mono">
								Processing Deposit
							</h4>
							<p className="text-on-surface-variant text-[10px] font-mono mt-3 px-6 leading-relaxed">
								Decrypting signature & validating credentials...
							</p>
						</div>
					)}

					{/* Success Stage */}
					{scanStep === "success" && (
						<div className="flex-grow flex flex-col items-center justify-center z-10 text-center animate-in zoom-in-95 duration-200">
							<div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary shadow-[0_0_20px_rgba(125,255,103,0.3)] mb-6">
								<CheckCircle className="w-8 h-8" />
							</div>
							<h4 className="text-primary text-base font-black tracking-tight font-mono">
								DEPOSIT SUCCESSFUL
							</h4>
							<div className="text-white font-mono text-xs mt-3 bg-surface-container-high px-4 py-2 rounded border border-outline-variant/60 shadow-lg">
								+ {getAmountText()}
							</div>
							<p className="text-on-surface-variant text-[9px] font-mono mt-3">
								Balance updated instantly.
							</p>
						</div>
					)}

					{/* Simulated phone interface footer */}
					<div className="mt-auto pt-4 border-t border-outline-variant/10 text-center z-10">
						<span className="text-[8px] font-mono text-on-surface-variant/30 tracking-widest uppercase">
							JunglePay Secure Wallet
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default QRScannerSimulatorModal;
