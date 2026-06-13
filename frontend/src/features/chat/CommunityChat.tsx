import { useEffect, useRef, useState } from "react";

interface Message {
	id: string;
	user: string;
	time: string;
	content: string;
	isMod?: boolean;
	isPrimary?: boolean;
}

interface CommunityChatProps {
	onClose?: () => void;
}

export default function CommunityChat({ onClose }: CommunityChatProps) {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "msg-1",
			user: "Cyril92",
			time: "12:45",
			content: "Just won x400 on Sweet Craze! This is insane!! 🔥🔥",
			isPrimary: true,
		},
		{
			id: "msg-2",
			user: "Mod_Alex",
			time: "12:46",
			content: "Congrats Cyril! Don't forget to withdraw some of that.",
			isMod: true,
		},
		{
			id: "msg-3",
			user: "Yuki_99",
			time: "12:46",
			content: "How long does it take for USDC withdrawal normally?",
			isPrimary: true,
		},
	]);
	const [inputText, setInputText] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const handleSend = () => {
		if (!inputText.trim()) return;

		const now = new Date();
		const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
			now.getMinutes(),
		).padStart(2, "0")}`;

		const userMessage: Message = {
			id: `user-msg-${Date.now()}`,
			user: "CyberGambler",
			time: timeStr,
			content: inputText,
			isPrimary: true,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputText("");

		// Simulate community reply after 1.5 seconds
		setTimeout(() => {
			const replies = [
				"Woah nice one!",
				"Jungle Crash is hitting crazy multipliers right now! 🚀",
				"Let’s goooo!",
				"Make sure to verify your seed in the cryptographic panel!",
				"Double up or nothing, that’s my motto 🤑",
			];
			const randomReply = replies[Math.floor(Math.random() * replies.length)];
			const replyUser = ["SlotNinja", "CrashKing", "Dave_Jungle", "Mod_Alex"][
				Math.floor(Math.random() * 4)
			];

			const responseMessage: Message = {
				id: `sys-msg-${Date.now()}`,
				user: replyUser,
				time: timeStr,
				content: randomReply,
				isMod: replyUser === "Mod_Alex",
				isPrimary: replyUser !== "Mod_Alex",
			};
			setMessages((prev) => [...prev, responseMessage]);
		}, 1500);
	};

	return (
		<div className="fixed right-6 bottom-6 w-80 h-[500px] bg-surface-container rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden z-50">
			{/* Header */}
			<div className="p-4 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
					<span className="font-bold text-sm">Online Chat</span>
				</div>
				{onClose && (
					<button
						onClick={onClose}
						type="button"
						className="text-on-surface-variant hover:text-white cursor-pointer"
					>
						<span className="material-symbols-outlined text-sm">close</span>
					</button>
				)}
			</div>

			{/* Messages list */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
				{messages.map((msg) => (
					<div key={msg.id} className="flex flex-col gap-1">
						<div className="flex items-center justify-between text-[10px] text-on-surface-variant">
							<span
								className={`font-bold ${
									msg.isMod
										? "text-secondary"
										: msg.isPrimary
											? "text-primary"
											: "text-on-surface"
								}`}
							>
								{msg.user}
							</span>
							<span>{msg.time}</span>
						</div>
						<div
							className={`p-3 rounded-tr-xl rounded-b-xl text-sm ${
								msg.isMod
									? "bg-secondary-container text-on-secondary-container"
									: "bg-surface-container-highest text-on-surface"
							}`}
						>
							{msg.content}
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			{/* Input section */}
			<div className="p-4 bg-surface-container-high border-t border-outline-variant">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSend();
					}}
					className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2"
				>
					<input
						className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none text-on-surface placeholder-on-surface-variant/40"
						placeholder="Type a message..."
						type="text"
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
					/>
					<button
						type="submit"
						className="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform"
					>
						send
					</button>
				</form>
			</div>
		</div>
	);
}
