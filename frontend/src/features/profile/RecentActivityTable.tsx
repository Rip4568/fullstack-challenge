import { History, Rocket } from "lucide-react";

interface ActivityItem {
	id: string;
	game: string;
	time: string;
	wager: string;
	multi: string;
	profit: string;
	win: boolean;
}

interface RecentActivityTableProps {
	activityHistory: ActivityItem[];
}

const RecentActivityTable = ({ activityHistory }: RecentActivityTableProps) => {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-widest">
					<History className="w-4.5 h-4.5 text-primary" />
					Recent Activity
				</h3>
			</div>
			<div className="bg-surface-container rounded-[2px] border-2 border-outline-variant overflow-hidden shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
				<div className="overflow-x-auto custom-scrollbar">
					<table className="w-full text-left border-collapse">
						<thead className="bg-surface-container-high/40 border-b-2 border-outline-variant">
							<tr className="text-[10px] font-bold font-mono text-on-surface-variant/60 uppercase tracking-widest">
								<th className="px-6 py-4">Game</th>
								<th className="px-6 py-4">Wager</th>
								<th className="px-6 py-4">Multiplier</th>
								<th className="px-6 py-4 text-right pr-6">Profit / Loss</th>
							</tr>
						</thead>
						<tbody className="text-xs font-mono divide-y-2 divide-outline-variant/20">
							{activityHistory.map((bet) => (
								<tr
									key={bet.id}
									className="hover:bg-surface-container-high/20 transition-colors"
								>
									<td className="px-6 py-3.5 flex items-center gap-3">
										<div className="w-8 h-8 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[inset_0_0_4px_rgba(125,255,103,0.1)]">
											<Rocket className="w-4 h-4 text-primary" />
										</div>
										<div>
											<p className="font-bold text-white leading-none">
												{bet.game}
											</p>
											<p className="text-[9px] text-on-surface-variant/40 mt-1 font-semibold">
												{bet.time}
											</p>
										</div>
									</td>
									<td className="px-6 py-3.5 text-on-surface-variant font-bold">
										{bet.wager}
									</td>
									<td className="px-6 py-3.5">
										<span
											className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold border ${
												bet.win
													? "bg-primary/10 border-primary/20 text-primary"
													: "bg-surface-container-highest border-outline-variant text-on-surface-variant/60"
											}`}
										>
											{bet.multi}
										</span>
									</td>
									<td
										className={`px-6 py-3.5 text-right pr-6 font-bold ${
											bet.win ? "text-primary" : "text-red-400"
										}`}
									>
										{bet.profit}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default RecentActivityTable;
export type { ActivityItem };
