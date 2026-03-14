'use client';

import { AIChat } from "@/components/ai-chat";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <AIChat />
        </div>
      </main>
    </div>
  );
}