import { AIChat } from "@/components/ai-chat";
import { Sidebar } from "@/components/sidebar";

export const metadata = {
  title: "AI Agent | ChainLancer",
  description: "Create escrow smart contracts using natural language on Kite AI Testnet",
};

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 pt-24 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <AIChat />
        </div>
      </main>
    </div>
  );
}
