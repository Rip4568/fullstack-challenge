import { Coins, Wallet } from "lucide-react";
import type { Balance } from "../../core/store";

interface CurrencySelectorProps {
	balances: Balance[];
	selectedAsset: string;
	onSelectAsset: (asset: string) => void;
	onSelectNetwork: (network: string) => void;
}

const CurrencySelector = ({
	balances,
	selectedAsset,
	onSelectAsset,
	onSelectNetwork,
}: CurrencySelectorProps) => {
	const fiatBalances = balances.filter((b) => b.currency === "BRL");
	const cryptoBalances = balances.filter((b) => b.currency !== "BRL");

	const handleFiatSelect = (currency: string) => {
		onSelectAsset(currency);
		onSelectNetwork("PIX");
	};

	const handleCryptoSelect = (currency: string) => {
		onSelectAsset(currency);
		if (currency === "USD") {
			onSelectNetwork("ERC20");
		} else if (currency === "BTC") {
			onSelectNetwork("Bitcoin");
		} else if (currency === "ETH") {
			onSelectNetwork("Ethereum");
		}
	};

	return (
		<div className="bg-surface-container rounded-[2px] border-2 border-outline-variant p-6 flex flex-col gap-8 shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
			{/* Fiat Category */}
			<div>
				<div className="flex items-center gap-2 mb-4">
					<Wallet className="w-4 h-4 text-primary" />
					<h3 className="text-[11px] font-bold font-mono text-primary uppercase tracking-widest">
						Fiat Currency (Brazil Pix)
					</h3>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
					{fiatBalances.map((b) => {
						const isSelected = selectedAsset === b.currency;
						return (
							<button
								key={b.currency}
								onClick={() => handleFiatSelect(b.currency)}
								type="button"
								className={`p-4 rounded-[2px] flex flex-col items-start gap-1.5 relative transition-all duration-150 cursor-pointer border-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container active:scale-[0.98] ${
									isSelected
										? "border-primary bg-primary/5 shadow-[2px_2px_0px_0px_rgba(125,255,103,0.3)]"
										: "border-outline-variant bg-surface-container-lowest hover:border-on-surface-variant/40 hover:bg-surface-container-lowest/80"
								}`}
								aria-selected={isSelected}
								role="tab"
							>
								<span className="font-mono text-sm font-black text-white">
									{b.currency}
								</span>
								<span className="text-[9px] font-mono text-on-surface-variant/60 font-semibold">
									Pix Instant Transfer
								</span>
								{isSelected && (
									<div className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary shadow-[0_0_8px_#7dff67]" />
								)}
							</button>
						);
					})}
				</div>
			</div>

			{/* Crypto Category */}
			<div>
				<div className="flex items-center gap-2 mb-4">
					<Coins className="w-4 h-4 text-primary" />
					<h3 className="text-[11px] font-bold font-mono text-primary uppercase tracking-widest">
						Cryptocurrencies
					</h3>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					{cryptoBalances.map((b) => {
						const isSelected = selectedAsset === b.currency;
						return (
							<button
								key={b.currency}
								onClick={() => handleCryptoSelect(b.currency)}
								type="button"
								className={`p-4 rounded-[2px] flex flex-col items-start gap-1.5 relative transition-all duration-150 cursor-pointer border-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container active:scale-[0.98] ${
									isSelected
										? "border-primary bg-primary/5 shadow-[2px_2px_0px_0px_rgba(125,255,103,0.3)]"
										: "border-outline-variant bg-surface-container-lowest hover:border-on-surface-variant/40 hover:bg-surface-container-lowest/80"
								}`}
								aria-selected={isSelected}
								role="tab"
							>
								<span className="font-mono text-sm font-black text-white">
									{b.currency}
								</span>
								<span className="text-[9px] font-mono text-on-surface-variant/60 font-semibold">
									{b.currency === "USD"
										? "USD Coin"
										: b.currency === "BTC"
											? "Bitcoin Network"
											: "Ethereum Wallet"}
								</span>
								{isSelected && (
									<div className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary shadow-[0_0_8px_#7dff67]" />
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default CurrencySelector;
