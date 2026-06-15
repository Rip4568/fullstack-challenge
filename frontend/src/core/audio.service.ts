let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	if (!audioCtx) {
		const AudioContextClass =
			window.AudioContext ||
			(
				window as unknown as {
					webkitAudioContext: typeof AudioContext;
				}
			).webkitAudioContext;

		if (AudioContextClass) {
			audioCtx = new AudioContextClass();
		}
	}

	// Resume audio context if it was suspended (browser autoplay policy)
	if (audioCtx && audioCtx.state === "suspended") {
		audioCtx.resume().catch(() => {});
	}

	return audioCtx;
}

/**
 * Play takeoff sound effect (rising pitch sweep)
 */
export function playTakeoff() {
	const ctx = getAudioContext();
	if (!ctx) return;

	try {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "sine";
		osc.frequency.setValueAtTime(150, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 1.5);

		gain.gain.setValueAtTime(0.01, ctx.currentTime);
		gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 1.5);
	} catch (e) {
		console.warn("Failed to play takeoff audio:", e);
	}
}

/**
 * Play explosion sound effect (filtered noise & low frequency oscillator decay)
 */
export function playExplosion() {
	const ctx = getAudioContext();
	if (!ctx) return;

	try {
		// Noise buffer for the crash explosion
		const bufferSize = ctx.sampleRate * 1.0; // 1 second
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = Math.random() * 2 - 1;
		}

		const noise = ctx.createBufferSource();
		noise.buffer = buffer;

		// Lowpass filter sweep
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(800, ctx.currentTime);
		filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);

		const noiseGain = ctx.createGain();
		noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
		noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

		noise.connect(filter);
		filter.connect(noiseGain);
		noiseGain.connect(ctx.destination);

		noise.start(ctx.currentTime);
		noise.stop(ctx.currentTime + 1.0);

		// Sub-bass rumble sweep
		const subOsc = ctx.createOscillator();
		const subGain = ctx.createGain();

		subOsc.type = "sawtooth";
		subOsc.frequency.setValueAtTime(100, ctx.currentTime);
		subOsc.frequency.linearRampToValueAtTime(20, ctx.currentTime + 0.5);

		subGain.gain.setValueAtTime(0.2, ctx.currentTime);
		subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

		subOsc.connect(subGain);
		subGain.connect(ctx.destination);

		subOsc.start(ctx.currentTime);
		subOsc.stop(ctx.currentTime + 0.5);
	} catch (e) {
		console.warn("Failed to play explosion audio:", e);
	}
}

/**
 * Play coins sound effect (multiple high pitch chimes ringing in sequence)
 */
export function playCoins() {
	const ctx = getAudioContext();
	if (!ctx) return;

	try {
		const playChime = (freq: number, delay: number, dur: number) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "sine";
			osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

			gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
			gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.02);
			gain.gain.exponentialRampToValueAtTime(
				0.001,
				ctx.currentTime + delay + dur,
			);

			osc.connect(gain);
			gain.connect(ctx.destination);

			osc.start(ctx.currentTime + delay);
			osc.stop(ctx.currentTime + delay + dur);
		};

		// Play 3 chimes in quick succession to sound like coins clinking
		playChime(987.77, 0, 0.4); // B5
		playChime(1318.51, 0.08, 0.5); // E6
		playChime(1567.98, 0.16, 0.6); // G6
	} catch (e) {
		console.warn("Failed to play coins audio:", e);
	}
}
