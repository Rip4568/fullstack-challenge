import { useEffect, useRef, useState } from "react";
import { useGameState } from "../services/store";

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	alpha: number;
	size: number;
	color: string;
}

export default function CrashGraph() {
	const {
		roundState,
		currentMultiplier,
		elapsedMs,
		bettingCountdown,
		serverSeedHash,
		crashPoint,
	} = useGameState();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationRef = useRef<number | null>(null);
	const particlesRef = useRef<Particle[]>([]);
	const lastStateRef = useRef<string>(roundState);

	// Track resizing
	const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setDimensions({
					width: entry.contentRect.width || 600,
					height: Math.max(300, entry.contentRect.height || 400),
				});
			}
		});
		resizeObserver.observe(containerRef.current);
		return () => resizeObserver.disconnect();
	}, []);

	// Spawn particles on crash
	useEffect(() => {
		if (
			roundState === "CRASHED" &&
			lastStateRef.current !== "CRASHED" &&
			canvasRef.current
		) {
			// Spawn explosion particles!
			const canvas = canvasRef.current;
			const W = canvas.width;
			const H = canvas.height;
			const margin = 50;

			// Estimate the crash point position on canvas
			const maxTime = Math.max(10000, elapsedMs + 2000);
			const maxMult = Math.max(2.0, (crashPoint || currentMultiplier) + 0.5);
			const x = margin + (elapsedMs / maxTime) * (W - margin * 2);
			const y =
				H -
				margin -
				(((crashPoint || currentMultiplier) - 1.0) / (maxMult - 1.0)) *
					(H - margin * 2);

			const colors = ["#ff0055", "#ff5500", "#ffaa00", "#ff2a5f", "#ffd200"];
			const particles: Particle[] = [];
			for (let i = 0; i < 40; i++) {
				const angle = Math.random() * Math.PI * 2;
				const speed = 2 + Math.random() * 8;
				particles.push({
					x,
					y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed,
					alpha: 1.0,
					size: 2 + Math.random() * 4,
					color: colors[Math.floor(Math.random() * colors.length)],
				});
			}
			particlesRef.current = particles;
		}
		lastStateRef.current = roundState;
	}, [roundState, elapsedMs, currentMultiplier, crashPoint]);

	// Main draw loop
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const W = dimensions.width;
		const H = dimensions.height;
		canvas.width = W;
		canvas.height = H;

		const margin = 50;
		const plotWidth = W - margin * 2;
		const plotHeight = H - margin * 2;

		const draw = () => {
			// Clear canvas with deep space gradient
			const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
			bgGrad.addColorStop(0, "#080c0f");
			bgGrad.addColorStop(1, "#11181e");
			ctx.fillStyle = bgGrad;
			ctx.fillRect(0, 0, W, H);

			// Draw grid lines
			ctx.strokeStyle = "rgba(141, 229, 219, 0.05)";
			ctx.lineWidth = 1;

			const gridCount = 5;
			for (let i = 1; i < gridCount; i++) {
				// Horizontal grid
				const gy = H - margin - (i / gridCount) * plotHeight;
				ctx.beginPath();
				ctx.moveTo(margin, gy);
				ctx.lineTo(W - margin, gy);
				ctx.stroke();

				// Vertical grid
				const gx = margin + (i / gridCount) * plotWidth;
				ctx.beginPath();
				ctx.moveTo(gx, margin);
				ctx.lineTo(gx, H - margin);
				ctx.stroke();
			}

			// Draw axis lines
			ctx.strokeStyle = "rgba(141, 229, 219, 0.2)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			// Y-axis
			ctx.moveTo(margin, margin);
			ctx.lineTo(margin, H - margin);
			// X-axis
			ctx.lineTo(W - margin, H - margin);
			ctx.stroke();

			// Setup scaling factors
			const maxTime = Math.max(10000, elapsedMs + 2000);
			const maxMult = Math.max(2.0, currentMultiplier + 0.5);

			// Render X-axis labels (time in seconds)
			ctx.fillStyle = "rgba(141, 229, 219, 0.5)";
			ctx.font = "10px Manrope, sans-serif";
			ctx.textAlign = "center";
			for (let s = 0; s <= maxTime; s += 2000) {
				const lx = margin + (s / maxTime) * plotWidth;
				ctx.fillText(`${(s / 1000).toFixed(0)}s`, lx, H - margin + 20);
			}

			// Render Y-axis labels (multipliers)
			ctx.textAlign = "right";
			ctx.textBaseline = "middle";
			const multStep = (maxMult - 1.0) / 4;
			for (let i = 0; i <= 4; i++) {
				const val = 1.0 + i * multStep;
				const ly = H - margin - (i / 4) * plotHeight;
				ctx.fillText(`${val.toFixed(2)}x`, margin - 10, ly);
			}

			// Render according to roundState
			if (roundState === "BETTING") {
				// Countdown visual
				const centerX = W / 2;
				const centerY = H / 2;
				const radius = 60;

				// Progress circle
				ctx.beginPath();
				ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
				ctx.strokeStyle = "rgba(141, 229, 219, 0.1)";
				ctx.lineWidth = 6;
				ctx.stroke();

				ctx.beginPath();
				const percent = bettingCountdown / 10.0;
				ctx.arc(
					centerX,
					centerY,
					radius,
					-Math.PI / 2,
					-Math.PI / 2 + Math.PI * 2 * percent,
				);
				ctx.strokeStyle = "#60d7cf";
				ctx.lineWidth = 6;
				ctx.lineCap = "round";
				ctx.stroke();

				// Counter text
				ctx.fillStyle = "#ffffff";
				ctx.font = "32px D-DIN, Roboto Mono, monospace";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(`${bettingCountdown.toFixed(1)}s`, centerX, centerY - 5);

				ctx.fillStyle = "rgba(141, 229, 219, 0.7)";
				ctx.font = "12px Manrope, sans-serif";
				ctx.fillText("APOSTAS ABERTAS", centerX, centerY + 25);
			} else if (roundState === "GAMEPLAY") {
				// Draw Curve
				ctx.strokeStyle = "#60d7cf";
				ctx.lineWidth = 4;
				ctx.shadowColor = "#60d7cf";
				ctx.shadowBlur = 10;

				ctx.beginPath();
				ctx.moveTo(margin, H - margin);

				// Sub-sample exponential curve points to draw
				const steps = 60;
				for (let i = 0; i <= steps; i++) {
					const t = (elapsedMs * i) / steps;
					const mult = 1.0 * Math.exp(0.00006 * t);
					const px = margin + (t / maxTime) * plotWidth;
					const py = H - margin - ((mult - 1.0) / (maxMult - 1.0)) * plotHeight;
					ctx.lineTo(px, py);
				}
				ctx.stroke();
				ctx.shadowBlur = 0; // reset

				// Fill area under curve with a gradient
				ctx.beginPath();
				ctx.moveTo(margin, H - margin);
				for (let i = 0; i <= steps; i++) {
					const t = (elapsedMs * i) / steps;
					const mult = 1.0 * Math.exp(0.00006 * t);
					const px = margin + (t / maxTime) * plotWidth;
					const py = H - margin - ((mult - 1.0) / (maxMult - 1.0)) * plotHeight;
					ctx.lineTo(px, py);
				}
				ctx.lineTo(margin + (elapsedMs / maxTime) * plotWidth, H - margin);
				ctx.closePath();

				const fillGrad = ctx.createLinearGradient(0, margin, 0, H - margin);
				fillGrad.addColorStop(0, "rgba(96, 215, 207, 0.15)");
				fillGrad.addColorStop(1, "rgba(96, 215, 207, 0.0)");
				ctx.fillStyle = fillGrad;
				ctx.fill();

				// Tip Rocket/Pulse Ball
				const lastX = margin + (elapsedMs / maxTime) * plotWidth;
				const lastY =
					H -
					margin -
					((currentMultiplier - 1.0) / (maxMult - 1.0)) * plotHeight;

				ctx.fillStyle = "#ffffff";
				ctx.beginPath();
				ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
				ctx.fill();

				ctx.strokeStyle = "#60d7cf";
				ctx.lineWidth = 2;
				ctx.beginPath();
				const pulseRadius = 6 + (Date.now() % 1000) / 100;
				ctx.arc(lastX, lastY, pulseRadius, 0, Math.PI * 2);
				ctx.stroke();

				// Huge multiplier text in center
				ctx.fillStyle = "#ffffff";
				ctx.font = "bold 64px D-DIN, Roboto Mono, monospace";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.shadowColor = "rgba(96, 215, 207, 0.6)";
				ctx.shadowBlur = 20;
				ctx.fillText(`${currentMultiplier.toFixed(2)}x`, W / 2, H / 2);
				ctx.shadowBlur = 0;
			} else if (roundState === "CRASHED") {
				// Draw frozen curve up to crashPoint
				const finalCrash = crashPoint || currentMultiplier;
				const maxTime = Math.max(10000, elapsedMs + 2000);
				const maxMult = Math.max(2.0, finalCrash + 0.5);

				ctx.strokeStyle = "#ff2a5f";
				ctx.lineWidth = 4;
				ctx.shadowColor = "#ff2a5f";
				ctx.shadowBlur = 8;
				ctx.beginPath();
				ctx.moveTo(margin, H - margin);

				const steps = 60;
				for (let i = 0; i <= steps; i++) {
					const t = (elapsedMs * i) / steps;
					const mult = 1.0 * Math.exp(0.00006 * t);
					const px = margin + (t / maxTime) * plotWidth;
					const py = H - margin - ((mult - 1.0) / (maxMult - 1.0)) * plotHeight;
					ctx.lineTo(px, py);
				}
				ctx.stroke();
				ctx.shadowBlur = 0;

				// Draw explosion particles
				particlesRef.current.forEach((p, _idx) => {
					p.x += p.vx;
					p.y += p.vy;
					p.vy += 0.1; // gravity
					p.alpha -= 0.015;

					if (p.alpha > 0) {
						ctx.save();
						ctx.globalAlpha = p.alpha;
						ctx.fillStyle = p.color;
						ctx.shadowColor = p.color;
						ctx.shadowBlur = 5;
						ctx.beginPath();
						ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
						ctx.fill();
						ctx.restore();
					}
				});
				// Remove dead particles
				particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

				// Huge red text in center
				ctx.fillStyle = "#ff2a5f";
				ctx.font = "bold 56px D-DIN, Roboto Mono, monospace";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.shadowColor = "rgba(255, 42, 95, 0.6)";
				ctx.shadowBlur = 20;
				ctx.fillText("FLEW AWAY", W / 2, H / 2 - 20);

				ctx.fillStyle = "#ffffff";
				ctx.font = "bold 36px D-DIN, Roboto Mono, monospace";
				ctx.fillText(`@ ${finalCrash.toFixed(2)}x`, W / 2, H / 2 + 30);
				ctx.shadowBlur = 0;
			}
		};

		// Animation runner
		const loop = () => {
			draw();
			animationRef.current = requestAnimationFrame(loop);
		};

		loop();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		dimensions,
		roundState,
		currentMultiplier,
		elapsedMs,
		bettingCountdown,
		crashPoint,
	]);

	return (
		<div className="relative w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-[inset_0_1px_0_var(--inset-glint)] backdrop-blur-md">
			{/* Server Seed Hash Header */}
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3 text-xs text-[var(--sea-ink-soft)]">
				<div className="flex items-center gap-1.5">
					<span className="h-2 w-2 rounded-full bg-emerald-400" />
					<span className="font-semibold tracking-wide">
						PROVABLY FAIR ACTIVE
					</span>
				</div>
				<div
					className="font-mono text-[10px] break-all max-w-[250px] md:max-w-md bg-black/20 px-2.5 py-1 rounded select-all"
					title="SHA-256 Server Seed Hash for validation"
				>
					SHA-256: {serverSeedHash || "Generating..."}
				</div>
			</div>

			{/* Main Canvas View */}
			<div
				ref={containerRef}
				className="relative mt-4 h-[300px] md:h-[400px] w-full overflow-hidden rounded-xl"
			>
				<canvas ref={canvasRef} className="block w-full h-full" />
			</div>
		</div>
	);
}
