import {
	AlertCircle,
	CheckCircle2,
	Clock,
	History,
	Shield,
} from "lucide-react";
import RecentDepositsSkeleton from "./RecentDeposits.skeleton";

interface DepositItem {
	id: string;
	amount: string;
	status: string;
	time: string;
	currency: string;
	hash: string;
}

interface RecentDepositsProps {
	deposits: DepositItem[];
	isLoading?: boolean;
}

const RecentDeposits = ({
	deposits,
	isLoading = false,
}: RecentDepositsProps) => {
	return (
		<div className="bg-surface-container rounded-[2px] border-2 border-outline-variant p-6 flex flex-col h-full shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
			<div className="pb-4 border-b border-outline-variant flex items-center gap-2">
				<History className="w-4 h-4 text-primary" />
				<h3 className="font-bold text-sm text-white font-mono tracking-tight">
					Recent Deposits
				</h3>
			</div>

			<div className="flex-1 overflow-y-auto pt-4 space-y-4 max-h-[500px] xl:max-h-none custom-scrollbar">
				{isLoading ? (
					<RecentDepositsSkeleton />
				) : (
					deposits.map((item) => {
						const isCompleted = item.status === "Completed";
						const isPending = item.status === "Pending";

						return (
							<div
								key={item.id}
								className="p-4 rounded-[2px] bg-surface-container-lowest border-2 border-outline-variant/60 group hover:border-primary/40 transition-colors"
							>
								<div className="flex justify-between items-start mb-2">
									<div className="flex items-center gap-2">
										{isCompleted ? (
											<CheckCircle2 className="w-4 h-4 text-primary" />
										) : isPending ? (
											<Clock className="w-4 h-4 text-on-surface-variant" />
										) : (
											<AlertCircle className="w-4 h-4 text-red-400" />
										)}
										<span className="font-mono text-xs font-bold text-white">
											{item.amount}
										</span>
									</div>
									<span
										className={`px-2 py-0.5 rounded-[2px] text-[8px] font-mono font-bold uppercase tracking-wider border ${
											isCompleted
												? "bg-primary/10 text-primary border-primary/20"
												: isPending
													? "bg-surface-container-highest text-on-surface-variant border-outline-variant"
													: "bg-red-500/10 text-red-400 border-red-500/20"
										}`}
									>
										{item.status}
									</span>
								</div>
								<div className="flex justify-between items-center text-[9px] font-mono text-on-surface-variant/40">
									<span>TX: {item.hash}</span>
									<span>{item.time}</span>
								</div>
							</div>
						);
					})
				)}
			</div>

			<div className="mt-6 pt-4 border-t border-outline-variant text-center">
				<span className="text-[10px] text-on-surface-variant/40 font-mono flex items-center justify-center gap-1.5">
					<Shield className="w-3.5 h-3.5 text-primary" />
					AES-256 Cold Storage Protocol
				</span>
			</div>
		</div>
	);
};

export default RecentDeposits;
export type { DepositItem };
