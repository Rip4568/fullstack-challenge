import { useGameState } from "../services/store";

export default function CurrentBetsList() {
	const { activeBets } = useGameState();

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return (
					<span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full font-medium">
						Pendente
					</span>
				);
			case "CONFIRMED":
				return (
					<span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-medium">
						No Jogo
					</span>
				);
			case "CASHOUT":
				return (
					<span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
						Sacou
					</span>
				);
			case "LOST":
				return (
					<span className="text-[10px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full font-medium">
						Perdeu
					</span>
				);
			default:
				return (
					<span className="text-[10px] text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full">
						{status}
					</span>
				);
		}
	};

	const formatAmount = (amount: number, currency: string) => {
		if (currency === "BRL") return `R$ ${(amount / 100).toFixed(2)}`;
		if (currency === "USD") return `$ ${(amount / 100).toFixed(2)}`;
		if (currency === "BTC") return `${amount.toLocaleString()} Sats`;
		if (currency === "ETH") return `${(amount / 1e9).toFixed(2)} Gwei`;
		return amount.toString();
	};

	const formatPayout = (payout: number | null, currency: string) => {
		if (!payout) return "-";
		return formatAmount(payout, currency);
	};

	return (
		<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-[inset_0_1px_0_var(--inset-glint)] backdrop-blur-md flex flex-col h-[340px] md:h-full min-h-[300px]">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-[var(--line)] pb-3.5 mb-3">
				<h3 className="text-sm font-semibold text-white tracking-wide uppercase">
					Apostas da Rodada
				</h3>
				<span className="text-xs text-[var(--sea-ink-soft)] font-mono font-medium">
					{activeBets.length}{" "}
					{activeBets.length === 1 ? "Jogador" : "Jogadores"}
				</span>
			</div>

			{/* Bets Table */}
			<div className="flex-1 overflow-y-auto pr-1">
				{activeBets.length === 0 ? (
					<div className="h-full flex flex-col items-center justify-center text-center text-xs text-[var(--sea-ink-soft)] gap-2 py-8">
						<span className="text-xl">💤</span>
						<span>Aguardando apostas para a rodada...</span>
					</div>
				) : (
					<table className="w-full text-left text-xs font-mono">
						<thead>
							<tr className="text-[var(--sea-ink-soft)] border-b border-gray-800/20 pb-2">
								<th className="pb-2 font-semibold">Jogador</th>
								<th className="pb-2 font-semibold">Aposta</th>
								<th className="pb-2 font-semibold text-center">Mult</th>
								<th className="pb-2 font-semibold text-right">Retorno</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-800/10">
							{activeBets.map((bet) => {
								const isWin = bet.status === "CASHOUT";
								const isLoss = bet.status === "LOST";

								return (
									<tr
										key={bet.id}
										className={`transition-colors ${
											isWin
												? "bg-emerald-500/5 text-emerald-400"
												: isLoss
													? "bg-rose-500/5 text-rose-500"
													: "text-gray-300"
										}`}
									>
										<td className="py-2.5 font-sans font-medium flex items-center gap-1.5 truncate max-w-[120px]">
											<span className="truncate">{bet.username}</span>
											{getStatusBadge(bet.status)}
										</td>
										<td className="py-2.5">
											{formatAmount(bet.amount, bet.currency)}
										</td>
										<td className="py-2.5 text-center font-bold">
											{bet.cashOutMultiplier
												? `${bet.cashOutMultiplier.toFixed(2)}x`
												: "-"}
										</td>
										<td className="py-2.5 text-right font-bold">
											{formatPayout(bet.payoutAmount, bet.currency)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
