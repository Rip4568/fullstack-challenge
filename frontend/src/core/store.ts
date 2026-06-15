import { useEffect, useState } from "react";

export interface Bet {
	id: string;
	roundId: string;
	playerId: string;
	username: string;
	amount: number;
	currency: string;
	status: "PENDING" | "CONFIRMED" | "CASHOUT" | "LOST" | "REJECTED";
	cashOutMultiplier: number | null;
	payoutAmount: number | null;
	autoCashoutMultiplier?: number | null;
}

export interface Balance {
	id?: string;
	walletId?: string;
	currency: string;
	amount: number;
	amountFormatted: number;
	estimatedUsdValue: number;
}

export interface GameState {
	mode: "mock" | "real";
	roundState: "BETTING" | "GAMEPLAY" | "CRASHED";
	currentMultiplier: number;
	elapsedMs: number;
	roundId: string;
	serverSeedHash: string;
	crashPoint: number | null;
	serverSeed: string | null;
	clientSeed: string;
	bettingCountdown: number;
	userBet: Bet | null;
	activeBets: Bet[];
	roundHistory: Array<{
		id: string;
		crashPoint: number;
		serverSeedHash: string;
		serverSeed: string | null;
		clientSeed: string;
	}>;
	balances: Balance[];
	playerId: string | null;
	username: string | null;
	token: string | null;
	error: string | null;
	isConnected: boolean;
}

const DEFAULT_BALANCES: Balance[] = [
	{
		currency: "BRL",
		amount: 500000,
		amountFormatted: 5000.0,
		estimatedUsdValue: 900.0,
	},
	{
		currency: "USD",
		amount: 100000,
		amountFormatted: 1000.0,
		estimatedUsdValue: 1000.0,
	},
	{
		currency: "BTC",
		amount: 150000000,
		amountFormatted: 1.5,
		estimatedUsdValue: 97500.0,
	},
	{
		currency: "ETH",
		amount: 10000000000000000000,
		amountFormatted: 10.0,
		estimatedUsdValue: 35000.0,
	},
];

const initialMode = "real";

const initialHistory = [
	{
		id: "1",
		crashPoint: 1.45,
		serverSeedHash: "hash1",
		serverSeed: "seed1",
		clientSeed: "client1",
	},
	{
		id: "2",
		crashPoint: 2.12,
		serverSeedHash: "hash2",
		serverSeed: "seed2",
		clientSeed: "client2",
	},
	{
		id: "3",
		crashPoint: 1.05,
		serverSeedHash: "hash3",
		serverSeed: "seed3",
		clientSeed: "client3",
	},
	{
		id: "4",
		crashPoint: 5.89,
		serverSeedHash: "hash4",
		serverSeed: "seed4",
		clientSeed: "client4",
	},
	{
		id: "5",
		crashPoint: 1.0,
		serverSeedHash: "hash5",
		serverSeed: "seed5",
		clientSeed: "client5",
	},
	{
		id: "6",
		crashPoint: 12.34,
		serverSeedHash: "hash6",
		serverSeed: "seed6",
		clientSeed: "client6",
	},
	{
		id: "7",
		crashPoint: 1.87,
		serverSeedHash: "hash7",
		serverSeed: "seed7",
		clientSeed: "client7",
	},
	{
		id: "8",
		crashPoint: 3.42,
		serverSeedHash: "hash8",
		serverSeed: "seed8",
		clientSeed: "client8",
	},
];

let state: GameState = {
	mode: initialMode,
	roundState: "CRASHED",
	currentMultiplier: 1.0,
	elapsedMs: 0,
	roundId: "initial-round-id",
	serverSeedHash:
		"85e3d74c0c1e84617c0a969f694e9f9064c125df963c4e09de21503c4cfde662",
	crashPoint: null,
	serverSeed: null,
	clientSeed: "jungle-gaming-fair-seed-2026",
	bettingCountdown: 0,
	userBet: null,
	activeBets: [],
	roundHistory: initialHistory,
	balances: initialMode === "mock" ? DEFAULT_BALANCES : [],
	playerId: initialMode === "mock" ? "mock-player-id" : null,
	username: initialMode === "mock" ? "GorillaGambler" : null,
	token: null,
	error: null,
	isConnected: false,
};

// Subscriptions
const listeners = new Set<() => void>();

function emitChange() {
	for (const listener of listeners) {
		listener();
	}
}

export const gameStore = {
	getState() {
		return state;
	},

	setState(
		updater: Partial<GameState> | ((prev: GameState) => Partial<GameState>),
	) {
		const nextState = typeof updater === "function" ? updater(state) : updater;
		state = { ...state, ...nextState };
		emitChange();
	},

	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},

	setMode(mode: "mock" | "real") {
		if (typeof window !== "undefined") {
			window.localStorage.setItem("game_mode", mode);
		}

		// When toggling mode, reset relevant game state
		this.setState({
			mode,
			roundState: "CRASHED",
			currentMultiplier: 1.0,
			elapsedMs: 0,
			userBet: null,
			activeBets: [],
			error: null,
			...(mode === "mock"
				? {
						username: "GorillaGambler",
						playerId: "mock-player-id",
						balances: DEFAULT_BALANCES,
					}
				: {
						username: null,
						playerId: null,
						token: null,
						balances: [],
						isConnected: false,
					}),
		});
	},

	updateBalance(currency: string, amountChange: number) {
		const updatedBalances = state.balances.map((b) => {
			if (b.currency === currency) {
				const newAmount = Math.max(0, b.amount + amountChange);
				let amountFormatted = newAmount;
				let estimatedUsdValue = 0;

				switch (currency) {
					case "BRL":
						amountFormatted = newAmount / 100;
						estimatedUsdValue = amountFormatted * 0.18;
						break;
					case "USD":
						amountFormatted = newAmount / 100;
						estimatedUsdValue = amountFormatted;
						break;
					case "BTC":
						amountFormatted = newAmount / 100000000;
						estimatedUsdValue = amountFormatted * 65000;
						break;
					case "ETH":
						amountFormatted = newAmount / 1000000000000000000;
						estimatedUsdValue = amountFormatted * 3500;
						break;
				}

				return {
					...b,
					amount: newAmount,
					amountFormatted,
					estimatedUsdValue: Math.floor(estimatedUsdValue * 100) / 100,
				};
			}
			return b;
		});

		this.setState({ balances: updatedBalances });
	},
};

// React hook to access and subscribe to the store
export function useGameState() {
	const [currentState, setCurrentState] = useState<GameState>(state);

	useEffect(() => {
		const unsubscribe = gameStore.subscribe(() => {
			setCurrentState(gameStore.getState());
		});
		// Set initial state in case it changed since initialization
		setCurrentState(gameStore.getState());
		return unsubscribe;
	}, []);

	return currentState;
}
