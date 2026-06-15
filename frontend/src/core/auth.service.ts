import { gameStore } from "./store";

interface JwtPayload {
	sub: string;
	preferred_username?: string;
	exp: number;
}

interface TokenResponse {
	access_token: string;
	refresh_token: string;
	id_token?: string;
}

const KEYCLOAK_CLIENT_ID = "crash-game-client";
const KEYCLOAK_BASE =
	"http://localhost:8080/realms/crash-game/protocol/openid-connect";

class AuthService {
	private generateRandomString(length: number): string {
		const charset =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
		let result = "";
		if (typeof window !== "undefined" && window.crypto) {
			const values = new Uint32Array(length);
			window.crypto.getRandomValues(values);
			for (let i = 0; i < length; i++) {
				result += charset[values[i] % charset.length];
			}
		} else {
			for (let i = 0; i < length; i++) {
				result += charset.charAt(Math.floor(Math.random() * charset.length));
			}
		}
		return result;
	}

	private async sha256(plain: string): Promise<ArrayBuffer> {
		const encoder = new TextEncoder();
		const data = encoder.encode(plain);
		return window.crypto.subtle.digest("SHA-256", data);
	}

	private base64urlencode(a: ArrayBuffer): string {
		const bytes = new Uint8Array(a);
		let str = "";
		for (let i = 0; i < bytes.byteLength; i++) {
			str += String.fromCharCode(bytes[i]);
		}
		return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	}

	private async generateChallenge(verifier: string): Promise<string> {
		const hashed = await this.sha256(verifier);
		return this.base64urlencode(hashed);
	}

	public async redirectToLogin() {
		const verifier = this.generateRandomString(64);
		window.localStorage.setItem("pkce_code_verifier", verifier);

		const challenge = await this.generateChallenge(verifier);
		const redirectUri = `${window.location.origin}/`;

		const url =
			`${KEYCLOAK_BASE}/auth` +
			`?client_id=${KEYCLOAK_CLIENT_ID}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&response_type=code` +
			`&scope=openid` +
			`&code_challenge=${challenge}` +
			`&code_challenge_method=S256`;

		window.location.href = url;
	}

	public async redirectToRegister() {
		const verifier = this.generateRandomString(64);
		window.localStorage.setItem("pkce_code_verifier", verifier);

		const challenge = await this.generateChallenge(verifier);
		const redirectUri = `${window.location.origin}/`;

		const url =
			`${KEYCLOAK_BASE}/auth` +
			`?client_id=${KEYCLOAK_CLIENT_ID}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&response_type=code` +
			`&scope=openid` +
			`&code_challenge=${challenge}` +
			`&code_challenge_method=S256` +
			`&kc_action=register`;

		window.location.href = url;
	}

	public async handleCallback(): Promise<boolean> {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get("code");
		if (!code) return false;

		const verifier = window.localStorage.getItem("pkce_code_verifier");
		if (!verifier) {
			console.error(
				"[AuthService] PKCE Code Verifier not found in localStorage",
			);
			return false;
		}

		const redirectUri = `${window.location.origin}/`;

		try {
			const tokenResponse = await fetch(`${KEYCLOAK_BASE}/token`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "authorization_code",
					client_id: KEYCLOAK_CLIENT_ID,
					code,
					redirect_uri: redirectUri,
					code_verifier: verifier,
				}),
			});

			if (!tokenResponse.ok) {
				throw new Error(await tokenResponse.text());
			}

			const tokens = await tokenResponse.json();
			this.saveTokens(tokens);

			// Clean query params from URL
			window.history.replaceState({}, document.title, window.location.pathname);
			return true;
		} catch (err) {
			console.error("[AuthService] Error exchanging code for tokens:", err);
			return false;
		}
	}

	private decodeJwt(token: string): JwtPayload | null {
		try {
			const base64Url = token.split(".")[1];
			const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
			const jsonPayload = decodeURIComponent(
				atob(base64)
					.split("")
					.map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
					.join(""),
			);
			return JSON.parse(jsonPayload) as JwtPayload;
		} catch (err) {
			console.error("[AuthService] Failed to decode JWT:", err);
			return null;
		}
	}

	private saveTokens(tokens: TokenResponse) {
		const accessToken = tokens.access_token;
		const refreshToken = tokens.refresh_token;
		const idToken = tokens.id_token;

		const payload = this.decodeJwt(accessToken);
		if (!payload) return;

		const playerId = payload.sub;
		const username = payload.preferred_username || "Player";

		window.localStorage.setItem("auth_token", accessToken);
		window.localStorage.setItem("auth_refresh_token", refreshToken);
		window.localStorage.setItem("auth_username", username);
		window.localStorage.setItem("auth_player_id", playerId);
		if (idToken) window.localStorage.setItem("auth_id_token", idToken);

		gameStore.setState({
			token: accessToken,
			username,
			playerId,
		});
	}

	public checkLocalSession() {
		const token = window.localStorage.getItem("auth_token");
		const username = window.localStorage.getItem("auth_username");
		const playerId = window.localStorage.getItem("auth_player_id");

		if (token && username && playerId) {
			// Decode and check if token is expired
			const payload = this.decodeJwt(token);
			if (payload && payload.exp * 1000 > Date.now()) {
				gameStore.setState({
					token,
					username,
					playerId,
				});
				return true;
			}
		}
		return false;
	}

	public async refreshSession(): Promise<boolean> {
		const refreshToken = window.localStorage.getItem("auth_refresh_token");
		if (!refreshToken) return false;

		try {
			const response = await fetch(`${KEYCLOAK_BASE}/token`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "refresh_token",
					client_id: KEYCLOAK_CLIENT_ID,
					refresh_token: refreshToken,
				}),
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			const tokens = await response.json();
			this.saveTokens(tokens);
			return true;
		} catch (err) {
			console.error("[AuthService] Failed to refresh token:", err);
			this.clearSession();
			return false;
		}
	}

	public clearSession() {
		window.localStorage.removeItem("auth_token");
		window.localStorage.removeItem("auth_refresh_token");
		window.localStorage.removeItem("auth_username");
		window.localStorage.removeItem("auth_player_id");
		window.localStorage.removeItem("auth_id_token");

		gameStore.setState({
			token: null,
			username: null,
			playerId: null,
			balances: [],
		});
	}

	public logout() {
		const idToken = window.localStorage.getItem("auth_id_token");
		this.clearSession();

		const redirectUri = encodeURIComponent(`${window.location.origin}/`);
		let logoutUrl = `${KEYCLOAK_BASE}/logout?client_id=${KEYCLOAK_CLIENT_ID}&post_logout_redirect_uri=${redirectUri}`;
		if (idToken) logoutUrl += `&id_token_hint=${encodeURIComponent(idToken)}`;

		window.location.href = logoutUrl;
	}
}

export const authService = new AuthService();
export default authService;
