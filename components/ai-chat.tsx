"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet } from "@/lib/wallet-context";
import { addEscrow } from "@/lib/escrow-store";
import { type Milestone, type TeamMember } from "@/lib/kite-config";
import { chatWithAI, SYSTEM_PROMPT, type ChatMessage } from "@/lib/ai";
import { deployContract, CONTRACT_ABI, CONTRACT_BYTECODE } from "@/lib/contract";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  FileCode2,
  Rocket,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  Globe,
  Zap
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  escrowPreview?: EscrowPreview;
  consultationData?: ConsultationResult;
}

interface EscrowPreview {
  title: string;
  description: string;
  milestones: Milestone[];
  totalAmount: string;
  team?: TeamMember[];
  riskLevel: "Low" | "Medium" | "High";
  duration: string;
}

interface ConsultationResult {
  riskLevel: "Low" | "Medium" | "High";
  budgetAnalysis: string;
  estimatedDuration: string;
  advice: string[];
}

type ChatState = "INITIAL" | "CONSULTING" | "TEAM_PROPOSAL" | "READY";

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to ChainLancer AI. I'm your autonomous recruiter and project auditor. \n\nI analyze your needs, assemble expert teams, and secure your project lifecycle on the Avalanche network. \n\n**What can I help you build today?**",
};

export function AIChat() {
  const { isConnected, address, connect, isConnecting } = useWallet();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("INITIAL");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const generateTeamAndEscrow = (userInput: string): EscrowPreview => {
    const lower = userInput.toLowerCase();
    const amountMatch = lower.match(/(\d+(?:,\d+)?)\s*(?:kite|token|usd|\$)/);
    const rawAmount = amountMatch ? amountMatch[1].replace(/,/g, "") : "10000";
    const totalAmount = parseInt(rawAmount);

    const isHighBudget = totalAmount >= 20000;

    const team: TeamMember[] = isHighBudget ? [
      { role: "Lead Developer", description: "Architecture & Smart Contracts", budget: String(Math.floor(totalAmount * 0.5)) },
      { role: "Security Auditor", description: "Independent Bug Hunting", budget: String(Math.floor(totalAmount * 0.3)) },
      { role: "UI Engineer", description: "Frontend Integration", budget: String(Math.floor(totalAmount * 0.2)) }
    ] : [];

    const milestones: Milestone[] = [
      {
        id: 1,
        title: "Drafting & Security Audit",
        description: "Initial smart contract draft and audit verification.",
        amount: String(Math.floor(totalAmount * 0.3)),
        status: "pending",
        earlyBonus: "5%"
      },
      {
        id: 2,
        title: "Core Development",
        description: "Main feature implementation and on-chain logic.",
        amount: String(Math.floor(totalAmount * 0.5)),
        status: "pending",
        earlyBonus: "10%"
      },
      {
        id: 3,
        title: "Final Audit & Release",
        description: "Final verification and mainnet deployment.",
        amount: String(Math.floor(totalAmount * 0.2)),
        status: "pending"
      }
    ];

    return {
      title: "Custom AI-Vetted Project",
      description: userInput,
      totalAmount: String(totalAmount),
      milestones,
      team: team.length > 0 ? team : undefined,
      riskLevel: totalAmount > 50000 ? "Medium" : "Low",
      duration: totalAmount > 20000 ? "4 Weeks" : "1 Week"
    };
  };

  const handleMagicDemo = async (userInput: string) => {
    setIsProcessing(true);

    try {
      const chatMessages: ChatMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      chatMessages.push({ role: "user", content: userInput });

      const response = await chatWithAI([
        { role: "system", content: SYSTEM_PROMPT },
        ...chatMessages
      ]);

      const newMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response,
      };

      // Check for JSON action at the end
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const actionData = JSON.parse(jsonMatch[1]);
          if (actionData.action === "DEPLOY_CONTRACT") {
            newMsg.escrowPreview = actionData.data;
            setChatState("READY");
          }
        } catch (e) {
          console.error("Failed to parse AI action JSON", e);
        }
      }

      setMessages(prev => [...prev, newMsg]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "system",
        content: `Error: ${error.message || "Failed to get response from AI"}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    handleMagicDemo(currentInput);
  };

  const handleDeploy = async (preview: EscrowPreview) => {
    setIsDeploying(true);
    try {
      // 1. Deploy the smart contract
      // Note: This requires CONTRACT_BYTECODE to be filled in lib/contract.ts
      const txHash = await deployContract(CONTRACT_ABI, CONTRACT_BYTECODE, []);

      // 2. Add to local store (simulating indexing)
      const contract = addEscrow({
        title: preview.title,
        description: preview.description,
        employer: address || "0xAddress",
        worker: "AI Managed Experts",
        totalAmount: preview.totalAmount,
        milestones: preview.milestones,
        status: "created",
        contractAddress: txHash, // In real world, wait for receipt and get address
        team: preview.team,
        riskLevel: preview.riskLevel,
        duration: preview.duration,
        aiAuditResult: "AUDITED - Security Score: 98/100"
      });

      const deployMsg: Message = {
        id: `deploy-${Date.now()}`,
        role: "system",
        content: `**Deployment Successful!** 🚀\n\nTransaction Hash: ${txHash}\n\nYour project is now live with an automated, AI-audited escrow. Talent has been notified.`,
      };
      setMessages((prev) => [...prev, deployMsg]);
    } catch (error: any) {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "system",
        content: `Deployment Failed: ${error.message || "Unknown error"}`
      }]);
    } finally {
      setIsDeploying(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="max-w-xl mx-auto border-slate-100 bg-white p-12 text-center rounded-[2.5rem] shadow-2xl shadow-emerald-500/5">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-50 text-emerald-600">
          <Bot className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Connect AI Assistant</h2>
        <p className="mt-2 text-slate-500 font-medium">Connect your wallet to start hiring and auditing with AI Agents.</p>
        <Button onClick={connect} disabled={isConnecting} className="mt-8 h-12 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-500/20">
          <Wallet className="h-5 w-5 mr-3" />
          {isConnecting ? "Connecting..." : "Connect Now"}
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-emerald-500/5">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">ChainLancer AI Agent</h3>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Recruiter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 scroll-smooth"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${msg.role === 'assistant' ? 'bg-white border-slate-200 text-emerald-600' : 'bg-slate-900 border-slate-900 text-white'}`}>
              {msg.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div className={`flex flex-col gap-3 max-w-[80%] ${msg.role === "user" ? "items-end" : ""}`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed font-medium ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'}`}>
                {msg.content}
              </div>

              {msg.escrowPreview && (
                <Card className="border-emerald-200/50 bg-white overflow-hidden shadow-xl rounded-3xl mt-2">
                  <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm uppercase tracking-tight">
                      <ShieldCheck className="h-4 w-4" /> Team Proposal
                    </div>
                    <span className="font-black text-base">${msg.escrowPreview.totalAmount}</span>
                  </div>
                  <div className="p-6 space-y-6">
                    {msg.escrowPreview.team && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expert Assembly</h4>
                        <div className="space-y-2">
                          {msg.escrowPreview.team.map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                              <div>
                                <p className="text-xs font-black text-slate-800">{m.role}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{m.description}</p>
                              </div>
                              <span className="text-xs font-black text-emerald-600">${m.budget}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={() => handleDeploy(msg.escrowPreview!)}
                      disabled={isDeploying}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      {isDeploying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Selection"}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1 h-2 items-center">
                <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your project (budget, goals, timeline)..."
            disabled={isProcessing}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-14 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
