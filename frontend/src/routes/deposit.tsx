import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { gameStore, useGameState } from "../services/store";

export const Route = createFileRoute("/deposit")({
	component: DepositPage,
});

export function DepositPage() {
	const state = useGameState();
	const [selectedAsset, setSelectedAsset] = useState("BRL");
	const [selectedNetwork, setSelectedNetwork] = useState("PIX");
	const [copied, setCopied] = useState(false);

	// Wallet address mapping
	const addresses: Record<string, string> = {
		BRL: "Chave Pix CNPJ: 12.345.678/0001-90",
		USD: "0x32A4dB88C72141a0dD92185ef3Dcdcdf34cb48e9",
		BTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
		ETH: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(addresses[selectedAsset] || "");
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Recent deposits data
	const deposits = [
		{
			id: "1",
			amount: "R$ 150,00",
			status: "Completed",
			time: "10 mins ago",
			currency: "BRL",
			hash: "pix_92kd...911",
		},
		{
			id: "2",
			amount: "0.0050 BTC",
			status: "Completed",
			time: "3 hours ago",
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

	// Add mock funds to balance for testing
	const handleSimulateDeposit = () => {
		let mockIncrement = 10000; // 100.00 standard
		if (selectedAsset === "BTC") mockIncrement = 10000000; // 0.1 BTC
		if (selectedAsset === "ETH") mockIncrement = 500000000000000000; // 0.5 ETH

		gameStore.updateBalance(selectedAsset, mockIncrement);
	};

	return (
		<main className="min-h-screen pt-4 pb-20 px-6 max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 bg-jungle-glow">
			{/* Left Bento Box Panel (8 cols): Method and Address details */}
			<section className="xl:col-span-8 flex flex-col gap-6">
				{/* Cashier Title */}
				<div className="bg-surface-container rounded-2xl border border-outline-variant p-6">
					<h2 className="text-xl font-bold text-white flex items-center gap-2">
						<span className="material-symbols-outlined text-primary fill">
							account_balance_wallet
						</span>
						Deposit Funds
					</h2>
					<p className="text-on-surface-variant text-xs mt-1">
						Choose your preferred currency to top up your Jungle Crash wallet
						balance instantly.
					</p>
				</div>

				{/* Currency selector buttons */}
				<div className="bg-surface-container rounded-2xl border border-outline-variant p-6">
					<span className="block text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-4">
						Select Currency
					</span>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						{state.balances.map((b) => (
							<button
								key={b.currency}
								onClick={() => {
									setSelectedAsset(b.currency);
									if (b.currency === "BRL") setSelectedNetwork("PIX");
									else if (b.currency === "USD") setSelectedNetwork("ERC20");
									else if (b.currency === "BTC") setSelectedNetwork("Bitcoin");
									else if (b.currency === "ETH") setSelectedNetwork("Ethereum");
								}}
								type="button"
								className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 relative transition-all cursor-pointer border ${
									selectedAsset === b.currency
										? "active-neon-border bg-primary/5 border-primary"
										: "bg-surface-container-lowest border-outline-variant hover:border-on-surface-variant/40"
								}`}
							>
								<span className="font-mono text-sm font-black text-white">
									{b.currency}
								</span>
								<span className="text-[10px] font-mono text-on-surface-variant">
									{b.currency === "BRL"
										? "Brazilian Real"
										: b.currency === "USD"
											? "US Dollar"
											: b.currency === "BTC"
												? "Bitcoin"
												: "Ethereum"}
								</span>
								{selectedAsset === b.currency && (
									<div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
								)}
							</button>
						))}
					</div>
				</div>

				{/* Form details and QR Code */}
				<div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col md:flex-row gap-8 items-center md:items-stretch">
					{/* QR Code Graphic placeholder */}
					<div className="w-44 h-44 bg-surface-container-lowest rounded-2xl border border-outline-variant p-3 flex flex-col items-center justify-center relative group overflow-hidden">
						{/* Draw simulated QR patterns */}
						<div className="w-full h-full border-2 border-primary/20 p-2 flex flex-wrap gap-1 items-center justify-center opacity-85">
							{Array.from({ length: 49 }).map((_, i) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: simulated QR pattern
									key={i}
									className={`w-4 h-4 rounded-xs ${
										(
											i % 3 === 0 ||
												i % 7 === 2 ||
												i === 0 ||
												i === 6 ||
												i === 42 ||
												i === 48
										) && i !== 22
											? "bg-white"
											: "bg-transparent"
									}`}
								/>
							))}
						</div>
						<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<span className="text-[9px] font-mono text-primary font-bold text-center">
								SCAN TO DEPOSIT
							</span>
						</div>
					</div>

					{/* Form details */}
					<div className="flex-1 w-full flex flex-col justify-between gap-6">
						{/* Network selectors */}
						<div>
							<span className="block text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-2">
								Deposit Network
							</span>
							<div className="flex gap-2">
								{selectedAsset === "BRL" ? (
									<button
										type="button"
										className="bg-surface-container-highest border border-primary text-primary text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm"
									>
										PIX (Immediate)
									</button>
								) : selectedAsset === "BTC" ? (
									<>
										<button
											onClick={() => setSelectedNetwork("Bitcoin")}
											type="button"
											className={`text-xs font-bold py-2.5 px-4 rounded-lg cursor-pointer transition-colors border ${
												selectedNetwork === "Bitcoin"
													? "bg-surface-container-highest border-primary text-primary"
													: "bg-surface-container-lowest border-outline-variant text-on-surface-variant"
											}`}
										>
											BTC (Native)
										</button>
										<button
											onClick={() => setSelectedNetwork("Lightning")}
											type="button"
											className={`text-xs font-bold py-2.5 px-4 rounded-lg cursor-pointer transition-colors border ${
												selectedNetwork === "Lightning"
													? "bg-surface-container-highest border-primary text-primary"
													: "bg-surface-container-lowest border-outline-variant text-on-surface-variant"
											}`}
										>
											Lightning Network
										</button>
									</>
								) : (
									<>
										<button
											onClick={() =>
												setSelectedNetwork(
													selectedAsset === "ETH" ? "Ethereum" : "ERC20",
												)
											}
											type="button"
											className={`text-xs font-bold py-2.5 px-4 rounded-lg cursor-pointer transition-colors border ${
												selectedNetwork ===
												(selectedAsset === "ETH" ? "Ethereum" : "ERC20")
													? "bg-surface-container-highest border-primary text-primary"
													: "bg-surface-container-lowest border-outline-variant text-on-surface-variant"
											}`}
										>
											{selectedAsset === "ETH"
												? "Ethereum (Mainnet)"
												: "USDC (ERC20)"}
										</button>
										<button
											onClick={() => setSelectedNetwork("BSC")}
											type="button"
											className={`text-xs font-bold py-2.5 px-4 rounded-lg cursor-pointer transition-colors border ${
												selectedNetwork === "BSC"
													? "bg-surface-container-highest border-primary text-primary"
													: "bg-surface-container-lowest border-outline-variant text-on-surface-variant"
											}`}
										>
											BEP20 (BSC)
										</button>
									</>
								)}
							</div>
						</div>

						{/* Address fields */}
						<div>
							<span className="block text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-2">
								Your Wallet Address
							</span>
							<div className="relative">
								<input
									className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 pr-16 text-xs text-primary font-mono outline-none select-all"
									readOnly
									type="text"
									value={addresses[selectedAsset] || ""}
								/>
								<button
									onClick={handleCopy}
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:scale-90"
								>
									<span className="material-symbols-outlined">
										{copied ? "check" : "content_copy"}
									</span>
								</button>
							</div>
							<p className="mt-2 text-[10px] text-on-surface-variant/40 italic">
								Send only {selectedAsset} using network {selectedNetwork} to
								this endpoint. Sending other assets will cause losses.
							</p>
						</div>

						{/* Simulation button */}
						<button
							onClick={handleSimulateDeposit}
							type="button"
							className="bg-primary text-on-primary font-bold py-3.5 rounded-xl text-center active:scale-95 transition-all text-xs cursor-pointer neon-btn-glow"
						>
							Simulate Instant Top Up (+100.00 {selectedAsset})
						</button>
					</div>
				</div>
			</section>

			{/* Right Bento Box Panel (4 cols): Recent History */}
			<aside className="xl:col-span-4 flex flex-col gap-6">
				<div className="bg-surface-container rounded-2xl border border-outline-variant p-6 flex flex-col h-full">
					<div className="pb-4 border-b border-outline-variant">
						<h3 className="font-bold text-sm text-white">Recent Deposits</h3>
					</div>

					<div className="flex-1 overflow-y-auto pt-4 space-y-4 max-h-[500px] xl:max-h-none custom-scrollbar">
						{deposits.map((item) => (
							<div
								key={item.id}
								className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant group hover:border-primary/40 transition-colors"
							>
								<div className="flex justify-between items-start mb-2">
									<div className="flex items-center gap-2">
										<span className="material-symbols-outlined text-primary text-sm">
											add_circle
										</span>
										<span className="font-mono text-xs font-bold text-white">
											{item.amount}
										</span>
									</div>
									<span
										className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
											item.status === "Completed"
												? "bg-primary/10 text-primary border border-primary/20"
												: item.status === "Pending"
													? "bg-surface-container-highest text-on-surface-variant border border-outline-variant"
													: "bg-red-500/10 text-red-400 border border-red-500/20"
										}`}
									>
										{item.status}
									</span>
								</div>
								<div className="flex justify-between items-center text-[9px] font-mono text-on-surface-variant/40">
									<span>TX: {item.hash}</span>
									<span>{item.time}</span>
								</div>
							</div>
						))}
					</div>

					<div className="mt-6 pt-4 border-t border-outline-variant text-center">
						<span className="text-[10px] text-on-surface-variant/30 flex items-center justify-center gap-1.5">
							<span className="material-symbols-outlined text-sm">
								security
							</span>
							AES-256 Cold Storage Protocol
						</span>
					</div>
				</div>
			</aside>
		</main>
	);
}
