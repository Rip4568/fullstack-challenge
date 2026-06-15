import type { HTMLAttributes } from "react";

const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
	return (
		<div
			className={`animate-pulse rounded bg-on-surface-variant/10 ${className}`}
			{...props}
		/>
	);
};

export default Skeleton;
