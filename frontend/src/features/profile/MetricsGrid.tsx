import { ArrowUp, TrendingUp, Trophy, Wallet } from "lucide-react";

interface MetricsGridProps {
	activeBalanceAmount: number;
	activeCurrency: string;
	estimatedUsdValue: number;
	totalWageredAmount?: number;
	totalWageredCurrency?: string;
	wagerVolumeGrowth?: string;
	accumulatedProfitsAmount?: number;
	highestMultiplier?: string;
}

const MetricsGrid = ({
	activeBalanceAmount,
	activeCurrency,
	estimatedUsdValue,
	totalWageredAmount = 148.52,
	totalWageredCurrency = "ETH",
	wagerVolumeGrowth = "+12.4%",
	accumulatedProfitsAmount = 42801.0,
	highestMultiplier = "420.00x",
}: MetricsGridProps) => {
	const formatBalance = () => {
		if (activeCurrency === "BRL") {
			return `R$ ${activeBalanceAmount.toFixed(2)}`;
		}
		if (activeCurrency === "USD") {
			return `$${activeBalanceAmount.toFixed(2)}`;
		}
		return `${activeBalanceAmount.toFixed(5)} ${activeCurrency}`;
	};

	return (
		<section className="grid grid-cols-1 md:grid-cols-5 gap-6">
			{/* Metric 1: Current balance progress (Asymmetric - spans 2 cols) */}
			<div className="md:col-span-2 bg-surface-container p-6 rounded-[2px] border-2 border-outline-variant hover:border-primary/40 transition-all flex flex-col justify-between group shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
				<div className="flex items-center justify-between mb-6">
					<span className="text-on-surface-variant/70 font-mono text-xs uppercase tracking-widest font-bold">
						Account Balance
					</span>
					<Wallet className="w-4.5 h-4.5 text-on-surface-variant group-hover:text-primary transition-colors" />
				</div>
				<div>
					<div className="font-mono text-2xl font-black text-white tracking-tight">
						{formatBalance()}
					</div>
					{/* Progress Indicator */}
					<div className="mt-5 h-2 bg-surface-container-lowest rounded-none overflow-hidden border border-outline-variant/30 relative">
						<div className="h-full bg-primary shadow-[0_0_8px_#7dff67] w-[75%]" />
					</div>
					<div className="flex justify-between items-center text-[9px] font-mono text-on-surface-variant/40 mt-2">
						<span>ESTIMATED VALUE: ${estimatedUsdValue.toFixed(2)} USD</span>
						<span className="text-primary font-bold">75% PROGRESS</span>
					</div>
				</div>
			</div>

			{/* Metric 2: Total wagered stats (Asymmetric - spans 1 col) */}
			<div className="md:col-span-1 bg-surface-container p-6 rounded-[2px] border-2 border-outline-variant hover:border-primary/40 transition-all flex flex-col justify-between group shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
				<div className="flex items-center justify-between mb-6">
					<span className="text-on-surface-variant/70 font-mono text-xs uppercase tracking-widest font-bold">
						Wager Volume
					</span>
					<TrendingUp className="w-4.5 h-4.5 text-on-surface-variant group-hover:text-primary transition-colors" />
				</div>
				<div>
					<div className="font-mono text-2xl font-black text-white tracking-tight">
						{totalWageredAmount}{" "}
						<span className="text-xs font-bold text-on-surface-variant ml-0.5">
							{totalWageredCurrency}
						</span>
					</div>
					<p className="text-[9px] text-primary font-mono font-bold mt-5 flex items-center gap-1.5 uppercase">
						<ArrowUp className="w-3.5 h-3.5 text-primary stroke-[3px]" />
						{wagerVolumeGrowth} vs last month
					</p>
				</div>
			</div>

			{/* Metric 3: Total wins stats (Asymmetric - spans 2 cols) */}
			<div className="md:col-span-2 bg-surface-container p-6 rounded-[2px] border-2 border-outline-variant hover:border-primary/40 transition-all flex flex-col justify-between group shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
				<div className="flex items-center justify-between mb-6">
					<span className="text-on-surface-variant/70 font-mono text-xs uppercase tracking-widest font-bold">
						Accumulated Profits
					</span>
					<Trophy className="w-4.5 h-4.5 text-on-surface-variant group-hover:text-primary transition-colors" />
				</div>
				<div>
					<div className="font-mono text-2xl font-black text-primary tracking-tight">
						$
						{accumulatedProfitsAmount.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						<span className="text-xs font-bold text-on-surface-variant ml-0.5">
							USD
						</span>
					</div>
					<p className="text-[10px] text-on-surface-variant/60 font-mono mt-5 uppercase tracking-wider">
						HIGHEST MULTIPLIER:{" "}
						<span className="text-primary font-bold">{highestMultiplier}</span>
					</p>
				</div>
			</div>
		</section>
	);
};

export default MetricsGrid;
