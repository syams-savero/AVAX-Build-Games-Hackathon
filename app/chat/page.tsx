import { AIChat } from "@/components/ai-chat";

export const metadata = {
  title: "AI Agent | ChainLancer",
  description: "Create escrow smart contracts using natural language on Kite AI Testnet",
};

export default function ChatPage() {
  return (
    <main>
      <AIChat />
    </main>
  );
}
