import type { Bet } from "./store";
import { gameStore } from "./store";

const MOCK_NAMES = [
	"BananaKing 🍌",
	"GorillaForce 🦍",
	"ChimpChamp 🐒",
	"JungleLord 🌴",
	"TarzanPro 🏹",
	"CheetahRunner 🐆",
	"ApexPredator 🦁",
	"LuckyMonkey 🙊",
	"SlothSlumber 🦥",
	"ParrotTalk 🦜",
	"CobraStrike 🐍",
	"JaguarFierce 🐆",
	"ToucanSam 🐦",
	"PythonCode 🐍",
	"KingKong Jr 🦍",
];

class MockEngine {
	private active = false;
	private tickInterval: ReturnType<typeof setInterval> | undefined = undefined;
	private bettingInterval: ReturnType<typeof setInterval> | undefined = undefined;

	// Secret crash point and seeds for current round
	private currentCrashPoint = 1.0;
	private currentServerSeed = "";
	private loopPromise: Promise<void> | null = null;

	public start() {
		if (this.active) return;
		this.active = true;
		this.loopPromise = this.runLoop();
		console.log("[MockEngine] Started simulation loop.");
	}

	public stop() {
		this.active = false;
		if (this.tickInterval) clearInterval(this.tickInterval);
		if (this.bettingInterval) clearInterval(this.bettingInterval);
		console.log("[MockEngine] Stopped simulation loop.");
	}

	private async runLoop() {
		while (this.active) {
			if (gameStore.getState().mode !== "mock") {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				continue;
			}

			await this.runBettingPhase();
			if (!this.active || gameStore.getState().mode !== "mock") break;

			await this.runGameplayPhase();
			if (!this.active || gameStore.getState().mode !== "mock") break;

			await this.runCrashedPhase();
		}
	}

	private async runBettingPhase() {
		const roundId = `mock-${Math.random().toString(36).substring(2, 11)}`;
		this.currentServerSeed = this.generateSeed();
		const serverSeedHash = this.sha256(this.currentServerSeed);

		gameStore.setState({
			roundState: "BETTING",
			roundId,
			currentMultiplier: 1.0,
			elapsedMs: 0,
			serverSeedHash,
			serverSeed: null,
			crashPoint: null,
			bettingCountdown: 10.0,
			activeBets: [],
		});

		// Update user bet if it was stuck
		const currentStoreState = gameStore.getState();
		if (
			currentStoreState.userBet &&
			currentStoreState.userBet.status !== "PENDING"
		) {
			gameStore.setState({ userBet: null });
		}

		let secondsLeft = 10.0;

		// Simulate other players placing bets during the betting window
		const totalSimulatedBetsCount = Math.floor(Math.random() * 8) + 4; // 4 to 11 bets
		const betPlacementTimes = Array.from(
			{ length: totalSimulatedBetsCount },
			() => Math.random() * 9.0,
		);
		const addedBets = new Set<number>();

		return new Promise<void>((resolve) => {
			this.bettingInterval = setInterval(() => {
				secondsLeft -= 0.1;
				if (secondsLeft <= 0) {
					clearInterval(this.bettingInterval);
					resolve();
					return;
				}

				gameStore.setState({
					bettingCountdown: Math.round(secondsLeft * 10) / 10,
				});

				// Add mock player bets based on time
				const elapsed = 10.0 - secondsLeft;
				betPlacementTimes.forEach((time, index) => {
					if (time <= elapsed && !addedBets.has(index)) {
						addedBets.add(index);
						this.addMockBet();
					}
				});
			}, 100);
		});
	}

	private async runGameplayPhase() {
		const state = gameStore.getState();
		const _roundId = state.roundId;

		// Transition user bet to CONFIRMED
		if (state.userBet && state.userBet.status === "PENDING") {
			const confirmedBet: Bet = { ...state.userBet, status: "CONFIRMED" };
			gameStore.setState({
				userBet: confirmedBet,
				activeBets: state.activeBets.map((b) =>
					b.playerId === state.playerId ? confirmedBet : b,
				),
			});
		}

		// Generate crash point
		this.currentCrashPoint = this.generateCrashPoint();

		gameStore.setState({
			roundState: "GAMEPLAY",
		});

		const startTime = Date.now();
		const tickRateMs = 50;

		// Add target multipliers for mock players
		const stateWithBets = gameStore.getState();
		const mockPlayers = stateWithBets.activeBets.map((bet) => ({
			playerId: bet.playerId,
			targetMultiplier:
				Math.random() < 0.15
					? 1.1 + Math.random() * 0.3 // cash out early
					: Math.random() < 0.5
						? 1.5 + Math.random() * 2.0 // cash out mid
						: 3.5 + Math.random() * 8.0, // greedier
		}));

		return new Promise<void>((resolve) => {
			this.tickInterval = setInterval(() => {
				const elapsedMs = Date.now() - startTime;
				const theoreticalMultiplier = 1.0 * Math.exp(0.00006 * elapsedMs);
				const currentMultiplier = Math.floor(theoreticalMultiplier * 100) / 100;

				if (currentMultiplier >= this.currentCrashPoint) {
					clearInterval(this.tickInterval);
					resolve();
					return;
				}

				// Update multiplier
				gameStore.setState({ currentMultiplier, elapsedMs });

				// Handle auto-cashout for user
				const innerState = gameStore.getState();
				if (innerState.userBet && innerState.userBet.status === "CONFIRMED") {
					// Auto cashout check if configured on bet (let's implement this in UI)
					// For now, we will check if auto cashout has been triggered (if we save it in autoCashoutMultiplier)
					const autoMultiplier = innerState.userBet.autoCashoutMultiplier;
					if (autoMultiplier && currentMultiplier >= autoMultiplier) {
						this.userCashout(currentMultiplier);
					}
				}

				// Simulate mock players cashing out
				mockPlayers.forEach((player) => {
					const freshState = gameStore.getState();
					const targetBet = freshState.activeBets.find(
						(b) => b.playerId === player.playerId,
					);

					if (
						targetBet &&
						targetBet.status === "CONFIRMED" &&
						currentMultiplier >= player.targetMultiplier
					) {
						const payout = Math.floor(targetBet.amount * currentMultiplier);
						const updatedBet: Bet = {
							...targetBet,
							status: "CASHOUT",
							cashOutMultiplier: currentMultiplier,
							payoutAmount: payout,
						};

						gameStore.setState({
							activeBets: freshState.activeBets.map((b) =>
								b.playerId === player.playerId ? updatedBet : b,
							),
						});
					}
				});
			}, tickRateMs);
		});
	}

	private async runCrashedPhase() {
		if (this.tickInterval) clearInterval(this.tickInterval);

		const state = gameStore.getState();
		const finalCrash = this.currentCrashPoint;
		const finalSeed = this.currentServerSeed;

		// Mark remaining active bets as LOST
		const updatedBets = state.activeBets.map((b) => {
			if (b.status === "CONFIRMED" || b.status === "PENDING") {
				return { ...b, status: "LOST" } as Bet;
			}
			return b;
		});

		const userBetUpdated =
			state.userBet &&
			(state.userBet.status === "CONFIRMED" ||
				state.userBet.status === "PENDING")
				? ({ ...state.userBet, status: "LOST" } as Bet)
				: state.userBet;

		// Append to history
		const historyItem = {
			id: state.roundId,
			crashPoint: finalCrash,
			serverSeedHash: state.serverSeedHash,
			serverSeed: finalSeed,
			clientSeed: state.clientSeed,
		};

		gameStore.setState({
			roundState: "CRASHED",
			crashPoint: finalCrash,
			serverSeed: finalSeed,
			userBet: userBetUpdated,
			activeBets: updatedBets,
			roundHistory: [historyItem, ...state.roundHistory].slice(0, 20),
		});

		// Wait 5 seconds cooldown
		await new Promise((resolve) => setTimeout(resolve, 5000));
	}

	public userPlaceBet(
		amount: number,
		currency: string,
		autoCashoutMultiplier?: number | null,
	) {
		const state = gameStore.getState();
		if (state.roundState !== "BETTING") {
			throw new Error("Bets are only allowed during the betting phase.");
		}
		if (state.userBet) {
			throw new Error("You already placed a bet for this round.");
		}

		const balanceObj = state.balances.find((b) => b.currency === currency);
		if (!balanceObj || balanceObj.amount < amount) {
			throw new Error("Insufficient balance.");
		}

		// Deduct balance
		gameStore.updateBalance(currency, -amount);

		const bet: Bet = {
			id: `bet-${Math.random().toString(36).substring(2, 11)}`,
			roundId: state.roundId,
			playerId: state.playerId || "mock-player-id",
			username: state.username || "Player",
			amount,
			currency,
			status: "PENDING",
			cashOutMultiplier: null,
			payoutAmount: null,
			autoCashoutMultiplier: autoCashoutMultiplier ?? null,
		};

		gameStore.setState({
			userBet: bet,
			activeBets: [bet, ...state.activeBets],
		});

		return bet;
	}

	public userCashout(multiplier: number) {
		const state = gameStore.getState();
		if (state.roundState !== "GAMEPLAY") {
			throw new Error("Cash out is only allowed while round is active.");
		}
		if (!state.userBet || state.userBet.status !== "CONFIRMED") {
			throw new Error("No active confirmed bet found.");
		}

		const payout = Math.floor(state.userBet.amount * multiplier);

		const updatedBet: Bet = {
			...state.userBet,
			status: "CASHOUT",
			cashOutMultiplier: multiplier,
			payoutAmount: payout,
		};

		// Credit balance
		gameStore.updateBalance(state.userBet.currency, payout);

		gameStore.setState({
			userBet: updatedBet,
			activeBets: state.activeBets.map((b) =>
				b.playerId === state.playerId ? updatedBet : b,
			),
		});

		return updatedBet;
	}

	// --- Helpers ---

	private addMockBet() {
		const state = gameStore.getState();
		const currency =
			Math.random() < 0.6
				? "BRL"
				: Math.random() < 0.6
					? "USD"
					: Math.random() < 0.5
						? "BTC"
						: "ETH";

		// Random amount
		let amount = 100; // 1.00 minimum
		switch (currency) {
			case "BRL":
			case "USD":
				amount = Math.floor(1.0 + Math.random() * 200) * 100; // 1.00 to 200.00
				break;
			case "BTC":
				amount = Math.floor(100 + Math.random() * 50000); // Satoshis
				break;
			case "ETH":
				amount = Math.floor(100000 + Math.random() * 5000000); // Gwei/Wei scales
				break;
		}

		const username = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
		const playerId = `mock-player-${Math.random().toString(36).substring(2, 7)}`;

		const bet: Bet = {
			id: `bet-mock-${Math.random().toString(36).substring(2, 7)}`,
			roundId: state.roundId,
			playerId,
			username,
			amount,
			currency,
			status: "PENDING",
			cashOutMultiplier: null,
			payoutAmount: null,
		};

		gameStore.setState({
			activeBets: [...state.activeBets, bet],
		});
	}

	private generateCrashPoint(): number {
		const p = Math.random();

		// 3% house edge instant crash
		if (p < 0.03) {
			return 1.0;
		}

		// Pareto formula
		const multiplier = Math.floor(97 / (1 - p)) / 100;
		return Math.min(10000.0, Math.max(1.0, multiplier)); // Lowered mock max for practical gameplay speed
	}

	private generateSeed(): string {
		return Array.from({ length: 64 }, () =>
			Math.floor(Math.random() * 16).toString(16),
		).join("");
	}

	private sha256(str: string): string {
		// Basic fast hash code for browser string hashing in mock mode
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString(16).padEnd(64, "a");
	}
}

export const mockEngine = new MockEngine();
export default mockEngine;
