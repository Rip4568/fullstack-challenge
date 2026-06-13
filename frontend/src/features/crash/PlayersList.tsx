import { useGameState } from "../../core/store";

const PlayersList = () => {
	const state = useGameState();

	// Format player wager amount based on currency type
	const formatWager = (amount: number, currency: string) => {
		if (currency === "BRL") {
			return `R$ ${(amount / 100).toFixed(2)}`;
		}
		if (currency === "USD") {
			return `$${(amount / 100).toFixed(2)}`;
		}
		if (currency === "BTC") {
			return `${(amount / 100000000).toFixed(8)} BTC`;
		}
		if (currency === "ETH") {
			return `${(amount / 1000000000000000000).toFixed(8)} ETH`;
		}
		return `${amount} ${currency}`;
	};

	// Format payout return amount based on currency type
	const formatPayout = (amount: number, currency: string) => {
		if (currency === "BRL") {
			return `R$ ${(amount / 100).toFixed(2)}`;
		}
		if (currency === "USD") {
			return `$${(amount / 100).toFixed(2)}`;
		}
		if (currency === "BTC") {
			return `${(amount / 100000000).toFixed(8)} BTC`;
		}
		if (currency === "ETH") {
			return `${(amount / 1000000000000000000).toFixed(8)} ETH`;
		}
		return `${amount} ${currency}`;
	};

	// Sum total BRL wager of active room bets for the display header badge
	const totalWagersBrl = state.activeBets
		.reduce(
			(acc, curr) => acc + (curr.currency === "BRL" ? curr.amount / 100 : 0),
			0,
		)
		.toFixed(2);

	return (
		<div className="bg-surface-container rounded-2xl border border-outline-variant flex flex-col flex-grow min-h-[350px]">
			{/* Players count & total wagers header */}
			<div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-high/40 rounded-t-2xl">
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
					<span className="text-[10px] font-bold font-mono tracking-wider text-on-surface-variant">
						{state.activeBets.length} Players Online
					</span>
				</div>
				<span className="text-[10px] font-bold font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
					R$ {totalWagersBrl} Active
				</span>
			</div>

			{/* Wagers table list */}
			<div className="flex-grow overflow-y-auto custom-scrollbar px-2 py-3 max-h-[350px]">
				<table className="w-full text-left">
					<thead>
						<tr className="text-[9px] font-bold font-mono text-on-surface-variant/60 uppercase tracking-wider border-b border-outline-variant/30">
							<th className="pb-3 pl-3">User</th>
							<th className="pb-3">Wager</th>
							<th className="pb-3">Multiplier</th>
							<th className="pb-3 text-right pr-3">Return</th>
						</tr>
					</thead>
					<tbody className="text-xs font-mono divide-y divide-outline-variant/10">
						{state.activeBets.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="py-8 text-center text-on-surface-variant/40 text-[11px]"
								>
									No bets placed for this round.
								</td>
							</tr>
						) : (
							state.activeBets.map((bet) => (
								<tr
									key={bet.id}
									className={`transition-colors ${
										bet.playerId === state.playerId
											? "bg-primary/5 font-bold"
											: "hover:bg-surface-container-high/40"
									}`}
								>
									<td className="py-2.5 pl-3 flex items-center gap-2 text-on-surface">
										<div className="w-5 h-5 rounded-full bg-surface-container-highest text-[9px] flex items-center justify-center text-white font-bold">
											{bet.username.substring(0, 2).toUpperCase()}
										</div>
										<span className="truncate max-w-[90px]">
											{bet.username}
										</span>
									</td>
									<td className="py-2.5 text-on-surface-variant">
										{formatWager(bet.amount, bet.currency)}
									</td>
									<td className="py-2.5">
										{bet.status === "CASHOUT" ? (
											<span className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px]">
												{bet.cashOutMultiplier?.toFixed(2)}x
											</span>
										) : bet.status === "LOST" ? (
											<span className="text-red-400">Lost</span>
										) : (
											<span className="text-on-surface-variant/40">-</span>
										)}
									</td>
									<td
										className={`py-2.5 text-right pr-3 ${
											bet.status === "CASHOUT"
												? "text-primary font-bold"
												: "text-on-surface-variant/40"
										}`}
									>
										{bet.status === "CASHOUT" && bet.payoutAmount
											? formatPayout(bet.payoutAmount, bet.currency)
											: "-"}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default PlayersList;
