"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet } from "@/lib/wallet-context";
import { addEscrow } from "@/lib/escrow-store";
import { type Milestone, type TeamMember, ACTIVE_NETWORK } from "@/lib/kite-config";
import { chatWithAI, SYSTEM_PROMPT, type ChatMessage } from "@/lib/ai";
import { toast } from "sonner";
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
  totalAmount: string; // Always in AVAX (e.g. "0.5")
  team?: TeamMember[];
  riskLevel: "Low" | "Medium" | "High";
  deadline: string; // ISO date string, e.g. "2025-06-01" — wajib diisi AI
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
    "Welcome to ChainLancer AI. I'm your autonomous recruiter and project auditor. \n\nI analyze your needs, assemble expert teams, and secure your project lifecycle on the Avalanche network. \n\n**What can I help you build today?**\n\n💡 Tip: Mention your budget in AVAX and deadline, e.g. *\"Build a website, budget 0.5 AVAX, deadline March 30\"*",
};

// ─── MAX AVAX GUARD (testnet safety) ────────────────────────────────────────
const MAX_AVAX_TESTNET = 10;
const DEFAULT_AVAX_AMOUNT = "0.1";

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

  // ─── Parse AVAX amount from user message ──────────────────────────────────
  const parseAvaxAmount = (text: string): string => {
    const lower = text.toLowerCase();
    const avaxMatch = lower.match(/(\d+(?:\.\d+)?)\s*avax/);
    if (avaxMatch) {
      const val = parseFloat(avaxMatch[1]);
      if (!isNaN(val) && val > 0) {
        return String(Math.min(val, MAX_AVAX_TESTNET));
      }
    }
    return DEFAULT_AVAX_AMOUNT;
  };

  const handleMagicDemo = async (userInput: string) => {
    setIsProcessing(true);

    try {
      const chatMessages: ChatMessage[] = messages
        .filter(m => m.role !== "system")
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

      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*"action"\s*:\s*"DEPLOY_CONTRACT"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const rawJson = jsonMatch[1] || jsonMatch[0];
          const actionData = JSON.parse(rawJson);
          if (actionData.action === "DEPLOY_CONTRACT") {
            const rawPreview = actionData.data as EscrowPreview;

            // Pastikan deadline valid ISO date, fallback 30 hari dari sekarang
            let deadline = rawPreview.deadline;
            if (!deadline || isNaN(Date.parse(deadline))) {
              const fallback = new Date();
              fallback.setDate(fallback.getDate() + 30);
              deadline = fallback.toISOString().slice(0, 10);
            }

            newMsg.escrowPreview = {
              ...rawPreview,
              totalAmount: String(parseFloat(rawPreview.totalAmount || "0.1") || 0.1),
              deadline,
            };
            setChatState("READY");
          }
        } catch (e) {
          console.error("Failed to parse AI action JSON", e);
          newMsg.content += "\n\n*(Error parsing deployment configuration)*";
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
    const avaxAmount = parseFloat(preview.totalAmount);

    if (isNaN(avaxAmount) || avaxAmount <= 0) {
      toast.error("Invalid budget amount. Please specify a valid AVAX amount.");
      return;
    }

    if (avaxAmount > MAX_AVAX_TESTNET) {
      toast.error(
        `Budget ${avaxAmount} AVAX exceeds testnet limit of ${MAX_AVAX_TESTNET} AVAX. Please reduce your budget.`
      );
      return;
    }

    setIsDeploying(true);
    let deployToast = toast.loading("Initiating on-chain transaction...");

    try {
      const { createProjectOnChain, CONTRACT_ADDRESS, CONTRACT_ABI } = await import("@/lib/contract");
      const { ethers } = await import("ethers");

      console.log(`Deploying project with budget: ${avaxAmount} AVAX, deadline: ${preview.deadline}`);

      const { hash: txHash, onChainId: realOnChainId } = await createProjectOnChain(
        CONTRACT_ADDRESS,
        preview.title,
        preview.description,
        String(avaxAmount),
        30
      );

      toast.loading("Database syncing...", { id: deployToast });

      await addEscrow({
        title: preview.title,
        description: preview.description,
        employer: address || "0xAddress",
        worker: "",
        totalAmount: String(avaxAmount),
        milestones: (preview.milestones || []).map((m, idx) => ({
          ...m,
          id: m.id || idx + 1,
          status: m.status || "pending"
        })),
        status: "created",
        contractAddress: CONTRACT_ADDRESS,
        onChainId: realOnChainId,
        team: preview.team,
        riskLevel: preview.riskLevel,
        duration: preview.deadline,   // kolom DB tetap "duration", isinya sekarang ISO date
        techStack: (preview as any).techStack || [],
        aiAuditResult: ""
      });

      toast.success("Project live on Avalanche Fuji!", { id: deployToast });

      setMessages((prev) => [...prev, {
        id: `deploy-${Date.now()}`,
        role: "system",
        content: `**Project Created On-Chain!** 🚀\n\nProject ID: **#${realOnChainId}**\nBudget: **${avaxAmount} AVAX** (escrowed)\nDeadline: **${new Date(preview.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}**\nTransaction: [View on Explorer](${ACTIVE_NETWORK.blockExplorerUrl}/tx/${txHash})\n\nTokens have been escrowed. Talent can now find your job in the Board.`,
      }]);
    } catch (error: any) {
      toast.error("Transaction failed: " + error.message, { id: deployToast });
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "system",
        content: `Transaction Failed: ${error.message || "Unknown error"}`
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
            <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${msg.role === "assistant" ? "bg-white border-slate-200 text-emerald-600" : "bg-slate-900 border-slate-900 text-white"}`}>
              {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div className={`flex flex-col gap-3 max-w-[80%] ${msg.role === "user" ? "items-end" : ""}`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed font-medium ${msg.role === "user" ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm"}`}>
                {msg.content}
              </div>

              {msg.escrowPreview && (
                <Card className="border-slate-200 bg-white shadow-xl rounded-2xl w-[360px] md:w-[400px] mt-2 font-mono text-sm overflow-hidden border">
                  <div className="border-b border-dashed border-slate-300 p-6 flex flex-col items-center justify-center bg-slate-50">
                    <ShieldCheck className="h-8 w-8 text-slate-800 mb-2" />
                    <h3 className="font-bold text-slate-900 tracking-widest uppercase">SMART CONTRACT</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">RECEIPT / NOTA</p>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-slate-500 min-w-[80px]">PROJECT:</span>
                      <span className="text-slate-900 font-medium text-right">{msg.escrowPreview.title}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-slate-500 min-w-[80px]">DESC:</span>
                      <span className="text-slate-900 text-[11px] text-right opacity-80 line-clamp-2 md:line-clamp-3 leading-relaxed mt-0.5">{msg.escrowPreview.description}</span>
                    </div>
                    {/* Deadline — ganti dari DURATION */}
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-slate-500 min-w-[80px]">DEADLINE:</span>
                      <span className="text-slate-900 font-medium text-right uppercase">
                        {new Date(msg.escrowPreview.deadline).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </span>
                    </div>

                    {(msg.escrowPreview.team && msg.escrowPreview.team.length > 0) && (
                      <>
                        <div className="border-t border-dashed border-slate-300 my-4" />
                        <div className="text-slate-400 text-[10px] tracking-widest mb-2 uppercase">Team / Resources</div>
                        <div className="space-y-2">
                          {msg.escrowPreview.team.map((m, i) => (
                            <div key={i} className="flex justify-between items-start gap-4 text-xs">
                              <span className="text-slate-700">{i + 1}. {m.role}</span>
                              <span className="text-slate-900 font-bold">{m.budget} AVAX</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {(!msg.escrowPreview.team && msg.escrowPreview.milestones && msg.escrowPreview.milestones.length > 0) && (
                      <>
                        <div className="border-t border-dashed border-slate-300 my-4" />
                        <div className="text-slate-400 text-[10px] tracking-widest mb-2 uppercase">Milestones</div>
                        <div className="space-y-2">
                          {msg.escrowPreview.milestones.map((m, i) => (
                            <div key={i} className="flex justify-between items-start gap-4 text-xs">
                              <span className="text-slate-700 line-clamp-1 flex-1">{i + 1}. {m.title}</span>
                              <span className="text-slate-900 font-bold">{m.amount} AVAX</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {parseFloat(msg.escrowPreview.totalAmount) > 5 && (
                      <>
                        <div className="border-t border-dashed border-slate-300 my-4" />
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                          <p className="text-[10px] text-amber-700 font-bold leading-tight">
                            Large budget detected. Make sure you have enough AVAX.
                          </p>
                        </div>
                      </>
                    )}

                    <div className="border-t border-dashed border-slate-300 my-4" />
                    <div className="flex justify-between items-end gap-4 pt-1">
                      <span className="text-slate-500 uppercase tracking-widest text-xs">TOTAL DUE</span>
                      <span className="text-slate-900 font-black text-xl">{msg.escrowPreview.totalAmount} AVAX</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <Button
                      onClick={() => handleDeploy(msg.escrowPreview!)}
                      disabled={isDeploying}
                      className="w-full h-12 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest transition-all"
                    >
                      {isDeploying ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> PROCESSING...</>
                      ) : (
                        <>SIGN & AUTHORIZE</>
                      )}
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
            placeholder="Describe your project (budget in AVAX, deadline, goals)..."
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