import Skeleton from "../../components/ui/Skeleton";

const SKELETON_CARDS = ["card-1", "card-2", "card-3"];

const RecentDepositsSkeleton = () => {
	return (
		<>
			{SKELETON_CARDS.map((key) => (
				<div
					key={key}
					className="p-4 rounded-[2px] bg-surface-container-lowest border-2 border-outline-variant/60"
				>
					<div className="flex justify-between items-start mb-2">
						<div className="flex items-center gap-2">
							{/* Icon placeholder */}
							<Skeleton className="w-4 h-4 rounded-full" />
							{/* Amount placeholder */}
							<Skeleton className="h-3 w-16 rounded-[2px]" />
						</div>
						{/* Status badge placeholder */}
						<Skeleton className="h-4.5 w-14 rounded-[2px]" />
					</div>
					<div className="flex justify-between items-center">
						{/* TX hash placeholder */}
						<Skeleton className="h-2 w-28 rounded-[2px]" />
						{/* Time placeholder */}
						<Skeleton className="h-2 w-12 rounded-[2px]" />
					</div>
				</div>
			))}
		</>
	);
};

export default RecentDepositsSkeleton;
