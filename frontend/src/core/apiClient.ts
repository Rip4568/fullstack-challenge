import axios from "axios";
import { gameStore } from "./store";

const API_BASE = "http://localhost:8000";

export const apiClient = axios.create({
	baseURL: API_BASE,
	timeout: 10000,
	headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
	(config) => {
		const { token } = gameStore.getState();
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

export function parseApiError(err: unknown, defaultMsg: string): Error {
	if (axios.isAxiosError(err)) {
		const serverMsg = err.response?.data?.message || err.response?.data;
		if (serverMsg) {
			return new Error(
				typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg),
			);
		}
		return new Error(err.message || defaultMsg);
	}
	return err instanceof Error ? err : new Error(defaultMsg);
}
