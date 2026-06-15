import { io, type Socket } from "socket.io-client";
import { queryClient } from "../lib/queryClient";
import { playCoins, playExplosion, playTakeoff } from "./audio.service";
import type { Bet } from "./store";
import { gameStore } from "./store";

class SocketService {
	private socket: Socket | null = null;
	private countdownInterval: ReturnType<typeof setInterval> | undefined =
		undefined;

	public connect() {
		if (this.socket?.connected) return;

		console.log("[SocketService] Connecting to WebSocket...");

		// Connect to Kong Gateway proxy at http://localhost:8000
		// Kong redirects /games to the games service
		this.socket = io("http://localhost:8000", {
			path: "/games/socket.io",
			transports: ["websocket", "polling"],
			reconnectionAttempts: 5,
		});

		this.socket.on("connect", () => {
			console.log("[SocketService] Connected to gateway.");
			gameStore.setState({ isConnected: true });
		});

		this.socket.on("disconnect", () => {
			console.log("[SocketService] Disconnected from gateway.");
			gameStore.setState({ isConnected: false });
			this.clearCountdown();
		});

		this.socket.on("connect_error", (err) => {
			console.error("[SocketService] Connection error:", err);
			gameStore.setState({ isConnected: false });
		});

		// --- Event Listeners ---

		this.socket.on(
			"round:betting",
			(data: {
				roundId: string;
				durationMs: number;
				serverSeedHash: string;
			}) => {
				console.log("[SocketService] Event: round:betting", data);
				this.clearCountdown();

				// Start client-side countdown timer for UI responsiveness
				let secondsLeft = data.durationMs / 1000;
				gameStore.setState({
					roundState: "BETTING",
					roundId: data.roundId,
					currentMultiplier: 1.0,
					elapsedMs: 0,
					serverSeedHash: data.serverSeedHash,
					serverSeed: null,
					crashPoint: null,
					bettingCountdown: secondsLeft,
					activeBets: [],
					userBet: null, // Clear user bet for the new round
				});

				this.countdownInterval = setInterval(() => {
					secondsLeft -= 0.1;
					if (secondsLeft <= 0) {
						this.clearCountdown();
						return;
					}
					gameStore.setState({
						bettingCountdown: Math.round(secondsLeft * 10) / 10,
					});
				}, 100);
			},
		);

		this.socket.on("round:start", (data: { roundId: string }) => {
			console.log("[SocketService] Event: round:start", data);
			this.clearCountdown();
			playTakeoff();

			// Transition user bet to CONFIRMED
			const state = gameStore.getState();
			let updatedUserBet = state.userBet;
			if (state.userBet && state.userBet.status === "PENDING") {
				updatedUserBet = { ...state.userBet, status: "CONFIRMED" };
			}

			gameStore.setState({
				roundState: "GAMEPLAY",
				roundId: data.roundId,
				userBet: updatedUserBet,
				activeBets: state.activeBets.map((b) =>
					b.playerId === state.playerId
						? { ...b, status: "CONFIRMED" as const }
						: b,
				),
			});
		});

		this.socket.on(
			"round:tick",
			(data: {
				roundId: string;
				currentMultiplier: number;
				elapsedMs: number;
			}) => {
				gameStore.setState({
					currentMultiplier: data.currentMultiplier,
					elapsedMs: data.elapsedMs,
				});
			},
		);

		this.socket.on(
			"round:crashed",
			(data: { roundId: string; crashPoint: number; serverSeed: string }) => {
				console.log("[SocketService] Event: round:crashed", data);
				this.clearCountdown();
				playExplosion();

				const state = gameStore.getState();

				// Update bets status to LOST
				const updatedBets = state.activeBets.map((b) => {
					if (b.status === "CONFIRMED" || b.status === "PENDING") {
						return { ...b, status: "LOST" as const };
					}
					return b;
				});

				let updatedUserBet = state.userBet;
				if (
					state.userBet &&
					(state.userBet.status === "CONFIRMED" ||
						state.userBet.status === "PENDING")
				) {
					updatedUserBet = { ...state.userBet, status: "LOST" };
				}

				// Add to history
				const historyItem = {
					id: data.roundId,
					crashPoint: data.crashPoint,
					serverSeedHash: state.serverSeedHash,
					serverSeed: data.serverSeed,
					clientSeed: state.clientSeed,
				};

				gameStore.setState({
					roundState: "CRASHED",
					crashPoint: data.crashPoint,
					serverSeed: data.serverSeed,
					userBet: updatedUserBet,
					activeBets: updatedBets,
					roundHistory: [historyItem, ...state.roundHistory].slice(0, 20),
				});

				// Invalidate wallet cache so __root.tsx useQuery refetches fresh balances
				queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
			},
		);

		this.socket.on(
			"bet:placed",
			(data: { playerId: string; username: string; amount: number }) => {
				const state = gameStore.getState();

				// Ignore if it is our own bet (we already added it locally in placeBet)
				if (data.playerId === state.playerId) return;

				const newBet: Bet = {
					id: `bet-${Math.random().toString(36).substring(2, 9)}`,
					roundId: state.roundId,
					playerId: data.playerId,
					username: data.username,
					amount: data.amount, // Real backend returns amount in raw cents/sats
					currency: "BRL", // Default BRL representation
					status: "CONFIRMED",
					cashOutMultiplier: null,
					payoutAmount: null,
				};

				gameStore.setState({
					activeBets: [...state.activeBets, newBet],
				});
			},
		);

		this.socket.on(
			"bet:cashout",
			(data: {
				playerId: string;
				username: string;
				multiplier: number;
				payout: number;
			}) => {
				const state = gameStore.getState();

				// If it is our own, update userBet and activeBets, and invalidate queries
				if (data.playerId === state.playerId) {
					playCoins();

					const currency = state.userBet?.currency || "BRL";
					const formatVal = (amount: number, curr: string) => {
						if (curr === "BRL" || curr === "USD") {
							return (amount / 100).toFixed(2);
						}
						if (curr === "BTC") {
							return (amount / 100000000).toFixed(8);
						}
						if (curr === "ETH") {
							return (amount / 1000000000000000000).toFixed(8);
						}
						return amount.toString();
					};
					const formattedPayout = formatVal(data.payout, currency);
					gameStore.addToast({
						type: "success",
						message: `Aposta encerrada com sucesso a ${data.multiplier}x! Recebido ${formattedPayout} ${currency}`,
					});

					gameStore.setState({
						userBet: state.userBet
							? {
									...state.userBet,
									status: "CASHOUT" as const,
									cashOutMultiplier: data.multiplier,
									payoutAmount: data.payout,
								}
							: null,
						activeBets: state.activeBets.map((b) => {
							if (b.playerId === data.playerId) {
								return {
									...b,
									status: "CASHOUT" as const,
									cashOutMultiplier: data.multiplier,
									payoutAmount: data.payout,
								};
							}
							return b;
						}),
					});
					queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
					return;
				}

				gameStore.setState({
					activeBets: state.activeBets.map((b) => {
						if (b.playerId === data.playerId) {
							return {
								...b,
								status: "CASHOUT" as const,
								cashOutMultiplier: data.multiplier,
								payoutAmount: data.payout,
							};
						}
						return b;
					}),
				});
			},
		);
	}

	public disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			console.log("[SocketService] WebSocket connection terminated.");
		}
		this.clearCountdown();
	}

	private clearCountdown() {
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = undefined;
		}
	}
}

export const socketService = new SocketService();
export default socketService;
