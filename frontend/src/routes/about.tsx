import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<main className="max-w-[800px] mx-auto px-6 py-12 min-h-screen bg-jungle-glow flex items-center justify-center">
			<section className="bg-surface-container rounded-2xl border border-outline-variant p-8 shadow-2xl">
				<span className="text-[10px] font-bold font-mono tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded w-fit block mb-3">
					About Jungle Crash
				</span>
				<h1 className="text-3xl font-black text-white mb-4 tracking-tight">
					A High-Stakes Provably Fair Multiplier Game
				</h1>
				<p className="text-on-surface-variant text-sm leading-relaxed mb-6">
					Jungle Crash is a real-time multiplayer gaming platform designed for
					thrill and mathematical precision. Built on a certified{" "}
					<strong>Provably Fair SHA-256 algorithm</strong>, users can inspect
					every crash point, ensuring complete verification transparency.
				</p>
				<p className="text-on-surface-variant text-sm leading-relaxed">
					The project utilizes NestJS and RabbitMQ on the backend for
					high-frequency transaction messaging and ledger updates, while the
					frontend is constructed in React, TanStack Start, and Tailwind CSS v4.
				</p>
			</section>
		</main>
	);
}
