import { useEffect, useRef, useState } from "react";
import { useGameState } from "../../core/store";

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	color: string;
	size: number;
}

const CrashGraph = () => {
	const state = useGameState();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
	const particlesRef = useRef<Particle[]>([]);
	const explosionParticlesRef = useRef<Particle[]>([]);
	const lastStateRef = useRef(state.roundState);
	const _frameIdRef = useRef<number | null>(null);

	// Rocket position history for trailing line
	const prevPosRef = useRef({ x: 50, y: 350 });

	// Parallax effect on mouse move
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = (rect.width / 2 - (e.clientX - rect.left)) / 40;
		const y = (rect.height / 2 - (e.clientY - rect.top)) / 40;
		setParallaxOffset({ x, y });
	};

	const handleMouseLeave = () => {
		setParallaxOffset({ x: 0, y: 0 });
	};

	// Reset state variables when round state transitions
	useEffect(() => {
		if (state.roundState !== lastStateRef.current) {
			if (state.roundState === "BETTING") {
				particlesRef.current = [];
				explosionParticlesRef.current = [];
				prevPosRef.current = { x: 50, y: 350 };
			} else if (state.roundState === "CRASHED" && canvasRef.current) {
				// Spawn explosion particles at the last rocket position
				const canvas = canvasRef.current;
				const rect = canvas.getBoundingClientRect();
				const width = rect.width;
				const height = rect.height;

				const progress = Math.min(100, (state.elapsedMs / 10000) * 100);
				const multHeight = Math.min(80, (state.currentMultiplier - 1.0) * 15);

				const padX = 50;
				const padY = 60;
				const _startX = padX;
				const startY = height - padY;
				const endX = padX + (width - padX * 2) * (progress / 100);
				const endY = startY - (height - padY * 2) * (multHeight / 80);

				const explosionParticles: Particle[] = [];
				for (let i = 0; i < 60; i++) {
					const angle = Math.random() * Math.PI * 2;
					const speed = 2 + Math.random() * 8;
					explosionParticles.push({
						x: endX,
						y: endY,
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed,
						life: 1,
						maxLife: 30 + Math.random() * 30,
						color:
							i % 3 === 0 ? "#ffb4ab" : i % 3 === 1 ? "#ff5252" : "#ffc107",
						size: 2 + Math.random() * 4,
					});
				}
				explosionParticlesRef.current = explosionParticles;
			}
			lastStateRef.current = state.roundState;
		}
	}, [state.roundState, state.elapsedMs, state.currentMultiplier]);

	// Render loop
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationFrameId: number;

		const render = () => {
			const rect = canvas.getBoundingClientRect();
			// Handle high DPI displays
			const dpr = window.devicePixelRatio || 1;
			if (
				canvas.width !== rect.width * dpr ||
				canvas.height !== rect.height * dpr
			) {
				canvas.width = rect.width * dpr;
				canvas.height = rect.height * dpr;
				ctx.scale(dpr, dpr);
			}

			const width = rect.width;
			const height = rect.height;

			// Clear canvas
			ctx.clearRect(0, 0, width, height);

			// Draw Grid lines
			ctx.strokeStyle = "rgba(60, 75, 54, 0.15)";
			ctx.lineWidth = 1;
			const gridSpacing = 50;
			// Slowly scroll grid lines backwards if gameplay is active
			const scrollOffset =
				state.roundState === "GAMEPLAY"
					? (state.elapsedMs / 50) % gridSpacing
					: 0;

			for (let x = -scrollOffset; x < width; x += gridSpacing) {
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
				ctx.stroke();
			}
			for (let y = 0; y < height; y += gridSpacing) {
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
				ctx.stroke();
			}

			// Coordinates padding
			const padX = 50;
			const padY = 60;
			const startX = padX;
			const startY = height - padY;

			// Axis lines
			ctx.strokeStyle = "#24282E";
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(startX, 10);
			ctx.lineTo(startX, startY);
			ctx.lineTo(width - 10, startY);
			ctx.stroke();

			if (state.roundState === "GAMEPLAY" || state.roundState === "CRASHED") {
				const progress = Math.min(100, (state.elapsedMs / 10000) * 100);
				const multHeight = Math.min(80, (state.currentMultiplier - 1.0) * 15);

				const endX = padX + (width - padX * 2) * (progress / 100);
				const endY = startY - (height - padY * 2) * (multHeight / 80);

				// Calculate tangent angle for rocket rotation
				const dx = endX - prevPosRef.current.x;
				const dy = endY - prevPosRef.current.y;
				const angle = Math.atan2(dy, dx);

				// Update previous positions
				if (state.roundState === "GAMEPLAY") {
					prevPosRef.current = { x: endX, y: endY };
				}

				// Draw curve gradient fill under the line
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				// Draw quad curve
				const controlX = startX + (endX - startX) * 0.5;
				const controlY = startY;
				ctx.quadraticCurveTo(controlX, controlY, endX, endY);
				ctx.lineTo(endX, startY);
				ctx.closePath();
				const gradient = ctx.createLinearGradient(0, endY, 0, startY);
				gradient.addColorStop(0, "rgba(125, 255, 103, 0.15)");
				gradient.addColorStop(1, "rgba(125, 255, 103, 0)");
				ctx.fillStyle = gradient;
				ctx.fill();
				ctx.restore();

				// Draw curve outline
				ctx.strokeStyle = "#7dff67";
				ctx.lineWidth = 3;
				ctx.shadowColor = "rgba(125, 255, 103, 0.5)";
				ctx.shadowBlur = 10;
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.quadraticCurveTo(controlX, controlY, endX, endY);
				ctx.stroke();
				ctx.shadowBlur = 0; // reset shadow

				// Spawn thrust particles if gameplay is active
				if (state.roundState === "GAMEPLAY" && Math.random() < 0.6) {
					particlesRef.current.push({
						x: endX - Math.cos(angle) * 10,
						y: endY - Math.sin(angle) * 10,
						vx:
							-Math.cos(angle) * (1 + Math.random() * 2) +
							(Math.random() - 0.5) * 1.5,
						vy:
							-Math.sin(angle) * (1 + Math.random() * 2) +
							(Math.random() - 0.5) * 1.5,
						life: 1,
						maxLife: 20 + Math.random() * 15,
						color: Math.random() < 0.7 ? "#7dff67" : "#00e701",
						size: 1 + Math.random() * 3,
					});
				}

				// Draw/Update thrust particles
				particlesRef.current = particlesRef.current.filter((p) => {
					p.x += p.vx;
					p.y += p.vy;
					p.life += 1;
					ctx.fillStyle = p.color;
					ctx.globalAlpha = 1 - p.life / p.maxLife;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
					ctx.fill();
					return p.life < p.maxLife;
				});
				ctx.globalAlpha = 1.0;

				// Draw Rocket ship if gameplay
				if (state.roundState === "GAMEPLAY") {
					ctx.save();
					// Screen shake offset (intensity grows with multiplier)
					const shakeIntensity = Math.max(
						0,
						(state.currentMultiplier - 1.5) * 0.8,
					);
					const shakeX = (Math.random() - 0.5) * shakeIntensity;
					const shakeY = (Math.random() - 0.5) * shakeIntensity;
					ctx.translate(endX + shakeX, endY + shakeY);
					ctx.rotate(angle);

					// Outer glow
					ctx.shadowColor = "#7dff67";
					ctx.shadowBlur = 15;

					// Stylized modern vector rocket ship
					ctx.fillStyle = "#ffffff";
					ctx.beginPath();
					ctx.moveTo(18, 0); // nose cone
					ctx.lineTo(-8, -8); // left wing tip
					ctx.lineTo(-3, 0); // body rear
					ctx.lineTo(-8, 8); // right wing tip
					ctx.closePath();
					ctx.fill();

					// Engine fire core
					ctx.shadowColor = "#00e701";
					ctx.fillStyle = "#7dff67";
					ctx.beginPath();
					ctx.moveTo(-3, 0);
					ctx.lineTo(-12, -3);
					ctx.lineTo(-18, 0);
					ctx.lineTo(-12, 3);
					ctx.closePath();
					ctx.fill();

					ctx.restore();
				}
			}

			// Draw/Update Explosion particles if crashed
			if (
				state.roundState === "CRASHED" &&
				explosionParticlesRef.current.length > 0
			) {
				explosionParticlesRef.current = explosionParticlesRef.current.filter(
					(p) => {
						p.x += p.vx;
						p.y += p.vy;
						p.vy += 0.05; // gravity pull
						p.vx *= 0.98; // drag
						p.life += 1;
						ctx.fillStyle = p.color;
						ctx.globalAlpha = 1 - p.life / p.maxLife;
						ctx.beginPath();
						ctx.arc(
							p.x,
							p.y,
							p.size * (1.5 - p.life / p.maxLife),
							0,
							Math.PI * 2,
						);
						ctx.fill();
						return p.life < p.maxLife;
					},
				);
				ctx.globalAlpha = 1.0;
			}

			animationFrameId = requestAnimationFrame(render);
		};

		render();

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [state.roundState, state.elapsedMs, state.currentMultiplier]);
	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Parallax background effect */}
			<div
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				className="relative graph-area rounded-2xl h-[400px] md:h-[480px] border border-outline-variant overflow-hidden flex flex-col items-center justify-center select-none"
			>
				{/* Jungle Parallax Background */}
				<img
					style={{
						transform: `scale(1.1) translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
						transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
					}}
					className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
					alt="Jungle background theme"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwCuifWLYV146aT4TD5saPanUgbxZOhsgAkVHPfcvA4wzPK6_SQV4x5S-Sfy5FN9OAukUSgVwbfsExE4bd2AUASgRWmPOk1UTrFzfu-VHjgNs4ooUj-knJS3N0320M0cjGx3V7P3bgMJ6B1ij42DtPs4j4nLAtwu4fVOG6cs9Av4PJRF4rvJUkW7WtKporDErhWbZTJKKO7rBugUjRsYFN7KSzNepvJENcyY10znFCTPgX17BQqFdThXYlWcHPeAQWGDQXzeHL0VVT"
				/>

				{/* Canvas Rendering Game Elements */}
				<canvas
					ref={canvasRef}
					className="absolute inset-0 w-full h-full pointer-events-none z-10"
				/>

				{/* Overlay text elements */}
				<div className="z-20 text-center flex flex-col items-center justify-center px-4">
					{state.roundState === "BETTING" && (
						<div className="flex flex-col items-center justify-center animate-pulse">
							<span className="text-sm font-extrabold uppercase font-mono tracking-widest text-primary mb-2">
								Próxima rodada inicia em
							</span>
							<span className="text-5xl md:text-7xl font-black font-mono text-white tracking-tighter">
								{state.bettingCountdown.toFixed(1)}s
							</span>
							<div className="w-48 h-1 bg-surface-container rounded-full mt-4 overflow-hidden">
								<div
									style={{ width: `${(state.bettingCountdown / 10) * 100}%` }}
									className="h-full bg-primary shadow-[0_0_8px_#7dff67] transition-all duration-100"
								/>
							</div>
						</div>
					)}

					{state.roundState === "GAMEPLAY" && (
						<div className="flex flex-col items-center">
							<span className="text-xs uppercase font-mono text-primary font-bold tracking-widest bg-primary/10 px-3 py-1 rounded border border-primary/20 mb-3 shadow-[0_0_10px_rgba(125,255,103,0.15)]">
								Jungle Rocket
							</span>
							<span className="text-6xl md:text-8xl font-black font-mono text-white tracking-tighter neon-glow animate-bounce">
								{state.currentMultiplier.toFixed(2)}x
							</span>
						</div>
					)}

					{state.roundState === "CRASHED" && (
						<div className="flex flex-col items-center">
							<span className="text-xs uppercase font-mono text-red-400 font-bold tracking-widest bg-red-500/10 px-3 py-1 rounded border border-red-500/20 mb-3">
								Exploded!
							</span>
							<span className="text-5xl md:text-7xl font-black font-mono text-red-500 tracking-tighter">
								@ {state.crashPoint?.toFixed(2) || "1.00"}x
							</span>
						</div>
					)}
				</div>

				{/* Bottom Bar inside Graph */}
				<div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] text-on-surface-variant/40 font-mono z-20">
					<span>ROUND ID: {state.roundId.substring(0, 12)}...</span>
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full ${state.isConnected || state.mode === "mock" ? "bg-primary" : "bg-red-500"}`}
						/>
						<span>{state.mode === "mock" ? "OFFLINE MOCK" : "LIVE API"}</span>
					</div>
				</div>
			</div>
		</>
	);
};

export default CrashGraph;
