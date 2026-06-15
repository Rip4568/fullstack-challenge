/**
 * Unit tests for AuthService.
 * Uses jsdom environment (localStorage, window.location available via vitest.config.ts).
 *
 * Tests public methods only (private methods are covered indirectly):
 *   - checkLocalSession() — reads and validates stored JWT
 *   - clearSession()      — wipes localStorage and resets gameStore
 */
import { beforeEach, describe, expect, it } from "vitest";
import { authService } from "./auth.service";
import { gameStore } from "./store";

// ─── Helper: build a minimal unsigned JWT for decoding tests ─────────────────
function makeJwt(payload: Record<string, unknown>): string {
	const encode = (obj: Record<string, unknown>) =>
		btoa(JSON.stringify(obj))
			.replace(/=+$/, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
	const header = encode({ alg: "RS256", typ: "JWT" });
	const body   = encode(payload);
	return `${header}.${body}.fake_signature`;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("AuthService", () => {
	beforeEach(() => {
		window.localStorage.clear();
		gameStore.setState({ token: null, username: null, playerId: null, balances: [] });
	});

	// ─── checkLocalSession() ─────────────────────────────────────────────────
	describe("checkLocalSession()", () => {
		it("returns false when no token is stored in localStorage", () => {
			expect(authService.checkLocalSession()).toBe(false);
		});

		it("returns false when stored token cannot be decoded (not a valid JWT)", () => {
			window.localStorage.setItem("auth_token", "not-a-jwt");
			window.localStorage.setItem("auth_username", "player");
			window.localStorage.setItem("auth_player_id", "p1");

			expect(authService.checkLocalSession()).toBe(false);
		});

		it("returns false and does not update gameStore when the stored token is expired", () => {
			const expiredJwt = makeJwt({
				sub: "p1",
				preferred_username: "player",
				exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
			});
			window.localStorage.setItem("auth_token", expiredJwt);
			window.localStorage.setItem("auth_username", "player");
			window.localStorage.setItem("auth_player_id", "p1");

			expect(authService.checkLocalSession()).toBe(false);
			expect(gameStore.getState().token).toBeNull();
		});

		it("returns true and hydrates gameStore when a valid non-expired token is found", () => {
			const jwt = makeJwt({
				sub: "p1",
				preferred_username: "player",
				exp: Math.floor(Date.now() / 1000) + 3600, // valid for 1 more hour
			});
			window.localStorage.setItem("auth_token", jwt);
			window.localStorage.setItem("auth_username", "player");
			window.localStorage.setItem("auth_player_id", "p1");

			const result = authService.checkLocalSession();

			expect(result).toBe(true);
			const state = gameStore.getState();
			expect(state.token).toBe(jwt);
			expect(state.username).toBe("player");
			expect(state.playerId).toBe("p1");
		});

		it("returns false when only the token is stored (username/playerId missing)", () => {
			const jwt = makeJwt({
				sub: "p1",
				exp: Math.floor(Date.now() / 1000) + 3600,
			});
			window.localStorage.setItem("auth_token", jwt);
			// auth_username and auth_player_id are intentionally absent

			expect(authService.checkLocalSession()).toBe(false);
		});
	});

	// ─── clearSession() ──────────────────────────────────────────────────────
	describe("clearSession()", () => {
		it("removes all five auth keys from localStorage", () => {
			window.localStorage.setItem("auth_token", "tok");
			window.localStorage.setItem("auth_refresh_token", "ref");
			window.localStorage.setItem("auth_username", "player");
			window.localStorage.setItem("auth_player_id", "p1");
			window.localStorage.setItem("auth_id_token", "id_tok");

			authService.clearSession();

			expect(window.localStorage.getItem("auth_token")).toBeNull();
			expect(window.localStorage.getItem("auth_refresh_token")).toBeNull();
			expect(window.localStorage.getItem("auth_username")).toBeNull();
			expect(window.localStorage.getItem("auth_player_id")).toBeNull();
			expect(window.localStorage.getItem("auth_id_token")).toBeNull();
		});

		it("resets token, username, playerId and balances in gameStore to unauthenticated state", () => {
			gameStore.setState({
				token: "tok",
				username: "player",
				playerId: "p1",
				balances: [{ currency: "BRL", amount: 1000, amountFormatted: 10, estimatedUsdValue: 1.8 }],
			});

			authService.clearSession();

			const state = gameStore.getState();
			expect(state.token).toBeNull();
			expect(state.username).toBeNull();
			expect(state.playerId).toBeNull();
			expect(state.balances).toEqual([]);
		});

		it("is safe to call when localStorage is already empty (no-op, no throw)", () => {
			expect(() => authService.clearSession()).not.toThrow();
		});

		it("leaves non-auth localStorage keys untouched", () => {
			window.localStorage.setItem("game_mode", "mock");
			window.localStorage.setItem("auth_token", "tok");

			authService.clearSession();

			expect(window.localStorage.getItem("game_mode")).toBe("mock");
		});
	});
});
