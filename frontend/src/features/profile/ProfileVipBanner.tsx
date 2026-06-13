import { Link } from "@tanstack/react-router";
import { Sparkles, User } from "lucide-react";

interface ProfileVipBannerProps {
	username: string;
	onOpenSettings?: () => void;
}

const ProfileVipBanner = ({
	username,
	onOpenSettings,
}: ProfileVipBannerProps) => {
	return (
		<section className="bg-surface-container rounded-[2px] border-2 border-outline-variant p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
			<div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
				{/* Avatar Frame */}
				<div className="relative w-20 h-20 rounded-[2px] border-2 border-primary overflow-hidden bg-surface-container-low flex items-center justify-center shadow-[0_0_15px_rgba(125,255,103,0.15)]">
					<User className="w-10 h-10 text-primary" />
				</div>
				<div>
					<div className="flex flex-col sm:flex-row items-center gap-3">
						<h2 className="text-xl font-bold font-mono text-white tracking-tight">
							@{username}
						</h2>
						<span className="bg-primary/10 border-2 border-primary/30 text-primary text-[9px] font-bold font-mono px-2 py-0.5 rounded-[2px] shadow-sm flex items-center gap-1">
							<Sparkles className="w-2.5 h-2.5" />
							GOLD VIP LEVEL IV
						</span>
					</div>
					<p className="text-on-surface-variant/70 text-[10px] font-mono mt-1.5 uppercase tracking-wider">
						ACCOUNT STATUS: ACTIVE | REGISTERED: JUN 2026
					</p>
				</div>
			</div>

			<div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
				<Link
					to="/deposit"
					className="flex-grow sm:flex-grow-0 bg-primary text-on-primary font-mono font-bold py-2.5 px-6 rounded-[2px] text-center text-xs neon-btn-glow active:scale-[0.97] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container hover:bg-primary/95"
				>
					Instant Deposit
				</Link>
				<button
					onClick={onOpenSettings}
					type="button"
					className="flex-grow sm:flex-grow-0 border-2 border-outline-variant text-on-surface hover:bg-surface-container-high hover:border-on-surface-variant/40 font-mono font-bold py-2.5 px-6 rounded-[2px] text-xs active:scale-[0.97] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
				>
					Settings
				</button>
			</div>
		</section>
	);
};

export default ProfileVipBanner;
