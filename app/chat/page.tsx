'use client';

import { AIChat } from "@/components/ai-chat";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">AI Hiring Assistant</h1>
            <p className="text-slate-500 font-medium mt-3 italic underline decoration-emerald-500/20 underline-offset-4">
              Powered by ChainLancer Autonomous Recruiter Agent
            </p>
          </div>
          <AIChat />
        </div>
      </main>
    </div>
  );
}
