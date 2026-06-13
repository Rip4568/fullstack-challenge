import { useGameState } from "../../core/store";

const RecentMultipliers = () => {
	const { roundHistory } = useGameState();

	return (
		<div className="flex items-center gap-2 overflow-x-auto py-2.5 px-3 bg-surface-container rounded-xl border border-outline-variant custom-scrollbar scrollbar-hide">
			<span className="text-[10px] font-bold font-mono text-on-surface-variant mr-2 tracking-wider">
				RECENT:
			</span>
			<div className="flex items-center gap-2">
				{roundHistory.map((item) => {
					const isHigh = item.crashPoint >= 2.0;
					return (
						<span
							key={item.id}
							title={`Round: ${item.id}\nSeed Hash: ${item.serverSeedHash}`}
							className={`px-3 py-1 rounded text-xs font-bold font-mono tracking-tighter transition-all duration-200 hover:scale-105 cursor-help ${
								isHigh
									? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_10px_rgba(125,255,103,0.15)] hover:shadow-[0_0_15px_rgba(125,255,103,0.3)]"
									: "bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/20"
							}`}
						>
							{item.crashPoint.toFixed(2)}x
						</span>
					);
				})}
			</div>
		</div>
	);
};

export default RecentMultipliers;
