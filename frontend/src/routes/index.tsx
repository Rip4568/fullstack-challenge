import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Lobby });

export function Lobby() {
	const popularGames = [
		{
			id: "sweet-craze",
			title: "SWEET CRAZE",
			provider: "PRAGMATIC PLAY",
			badge: "POPULAR",
			badgeColor: "bg-primary/20 text-primary border-primary/30",
			image:
				"https://lh3.googleusercontent.com/aida-public/AB6AXuDT1FvMhLpA-vQpS4hN9vNnC4tTz1vU7o7d1u7mC1n9v0rX1Z1g1l1z1b1f1g1h1i1j1k1l1m1n1o1p1q1r1s1t1u1v1w1x1y1z", // Fallback or standard mockup source
		},
		{
			id: "bloody-dawn",
			title: "BLOODY DAWN",
			provider: "HACKSAW",
			badge: "HOT",
			badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
			image:
				"https://lh3.googleusercontent.com/aida-public/AB6AXuC9XOTaIvpzdQUHtNo5Gzoh-T3guN--1mKyHouNZValU-88YLTeGlyFIWAqVZd3iOUnsMksh_hKaaZBaviQzHKWyKVjRm97swaP3wvDXQz2tUocAiJKGc3kADfb-yDI_C89DGMSpkwHevpX9yCtUbTcNpYycXFWC-6gftEHQsuF1nHYNUq8ntfHSRJA_dh6MHbudFWSXBPevUZeJkTrdviqg0BHk_cMD8EVGZqY7B7t7kV_ZBtLcImfwKolISrkbVjp1p3wkqCUVc5q",
		},
		{
			id: "zeus-typhon",
			title: "ZEUS VS TYPHON",
			provider: "PRAGMATIC PLAY",
			badge: "EPIC",
			badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
			image:
				"https://lh3.googleusercontent.com/aida-public/AB6AXuB3DAOJML1HNf8M35mI5dV9pt_QG0pO_3sZZWIgVnILHPyraMjY6WzJRSUhFEf5TNEYKn6vwq_o9TObWpLecMOwpWU7hIiC5hoihcH1W4FRTJ6GJQ9NvTeiZvXi-4pAzuVxuzSmDSJ23-Cl2EQ1JmU8mDTMU5oDrtfHoLETHtYmf40hXPhzDhFYuWjhzCBTnxA2WshqMrDHkP4nM2CQfNF87jpW3vxmGXOcSQUeoSzeZsQ57reiYibZGELIMa0BPJBOsBMsmJfl1I5R",
		},
		{
			id: "fortune-olympus",
			title: "FORTUNE OF OLYMPUS",
			provider: "SPRIBE",
			badge: "NEW",
			badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
			image:
				"https://lh3.googleusercontent.com/aida-public/AB6AXuCfS6AQpcgnNpgywlmHkE5yiZXTm7Tq4PamyM_ohkOjf3VGo7xYRmQliWkxPOst11cx0Mupvn41tczleetncdD4sCUJliYRsc4C2sK8eEMlhJxlE_BeUWKHeTZKU60kxMiSmscyRMG5hfLxJ32XxsBYagcBGts07kZzPO39qQUwAREqr94xUDyjOPyks5tZNYSOw4gSbOzaOwX6brvXtsAob2pvnXkiNh_EvMyzIsEpjXLopGnY0F4g-lq11y2FVCDwIgKuJXXDoZm5",
		},
	];

	return (
		<main className="pt-8 pb-20 px-6 max-w-[1400px] mx-auto min-h-screen bg-jungle-glow">
			{/* Hero Section Banner */}
			<section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
				<div className="relative rounded-2xl overflow-hidden h-64 group border border-outline-variant bg-surface-container">
					<img
						className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
						alt="VIP transfers live banner"
						src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-d8L37lOBRcTKm-S_gh0e24q9QFpT5ujiliCnFUqXk5DJzBO0OS_pp2X9FGh8ARAiHJEqotmy-my01h_oLz6HNCl0oVkFUl5epgMCgM3sI1V1cbxrH4rtoTfOOUX76n8M7JV9YGgxlmXOtOye7RCRsIS3sWMlq7Yf8qOfnfgfTeWb0pgwK5rq3UmNYWMHHXgw9CXkKB0x07DK0Awxq1d3L7cNc5dvY1XImf0WN7CspSRqKXrvlbVfd-sSwhom0-tUiB_6dmX3xaQR"
					/>
					<div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/40 to-transparent flex flex-col justify-center p-8 z-10">
						<h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-2 leading-tight">
							VIP STATUS TRANSFER
							<br />
							NOW OPERATIONAL
						</h2>
						<p className="text-on-surface-variant text-sm mb-6 max-w-xs">
							Transfer your rank from other casinos and instantly unlock premium
							perks!
						</p>
						<Link
							to="/profile"
							className="bg-primary text-on-primary text-xs w-fit px-6 py-3 rounded-lg font-bold neon-btn-glow active:scale-95 transition-all text-center"
						>
							Transfer Status
						</Link>
					</div>
				</div>

				<div className="relative rounded-2xl overflow-hidden h-64 group border border-outline-variant bg-surface-container">
					<img
						className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
						alt="Lifetime commission referrals"
						src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj2hN5bfE-Qh7EZtfhiUDIKOwtYgW85eNb6wCbEx0ej6kEgo2VzHLJSfpSEx1PWt6dO3E5p-qU0KiJDc_2s7Iq6DmEODGfOi4X6ZmYZzGdIg3ON7jO5KwZ_Dna12miksU9bY2-3jkgM1wtOy6z6BO_m4ez0xnOjcEXq4LwP3ehD6AUUx262fv2jMX3uVicvGIsrq5Ik-NkSkYizocvGJESP0EdxMyzgfZpGtLHYvERduWa6ynjkGPd-E7yyICjEjSrUHrOMh5oxjJP"
					/>
					<div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/40 to-transparent flex flex-col justify-center p-8 z-10">
						<h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-2 leading-tight">
							LIFETIME REVENUE
							<br />+ EXCLUSIVE REWARDS
						</h2>
						<p className="text-on-surface-variant text-sm mb-6 max-w-xs">
							Earn ongoing cash commissions by inviting friends to join the
							jungle!
						</p>
						<button
							onClick={() => {}}
							type="button"
							className="bg-primary text-on-primary text-xs w-fit px-6 py-3 rounded-lg font-bold neon-btn-glow active:scale-95 transition-all text-center cursor-pointer"
						>
							Invite Friends
						</button>
					</div>
				</div>
			</section>

			{/* Category Grid Section */}
			<section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
				<Link
					to="/play/crash"
					className="bg-surface-container rounded-2xl p-6 border border-outline-variant hover:border-primary/50 cursor-pointer transition-all flex flex-col gap-4 relative overflow-hidden group"
				>
					<div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
						<span className="material-symbols-outlined text-3xl">casino</span>
					</div>
					<h3 className="text-lg font-bold text-white">Crash Game</h3>
					<span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-primary/5 group-hover:scale-110 transition-transform">
						rocket_launch
					</span>
				</Link>

				<div className="bg-surface-container rounded-2xl p-6 border border-outline-variant hover:border-primary/50 cursor-pointer transition-all flex flex-col gap-4 relative overflow-hidden group">
					<div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
						<span className="material-symbols-outlined text-3xl">
							sports_soccer
						</span>
					</div>
					<h3 className="text-lg font-bold text-white">Sportsbook</h3>
					<span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-primary/5 group-hover:scale-110 transition-transform">
						sports_soccer
					</span>
				</div>

				<div className="bg-surface-container rounded-2xl p-6 border border-outline-variant hover:border-primary/50 cursor-pointer transition-all flex flex-col gap-4 relative overflow-hidden group">
					<div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
						<span className="material-symbols-outlined text-3xl">
							confirmation_number
						</span>
					</div>
					<h3 className="text-lg font-bold text-white">Lotteries</h3>
					<span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-primary/5 group-hover:scale-110 transition-transform">
						local_activity
					</span>
				</div>

				<Link
					to="/profile"
					className="bg-surface-container rounded-2xl p-6 border border-outline-variant hover:border-primary/50 cursor-pointer transition-all flex flex-col gap-4 relative overflow-hidden group"
				>
					<div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
						<span className="material-symbols-outlined text-3xl">campaign</span>
					</div>
					<h3 className="text-lg font-bold text-white">VIP Club</h3>
					<span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-primary/5 group-hover:scale-110 transition-transform">
						military_tech
					</span>
				</Link>
			</section>

			{/* Flagship Originals (Crash Showcase) */}
			<section className="mb-12">
				<div className="flex items-center gap-3 mb-6">
					<span className="material-symbols-outlined text-primary">
						emoji_events
					</span>
					<h2 className="text-xl font-bold text-white">Jungle Originals</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Main Original: Jungle Crash */}
					<Link
						to="/play/crash"
						className="md:col-span-2 relative rounded-2xl border border-outline-variant bg-surface-container overflow-hidden h-72 flex group cursor-pointer hover:border-primary/50 transition-all"
					>
						{/* Background design */}
						<div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/70 to-transparent z-10" />
						<img
							className="absolute right-0 top-0 h-full w-[60%] object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
							alt="Jungle Crash main mockup"
							src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwCuifWLYV146aT4TD5saPanUgbxZOhsgAkVHPfcvA4wzPK6_SQV4x5S-Sfy5FN9OAukUSgVwbfsExE4bd2AUASgRWmPOk1UTrFzfu-VHjgNs4ooUj-knJS3N0320M0cjGx3V7P3bgMJ6B1ij42DtPs4j4nLAtwu4fVOG6cs9Av4PJRF4rvJUkW7WtKporDErhWbZTJKKO7rBugUjRsYFN7KSzNepvJENcyY10znFCTPgX17BQqFdThXYlWcHPeAQWGDQXzeHL0VVT"
						/>
						<div className="relative p-8 flex flex-col justify-center h-full z-20 max-w-sm">
							<span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded w-fit mb-3">
								100% PROVABLY FAIR
							</span>
							<h3 className="text-2xl font-black text-white mb-2 tracking-tight">
								JUNGLE CRASH
							</h3>
							<p className="text-on-surface-variant text-xs mb-6">
								Watch the rocket climb and cash out before it crashes! Win up to
								10,000x your wager.
							</p>
							<span className="bg-primary text-on-primary text-xs font-bold py-3 px-6 rounded-lg w-fit group-hover:bg-primary-container transition-all flex items-center gap-2">
								Play Now{" "}
								<span className="material-symbols-outlined text-sm">
									play_arrow
								</span>
							</span>
						</div>
					</Link>

					{/* Simple Secondary Original: Mines */}
					<div className="relative rounded-2xl border border-outline-variant bg-surface-container overflow-hidden h-72 flex flex-col group justify-between p-6 hover:border-primary/50 transition-all">
						<span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded w-fit">
							MULTIPLIER GAME
						</span>
						<div className="mt-4">
							<h3 className="text-xl font-bold text-white mb-1">Mines</h3>
							<p className="text-on-surface-variant text-xs">
								Avoid the hidden explosives in the jungle grid to lock in your
								payout multiplier.
							</p>
						</div>
						<Link
							to="/play/crash"
							className="mt-6 border border-outline-variant text-on-surface text-xs font-bold py-2.5 px-4 rounded-lg w-full text-center hover:bg-surface-container-high transition-colors"
						>
							Configure Mines
						</Link>
					</div>
				</div>
			</section>

			{/* Popular Slots Section */}
			<section className="mb-12">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<span className="material-symbols-outlined text-primary">
							trending_up
						</span>
						<h2 className="text-xl font-bold text-white">Popular Slots</h2>
					</div>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
					{popularGames.map((game) => (
						<div
							key={game.id}
							className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant group hover:border-primary/30 transition-all flex flex-col"
						>
							<div className="aspect-[3/4] overflow-hidden relative bg-surface-container-lowest">
								{game.image ? (
									<img
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										alt={game.title}
										src={game.image}
									/>
								) : (
									<div className="w-full h-full bg-gradient-to-br from-surface-container-low to-surface-container-high flex items-center justify-center">
										<span className="material-symbols-outlined text-4xl text-on-surface-variant/20">
											image
										</span>
									</div>
								)}
								{/* Play Button Overlay */}
								<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
									<Link
										to="/play/crash"
										className="material-symbols-outlined text-primary text-5xl cursor-pointer hover:scale-105 transition-transform"
									>
										play_circle
									</Link>
								</div>
								{/* Badge */}
								<span
									className={`absolute top-2 left-2 text-[8px] font-bold px-2 py-0.5 rounded border ${game.badgeColor}`}
								>
									{game.badge}
								</span>
							</div>
							<div className="p-3 text-center">
								<p className="font-bold text-xs text-on-surface tracking-tight truncate">
									{game.title}
								</p>
								<p className="text-[9px] text-on-surface-variant tracking-wider font-semibold truncate mt-0.5">
									{game.provider}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
