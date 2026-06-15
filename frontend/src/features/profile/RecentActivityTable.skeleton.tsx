import Skeleton from "../../components/ui/Skeleton";

const SKELETON_ROWS = ["row-1", "row-2", "row-3", "row-4", "row-5"];

const RecentActivityTableSkeleton = () => {
	return (
		<>
			{SKELETON_ROWS.map((key) => (
				<tr
					key={key}
					className="hover:bg-surface-container-high/20 transition-colors"
				>
					<td className="px-6 py-3.5 flex items-center gap-3">
						<Skeleton className="w-8 h-8 rounded-[2px]" />
						<div className="space-y-1.5">
							<Skeleton className="h-3 w-24 rounded-[2px]" />
							<Skeleton className="h-2 w-12 rounded-[2px]" />
						</div>
					</td>
					<td className="px-6 py-3.5">
						<Skeleton className="h-3.5 w-16 rounded-[2px]" />
					</td>
					<td className="px-6 py-3.5">
						<Skeleton className="h-5 w-12 rounded-[2px]" />
					</td>
					<td className="px-6 py-3.5 text-right pr-6">
						<Skeleton className="h-3.5 w-20 rounded-[2px] ml-auto" />
					</td>
				</tr>
			))}
		</>
	);
};

export default RecentActivityTableSkeleton;
