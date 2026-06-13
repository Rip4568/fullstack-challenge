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
			image: "/sweet_craze_cover.png",
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
							Earn ongoing commissions by inviting friends to join the Jungle!
						</p>
						<Link
							to="/profile"
							className="bg-primary text-on-primary text-xs w-fit px-6 py-3 rounded-lg font-bold neon-btn-glow active:scale-95 transition-all text-center"
						>
							Invite Friends
						</Link>
					</div>
				</div>
			</section>

			{/* Category Grid Section */}
			<section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
				<Link
					to="/play/crash"
					className="bg-gradient-to-br from-emerald-950/30 via-surface-container to-surface-container-lowest rounded-2xl p-6 border border-emerald-500/20 hover:border-primary/60 hover:shadow-[0_0_25px_rgba(125,255,103,0.25)] shadow-md cursor-pointer transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group"
				>
					<div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 z-10">
						<span className="material-symbols-outlined text-3xl">casino</span>
					</div>
					<h3 className="text-lg font-bold text-white z-10">Crash Game</h3>
					{/* Airplane background — rotated 45° climbing to top-right */}
					<svg
						viewBox="0 0 120 120"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="absolute -bottom-4 -right-4 w-36 h-36 text-primary/15 group-hover:text-primary/40 -rotate-[35deg] group-hover:scale-110 group-hover:-translate-y-3 group-hover:translate-x-1 transition-all duration-500 ease-out pointer-events-none"
					>
						<title>Crash Game Airplane</title>
						{/* Fuselage */}
						<ellipse cx="60" cy="60" rx="40" ry="10" fill="currentColor" />
						{/* Nose */}
						<path d="M100 60 Q115 60 108 54 L100 50Z" fill="currentColor" />
						{/* Main wings */}
						<path d="M65 60 L80 30 L90 35 L75 60Z" fill="currentColor" />
						<path d="M65 60 L80 90 L90 85 L75 60Z" fill="currentColor" />
						{/* Tail fin (vertical) */}
						<path d="M22 60 L15 40 L30 52Z" fill="currentColor" />
						{/* Tail wings (horizontal) */}
						<path d="M25 60 L18 45 L32 55Z" fill="currentColor" opacity="0.6" />
						<path d="M25 60 L18 75 L32 65Z" fill="currentColor" opacity="0.6" />
						{/* Engine trail dots */}
						<circle cx="14" cy="60" r="2.5" fill="currentColor" opacity="0.5" />
						<circle cx="6" cy="60" r="1.8" fill="currentColor" opacity="0.3" />
						<circle cx="0" cy="60" r="1" fill="currentColor" opacity="0.15" />
					</svg>
				</Link>

				<div className="bg-gradient-to-br from-cyan-950/30 via-surface-container to-surface-container-lowest rounded-2xl p-6 border border-cyan-500/20 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,243,255,0.25)] shadow-md cursor-pointer transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group">
					<div className="bg-cyan-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black transition-all duration-300 z-10">
						<span className="material-symbols-outlined text-3xl">
							sports_soccer
						</span>
					</div>
					<h3 className="text-lg font-bold text-white z-10">Sportsbook</h3>
					<svg
						viewBox="0 0 100 100"
						preserveAspectRatio="none"
						className="absolute inset-0 w-full h-full text-cyan-500/5 group-hover:text-cyan-500/15 group-hover:scale-105 transition-all duration-500 ease-out pointer-events-none"
					>
						<title>Sportsbook Reticular Grid</title>
						<defs>
							<pattern
								id="sports-grid"
								width="10"
								height="10"
								patternUnits="userSpaceOnUse"
							>
								<path
									d="M 10 0 L 0 0 0 10"
									fill="none"
									stroke="currentColor"
									strokeWidth="0.5"
								/>
							</pattern>
						</defs>
						<rect width="100" height="100" fill="url(#sports-grid)" />
						<path
							d="M -10,90 C 20,60 40,80 80,30 L 95,45"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							strokeDasharray="2,2"
							className="text-cyan-400/20 group-hover:text-cyan-400/40 transition-colors"
						/>
						<circle
							cx="80"
							cy="30"
							r="3"
							fill="currentColor"
							className="text-cyan-400/30 group-hover:text-cyan-400/60 transition-colors"
						/>
					</svg>
				</div>

				<div className="bg-gradient-to-br from-pink-950/30 via-surface-container to-surface-container-lowest rounded-2xl p-6 border border-pink-500/20 hover:border-pink-400/60 hover:shadow-[0_0_25px_rgba(255,0,127,0.25)] shadow-md cursor-pointer transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group">
					<div className="bg-pink-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-pink-400 group-hover:bg-pink-400 group-hover:text-black transition-all duration-300 z-10">
						<span className="material-symbols-outlined text-3xl">
							confirmation_number
						</span>
					</div>
					<h3 className="text-lg font-bold text-white z-10">Lotteries</h3>
					<svg
						viewBox="0 0 100 100"
						className="absolute -bottom-6 -right-6 w-36 h-36 text-pink-500/10 group-hover:text-pink-500/25 group-hover:rotate-45 group-hover:scale-110 transition-all duration-700 ease-out pointer-events-none"
					>
						<title>Lotteries Concentric Circles</title>
						<circle
							cx="50"
							cy="50"
							r="45"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							strokeDasharray="5,5"
						/>
						<circle
							cx="50"
							cy="50"
							r="35"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeDasharray="15,10"
						/>
						<circle
							cx="50"
							cy="50"
							r="25"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeDasharray="4,2"
						/>
						<circle
							cx="50"
							cy="50"
							r="15"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							strokeDasharray="40,5"
						/>
						<line
							x1="50"
							y1="2"
							x2="50"
							y2="8"
							stroke="currentColor"
							strokeWidth="1"
						/>
						<line
							x1="50"
							y1="92"
							x2="50"
							y2="98"
							stroke="currentColor"
							strokeWidth="1"
						/>
						<line
							x1="2"
							y1="50"
							x2="8"
							y2="50"
							stroke="currentColor"
							strokeWidth="1"
						/>
						<line
							x1="92"
							y1="50"
							x2="98"
							y2="50"
							stroke="currentColor"
							strokeWidth="1"
						/>
					</svg>
				</div>

				<Link
					to="/profile"
					className="bg-gradient-to-br from-amber-950/30 via-surface-container to-surface-container-lowest rounded-2xl p-6 border border-amber-500/20 hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(255,170,0,0.25)] shadow-md cursor-pointer transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group"
				>
					<div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-all duration-300 z-10">
						<span className="material-symbols-outlined text-3xl">campaign</span>
					</div>
					<h3 className="text-lg font-bold text-white z-10">VIP Club</h3>
					<svg
						viewBox="0 0 100 100"
						fill="none"
						stroke="currentColor"
						strokeWidth="1"
						className="absolute -bottom-4 -right-4 w-32 h-32 text-amber-500/10 group-hover:text-amber-500/25 group-hover:scale-115 group-hover:rotate-12 transition-all duration-500 ease-out pointer-events-none"
					>
						<title>VIP Club Diamond Pattern</title>
						<path d="M 50,10 L 90,40 L 50,90 L 10,40 Z" />
						<path d="M 50,10 L 50,90" />
						<path d="M 10,40 L 90,40" />
						<path d="M 50,10 L 30,40 L 50,90 L 70,40 Z" />
						<path d="M 30,40 L 50,40 M 70,40 L 50,40" />
						<circle cx="50" cy="10" r="2" fill="currentColor" />
						<circle cx="90" cy="40" r="2" fill="currentColor" />
						<circle cx="50" cy="90" r="2" fill="currentColor" />
						<circle cx="10" cy="40" r="2" fill="currentColor" />
					</svg>
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

					{/* Simple Secondary Original: Mines (SOON) */}
					<div className="relative rounded-2xl border border-outline-variant bg-surface-container overflow-hidden h-72 flex flex-col justify-between p-6 group">
						{/* Soon Lock Overlay */}
						<div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10">
							<span className="bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-xs font-black px-3 py-1 rounded shadow-[0_0_12px_rgba(245,158,11,0.25)]">
								SOON
							</span>
							<span className="text-[10px] font-sans font-bold text-on-surface-variant/70 tracking-wider uppercase">
								Under Development
							</span>
						</div>

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
						<button
							type="button"
							disabled
							className="mt-6 border border-outline-variant/30 text-on-surface-variant/40 text-xs font-bold py-2.5 px-4 rounded-lg w-full text-center"
						>
							Configure Mines
						</button>
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
							className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant group transition-all flex flex-col relative"
						>
							{/* Blocked Soon Overlay */}
							<div className="absolute inset-0 bg-black/75 backdrop-blur-[2.5px] rounded-2xl flex flex-col items-center justify-center gap-1.5 z-20">
								<span className="bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.2)]">
									SOON
								</span>
								<span className="text-[9px] font-sans font-bold text-on-surface-variant/60 tracking-widest uppercase">
									Coming Soon
								</span>
							</div>

							<div className="aspect-[3/4] overflow-hidden relative bg-surface-container-lowest">
								{game.image ? (
									<img
										className="w-full h-full object-cover"
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
								{/* Badge */}
								<span
									className={`absolute top-2 left-2 text-[8px] font-bold px-2 py-0.5 rounded border ${game.badgeColor}`}
								>
									{game.badge}
								</span>
							</div>
							<div className="p-3 text-center z-10 bg-surface-container">
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
