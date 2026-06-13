import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGameState } from "../core/store";
import CurrencySelector from "../features/wallet/CurrencySelector";
import DepositQRSection from "../features/wallet/DepositQRSection";
import QRScannerSimulatorModal from "../features/wallet/QRScannerSimulatorModal";
import RecentDeposits from "../features/wallet/RecentDeposits";

/*
🎨 DESIGN COMMITMENT: JUNGLE DIGITAL
- Estilo: Liquid Digital / Bauhaus Remix
- Geometria: Sharp (0px) borders and bold thick outlines (2px) to create high digital contrast.
- Traição Topológica: Diagonal/Asymmetric splits. Split layout breaks bento boxes with custom thick shadow values.
- Risk Factor: Interactive phone scanner simulator uses a digital alignment box with high-intensity glowing animations and spring-like trigger physics.
- Cliché Liquidation: Killed standard bento grid splits and boring standard rounded status badges. Replaced them with raw, high-contrast digital monospace displays.
*/

export const Route = createFileRoute("/deposit")({
	component: DepositPage,
});

export function DepositPage() {
	const state = useGameState();
	const [selectedAsset, setSelectedAsset] = useState("BRL");
	const [selectedNetwork, setSelectedNetwork] = useState("PIX");
	const [isScannerOpen, setIsScannerOpen] = useState(false);

	// Wallet address mapping
	const addresses: Record<string, string> = {
		BRL: "Chave Pix CNPJ: 12.345.678/0001-90",
		USD: "0x32A4dB88C72141a0dD92185ef3Dcdcdf34cb48e9",
		BTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
		ETH: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
	};

	// Recent deposits data
	const deposits = [
		{
			id: "1",
			amount: "R$ 100,00",
			status: "Completed",
			time: "Just now",
			currency: "BRL",
			hash: "pix_92kd...911",
		},
		{
			id: "2",
			amount: "0.0020 BTC",
			status: "Completed",
			time: "2 hours ago",
			currency: "BTC",
			hash: "btc_73d8...221",
		},
		{
			id: "3",
			amount: "$50.00",
			status: "Pending",
			time: "1 hour ago",
			currency: "USD",
			hash: "usdc_90a1...aa5",
		},
		{
			id: "4",
			amount: "0.0150 ETH",
			status: "Failed",
			time: "Yesterday",
			currency: "ETH",
			hash: "eth_e4c0...8b6",
		},
	];

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
				<RecentDeposits deposits={deposits} />
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
