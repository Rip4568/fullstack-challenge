import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { gameStore, useGameState } from "../core/store";
import CurrencySelector from "../features/wallet/CurrencySelector";
import DepositQRSection from "../features/wallet/DepositQRSection";
import QRScannerSimulatorModal from "../features/wallet/QRScannerSimulatorModal";
import RecentDeposits from "../features/wallet/RecentDeposits";
import { walletTransactionsQueryOptions } from "../queries/wallet.queries";

/*
🎨 DESIGN COMMITMENT: JUNGLE DIGITAL
- Estilo: Liquid Digital / Bauhaus Remix
- Geometria: Sharp (0px) borders and bold thick outlines (2px) to create high digital contrast.
- Traição Topológica: Diagonal/Asymmetric splits. Split layout breaks bento boxes with custom thick shadow values.
- Risk Factor: Interactive phone scanner simulator uses a digital alignment box with high-intensity glowing animations and spring-like trigger physics.
- Cliché Liquidation: Killed standard bento grid splits and boring standard rounded status badges. Replaced them with raw, high-contrast digital monospace displays.
*/

export const Route = createFileRoute("/deposit")({
	loader: ({ context: { queryClient } }) => {
		const { token, mode } = gameStore.getState();
		if (token && mode === "real") {
			return queryClient.ensureQueryData(walletTransactionsQueryOptions());
		}
	},
	component: DepositPage,
});

function formatDepositAmount(amount: number, currency: string): string {
	const abs = Math.abs(amount);
	if (currency === "BRL") return `R$ ${(abs / 100).toFixed(2)}`;
	if (currency === "USD") return `$${(abs / 100).toFixed(2)}`;
	if (currency === "BTC") return `${(abs / 1e8).toFixed(5)} BTC`;
	if (currency === "ETH") return `${(abs / 1e18).toFixed(5)} ETH`;
	return `${abs} ${currency}`;
}

function timeAgo(date: string | Date): string {
	const diff = Date.now() - new Date(date).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins} min ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

export function DepositPage() {
	const state = useGameState();
	const [selectedAsset, setSelectedAsset] = useState("BRL");
	const [selectedNetwork, setSelectedNetwork] = useState("PIX");
	const [isScannerOpen, setIsScannerOpen] = useState(false);

	const { data: transactions = [], isLoading } = useQuery({
		...walletTransactionsQueryOptions(),
		enabled: state.mode === "real" && !!state.token,
	});

	const deposits = transactions
		.filter((tx) => tx.referenceType === "SIMULATED_DEPOSIT")
		.map((tx) => ({
			id: tx.id,
			amount: formatDepositAmount(tx.amount, tx.currency),
			status: "Completed",
			time: timeAgo(tx.createdAt),
			currency: tx.currency,
			hash: `${tx.referenceId.slice(0, 12)}...`,
		}));

	// Wallet address mapping
	const addresses: Record<string, string> = {
		BRL: "Chave Pix CNPJ: 12.345.678/0001-90",
		USD: "0x32A4dB88C72141a0dD92185ef3Dcdcdf34cb48e9",
		BTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
		ETH: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
	};

	return (
		<main className="min-h-screen pt-4 pb-20 px-6 max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 bg-jungle-glow">
			{/* Left Panel (8 cols): Currency and QR details */}
			<section className="xl:col-span-8 flex flex-col gap-6">
				{/* Cashier Title */}
				<div className="bg-surface-container rounded-[2px] border-2 border-outline-variant p-6 shadow-[4px_4px_0px_0px_rgba(60,75,54,0.5)]">
					<h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
						Deposit Funds
					</h2>
					<p className="text-on-surface-variant/70 text-xs font-mono mt-1.5 uppercase tracking-wider">
						Choose your preferred currency to top up your Jungle Crash wallet
						balance instantly.
					</p>
				</div>

				<CurrencySelector
					balances={state.balances}
					selectedAsset={selectedAsset}
					onSelectAsset={setSelectedAsset}
					onSelectNetwork={setSelectedNetwork}
				/>

				<DepositQRSection
					selectedAsset={selectedAsset}
					selectedNetwork={selectedNetwork}
					onSelectNetwork={setSelectedNetwork}
					address={addresses[selectedAsset] || ""}
					onOpenSimulator={() => setIsScannerOpen(true)}
				/>
			</section>

			{/* Right Panel (4 cols): Recent History */}
			<aside className="xl:col-span-4 flex flex-col gap-6">
				<RecentDeposits deposits={deposits} isLoading={isLoading} />
			</aside>

			<QRScannerSimulatorModal
				isOpen={isScannerOpen}
				onClose={() => setIsScannerOpen(false)}
				selectedAsset={selectedAsset}
				address={addresses[selectedAsset] || ""}
			/>
		</main>
	);
}
