import { Key, Laptop, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface SecurityPanelProps {
	tfaInitiallyEnabled?: boolean;
	onChangePassword?: () => void;
	onViewSessions?: () => void;
}

const SecurityPanel = ({
	tfaInitiallyEnabled = false,
	onChangePassword = () => {},
	onViewSessions = () => {},
}: SecurityPanelProps) => {
	const [tfaEnabled, setTfaEnabled] = useState(tfaInitiallyEnabled);

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-widest">
				<ShieldCheck className="w-4.5 h-4.5 text-primary" />
				Security & MFA
			</h3>
			<div className="bg-surface-container rounded-[2px] border-2 border-outline-variant p-6 flex flex-col gap-6 shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="text-xs font-bold text-white font-mono">
							2-Factor Authentication (2FA)
						</p>
						<p className="text-[10px] text-on-surface-variant/60 font-mono mt-1 leading-relaxed">
							Protect your withdrawals and account with Google Authenticator
							verification codes.
						</p>
					</div>

					{/* Accessible iOS switch toggle */}
					<button
						onClick={() => setTfaEnabled(!tfaEnabled)}
						type="button"
						role="switch"
						aria-checked={tfaEnabled}
						aria-label="Toggle 2-Factor Authentication"
						className={`relative w-12 h-6.5 rounded-full transition-colors cursor-pointer flex items-center px-1 border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container shrink-0 ${
							tfaEnabled
								? "bg-primary border-primary"
								: "bg-surface-container-lowest border-outline-variant"
						}`}
					>
						<div
							className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
								tfaEnabled ? "translate-x-5.5" : "translate-x-0"
							}`}
						/>
					</button>
				</div>

				<div className="h-px bg-outline-variant/30" />

				<div className="space-y-2">
					<button
						onClick={onChangePassword}
						type="button"
						className="w-full border-2 border-outline-variant hover:border-primary/50 text-white font-mono font-bold py-2.5 rounded-[2px] text-xs cursor-pointer active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:bg-surface-container-high"
					>
						<Key className="w-3.5 h-3.5" />
						Change Account Password
					</button>
					<button
						onClick={onViewSessions}
						type="button"
						className="w-full bg-surface-container-highest text-on-surface hover:bg-surface-container-high hover:text-white font-mono font-bold py-2.5 rounded-[2px] text-xs cursor-pointer active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
						<Laptop className="w-3.5 h-3.5" />
						View Active Sessions (2)
					</button>
				</div>
			</div>
		</div>
	);
};

export default SecurityPanel;
