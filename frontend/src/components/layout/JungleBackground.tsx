import { useMemo } from "react";

interface LeafItem {
	x: number;
	y: number;
	rotate: number;
	scale: number;
}

export default function JungleBackground() {
	// Pre-defined coordinates and rotations for leaves to ensure a natural look
	const leaves: LeafItem[] = useMemo(
		() => [
			{ x: 80, y: 32, rotate: 15, scale: 0.8 },
			{ x: 150, y: 50, rotate: -10, scale: 0.9 },
			{ x: 220, y: 72, rotate: 5, scale: 1 },
			{ x: 300, y: 92, rotate: -25, scale: 0.85 },
			{ x: 350, y: 100, rotate: 20, scale: 1.1 },
			{ x: 420, y: 104, rotate: -5, scale: 0.95 },
			{ x: 490, y: 96, rotate: 15, scale: 0.8 },
			{ x: 560, y: 110, rotate: -15, scale: 1.2 },
			{ x: 620, y: 130, rotate: 30, scale: 0.9 },
			{ x: 680, y: 158, rotate: -10, scale: 1.15 },
			{ x: 720, y: 172, rotate: 5, scale: 1.25 },
			{ x: 760, y: 168, rotate: -20, scale: 1.1 },
			{ x: 820, y: 140, rotate: 25, scale: 0.95 },
			{ x: 890, y: 112, rotate: -15, scale: 1.05 },
			{ x: 960, y: 98, rotate: 10, scale: 0.85 },
			{ x: 1040, y: 94, rotate: -30, scale: 1 },
			{ x: 1110, y: 88, rotate: 20, scale: 0.9 },
			{ x: 1180, y: 78, rotate: -10, scale: 1.1 },
			{ x: 1260, y: 62, rotate: 15, scale: 0.8 },
			{ x: 1330, y: 44, rotate: -25, scale: 0.95 },
			{ x: 1400, y: 20, rotate: 5, scale: 0.75 },
			// Hanging loops leaves
			{ x: 320, y: 110, rotate: 0, scale: 0.75 },
			{ x: 370, y: 115, rotate: 10, scale: 0.8 },
			{ x: 590, y: 142, rotate: -15, scale: 0.9 },
			{ x: 650, y: 165, rotate: 5, scale: 1.05 },
			{ x: 790, y: 165, rotate: -5, scale: 1.05 },
			{ x: 850, y: 142, rotate: 15, scale: 0.9 },
			{ x: 1080, y: 122, rotate: -10, scale: 0.8 },
			{ x: 1130, y: 120, rotate: 10, scale: 0.75 },
		],
		[],
	);

	return (
		<div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
			<style>{`
				@keyframes leafSway {
					0% { transform: rotate(-4deg); }
					100% { transform: rotate(4deg); }
				}
				@keyframes palmSway {
					0% { transform: rotate(-1.5deg); }
					100% { transform: rotate(1.5deg); }
				}
				@keyframes fogPulse {
					0% { opacity: 0.4; }
					100% { opacity: 0.75; }
				}
			`}</style>
			{/* TOP VINES LAYER */}
			<div className="absolute top-0 left-0 w-full">
				<svg
					viewBox="0 0 1440 240"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-auto opacity-70"
					preserveAspectRatio="none"
				>
					<title>Jungle Vines Glow</title>
					<defs>
						{/* Glow Filters */}
						<filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
							<feGaussianBlur stdDeviation="5" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						<filter
							id="neon-glow-subtle"
							x="-20%"
							y="-20%"
							width="140%"
							height="140%"
						>
							<feGaussianBlur stdDeviation="2.5" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>

						{/* Leaf Gradient: glowing neon tips */}
						<linearGradient id="leaf-grad" x1="0%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" stopColor="#041206" />
							<stop offset="60%" stopColor="#0a2a11" />
							<stop offset="100%" stopColor="#7dff67" />
						</linearGradient>
					</defs>

					{/* Drop shadow (dark offset) for depth */}
					<g transform="translate(3, 4)" opacity="0.65">
						<path
							d="M-10,-10 C 250,90 500,160 720,100 C 940,40 1190,120 1450,-10"
							stroke="#000000"
							strokeWidth="10"
							fill="none"
						/>
						<path
							d="M-10,30 C 300,150 600,60 720,120 C 840,180 1140,80 1450,20"
							stroke="#000000"
							strokeWidth="6"
							fill="none"
						/>
						<path
							d="M 250,75 C 330,135 410,135 490,85"
							stroke="#000000"
							strokeWidth="4"
							fill="none"
						/>
						<path
							d="M 520,105 C 620,185 820,185 920,105"
							stroke="#000000"
							strokeWidth="4"
							fill="none"
						/>
						<path
							d="M 980,95 C 1060,145 1140,145 1220,95"
							stroke="#000000"
							strokeWidth="4"
							fill="none"
						/>
					</g>

					{/* Thick Dark Green Vines */}
					<path
						d="M-10,-10 C 250,90 500,160 720,100 C 940,40 1190,120 1450,-10"
						stroke="#051709"
						strokeWidth="9"
						strokeLinecap="round"
						fill="none"
					/>
					<path
						d="M-10,30 C 300,150 600,60 720,120 C 840,180 1140,80 1450,20"
						stroke="#07220d"
						strokeWidth="5"
						strokeLinecap="round"
						fill="none"
					/>

					{/* Sagging/Looping secondary vines */}
					<path
						d="M 250,75 C 330,135 410,135 490,85"
						stroke="#031507"
						strokeWidth="3.5"
						strokeLinecap="round"
						fill="none"
					/>
					<path
						d="M 520,105 C 620,185 820,185 920,105"
						stroke="#031507"
						strokeWidth="3.5"
						strokeLinecap="round"
						fill="none"
					/>
					<path
						d="M 980,95 C 1060,145 1140,145 1220,95"
						stroke="#031507"
						strokeWidth="3.5"
						strokeLinecap="round"
						fill="none"
					/>

					{/* Neon Green Core Glow Strokes */}
					<path
						d="M-10,-10 C 250,90 500,160 720,100 C 940,40 1190,120 1450,-10"
						stroke="#7dff67"
						strokeWidth="1.8"
						filter="url(#neon-glow)"
						fill="none"
					/>
					<path
						d="M-10,30 C 300,150 600,60 720,120 C 840,180 1140,80 1450,20"
						stroke="#00e701"
						strokeWidth="1.2"
						filter="url(#neon-glow-subtle)"
						fill="none"
					/>
					<path
						d="M 250,75 C 330,135 410,135 490,85"
						stroke="#00e701"
						strokeWidth="1.0"
						filter="url(#neon-glow-subtle)"
						fill="none"
					/>
					<path
						d="M 520,105 C 620,185 820,185 920,105"
						stroke="#7dff67"
						strokeWidth="1.0"
						filter="url(#neon-glow)"
						fill="none"
					/>
					<path
						d="M 980,95 C 1060,145 1140,145 1220,95"
						stroke="#00e701"
						strokeWidth="1.0"
						filter="url(#neon-glow-subtle)"
						fill="none"
					/>

					{/* Individual Hanging Leaves */}
					{leaves.map((leaf, i) => (
						<g
							// biome-ignore lint/suspicious/noArrayIndexKey: leaves order is static and immutable
							key={i}
							transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}
						>
							<g
								style={{
									transformOrigin: "0px 0px",
									animation: `leafSway ${2.5 + (i % 4) * 0.6}s ease-in-out -${(i * 0.4) % 3}s infinite alternate`,
								}}
							>
								{/* Leaf Shadow */}
								<path
									d="M 0 0 C -10 12 -5 28 0 35 C 5 28 10 12 0 0"
									fill="#000000"
									opacity="0.4"
									transform="translate(1.5, 2)"
								/>
								{/* Main Leaf */}
								<path
									d="M 0 0 C -10 12 -5 28 0 35 C 5 28 10 12 0 0"
									fill="url(#leaf-grad)"
									stroke="#7dff67"
									strokeWidth="1.2"
								/>
								{/* Center Vein */}
								<path
									d="M 0 0 L 0 25"
									stroke="#7dff67"
									strokeWidth="0.8"
									opacity="0.8"
								/>
							</g>
						</g>
					))}
				</svg>
			</div>

			{/* BOTTOM TREES LAYER */}
			<div className="absolute bottom-0 left-0 w-full h-[120px] md:h-[180px]">
				<svg
					viewBox="0 0 1440 280"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full"
					preserveAspectRatio="xMidYMax slice"
				>
					<title>Jungle Canopy Silhouettes</title>
					<defs>
						{/* Rising Neon Fog/Mist */}
						<linearGradient id="neon-fog" x1="0%" y1="100%" x2="0%" y2="0%">
							<stop offset="0%" stopColor="#7dff67" stopOpacity="0.12" />
							<stop offset="50%" stopColor="#00e701" stopOpacity="0.04" />
							<stop offset="100%" stopColor="#00e701" stopOpacity="0" />
						</linearGradient>
					</defs>

					{/* Neon Fog backdrop */}
					<rect
						x="0"
						y="40"
						width="1440"
						height="240"
						fill="url(#neon-fog)"
						style={{
							animation: "fogPulse 6s ease-in-out infinite alternate",
						}}
					/>

					{/* LAYER 1: BACK (Distant Silhouettes, Opacity 0.25) */}
					<g fill="#041407" opacity="0.25">
						{/* Back Canopy Base */}
						<path d="M 0 280 L 0 230 C 150 220, 300 240, 450 230 C 600 220, 750 220, 900 230 C 1050 240, 1200 220, 1350 230 L 1440 235 L 1440 280 Z" />
						{/* Distant Palms */}
						<PalmTreeTemplate x={100} y={180} scale={0.6} index={0} />
						<PalmTreeTemplate x={250} y={190} scale={0.5} index={1} />
						<PalmTreeTemplate x={380} y={200} scale={0.5} index={2} />
						<PalmTreeTemplate x={1060} y={200} scale={0.5} index={3} />
						<PalmTreeTemplate x={1180} y={190} scale={0.55} index={4} />
						<PalmTreeTemplate x={1340} y={180} scale={0.6} index={5} />
					</g>

					{/* LAYER 2: MIDDLE (Midground Silhouettes, Opacity 0.55) */}
					<g fill="#061d0a" opacity="0.55">
						{/* Middle Canopy Base */}
						<path d="M 0 280 L 0 245 C 120 235, 240 250, 360 240 C 480 230, 600 230, 720 240 C 840 250, 960 235, 1080 245 C 1200 255, 1320 240, 1440 250 L 1440 280 Z" />
						{/* Midground Palms */}
						<PalmTreeTemplate x={60} y={180} scale={0.7} index={6} />
						<PalmTreeTemplate x={200} y={190} scale={0.6} index={7} />
						<PalmTreeTemplate x={320} y={200} scale={0.55} index={8} />
						<PalmTreeTemplate x={1120} y={200} scale={0.55} index={9} />
						<PalmTreeTemplate x={1240} y={190} scale={0.65} index={10} />
						<PalmTreeTemplate x={1380} y={175} scale={0.7} index={11} />
					</g>

					{/* LAYER 3: FOREGROUND (Foreground Silhouettes with subtle neon glowing stroke, Opacity 0.95) */}
					<g
						fill="#020d04"
						stroke="#7dff67"
						strokeWidth="0.8"
						strokeOpacity="0.35"
					>
						{/* Foreground Canopy Base */}
						<path d="M 0 280 L 0 255 C 100 245, 200 260, 300 250 C 400 240, 500 240, 600 250 C 700 260, 800 260, 900 250 C 1000 240, 1100 240, 1200 250 C 1300 260, 1400 250, 1440 260 L 1440 280 Z" />
						{/* Foreground Palms */}
						<PalmTreeTemplate x={120} y={180} scale={0.8} index={12} />
						<PalmTreeTemplate x={280} y={200} scale={0.65} index={13} />
						<PalmTreeTemplate x={1160} y={200} scale={0.7} index={14} />
						<PalmTreeTemplate x={1300} y={170} scale={0.85} index={15} />
					</g>
				</svg>
			</div>
		</div>
	);
}

// Reusable SVG Palm Tree template to clean up layout
function PalmTreeTemplate({
	x,
	y,
	scale = 1,
	index = 0,
}: {
	x: number;
	y: number;
	scale?: number;
	index?: number;
}) {
	return (
		<g transform={`translate(${x}, ${y}) scale(${scale})`}>
			<g
				style={{
					transformOrigin: "0px 180px",
					animation: `palmSway ${4.5 + (index % 4) * 0.8}s ease-in-out -${(index * 0.3) % 3}s infinite alternate`,
				}}
			>
				{/* Trunk curving slightly */}
				<path d="M -5 180 Q -15 90 0 0 Q 10 90 5 180 Z" />
				{/* Fronds */}
				<g>
					{/* Top-left */}
					<path d="M 0 0 Q -25 -25 -45 -10 Q -25 -10 0 0" />
					{/* Mid-left */}
					<path d="M 0 0 Q -35 -10 -55 10 Q -30 10 0 0" />
					{/* Low-left */}
					<path d="M 0 0 Q -30 15 -45 35 Q -20 20 0 0" />
					{/* Top-right */}
					<path d="M 0 0 Q 25 -25 45 -10 Q 25 -10 0 0" />
					{/* Mid-right */}
					<path d="M 0 0 Q 35 -10 55 10 Q 30 10 0 0" />
					{/* Low-right */}
					<path d="M 0 0 Q 30 15 45 35 Q 20 20 0 0" />
					{/* Center vertical */}
					<path d="M 0 0 Q -8 -35 0 -48 Q 8 -35 0 0" />
				</g>
			</g>
		</g>
	);
}
