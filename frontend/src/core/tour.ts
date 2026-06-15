import { driver } from "driver.js";

export const startJungleTour = (force = false) => {
	if (typeof window === "undefined") return;

	const hasSeen = localStorage.getItem("jungle_tour_seen");
	if (hasSeen && !force) return;

	const isMobile = window.innerWidth < 1024;
	const navElement = isMobile ? "#tour-bottom-nav" : "#tour-sidebar";
	const depositElement = isMobile
		? "#tour-deposit-mobile-btn"
		: "#tour-deposit-btn";

	const driverObj = driver({
		showProgress: true,
		animate: true,
		overlayColor: "rgba(12, 14, 16, 0.85)",
		popoverClass: "jungle-tour-popover",
		steps: [
			{
				element: "#tour-welcome-header",
				popover: {
					title: "Welcome to Jungle Crash! 🌴🚀",
					description:
						"Experience high-stakes crash action in our custom cyberpunk jungle casino. Watch the multiplier climb and cash out before the crash!",
					side: "bottom",
					align: "start",
				},
			},
			{
				element: "#tour-wallet-selector",
				popover: {
					title: "Wallet & Balances 💳",
					description:
						"Switch between BRL, USD, BTC, and ETH. Check and manage your funds in real-time from the header.",
					side: "bottom",
					align: "end",
				},
			},
			{
				element: navElement,
				popover: {
					title: isMobile
						? "Mobile Bottom Menu 🧭"
						: "Main Sidebar Navigation 🧭",
					description: isMobile
						? "Access the Lobby, deposit cashier, play crash, and your profile easily using the bottom navigation bar."
						: "Navigate the Lobby, play Jungle Crash directly, view your profile settings, or read details on provably fair audits.",
					side: isMobile ? "top" : "right",
					align: "start",
				},
			},
			{
				element: depositElement,
				popover: {
					title: "Instant Cashier Deposits 💰",
					description:
						"Fund your account immediately using Pix or secure mock currency transfers to start gaming right away.",
					side: "top",
					align: "center",
				},
			},
		],
	});

	driverObj.drive();
	localStorage.setItem("jungle_tour_seen", "true");
};
