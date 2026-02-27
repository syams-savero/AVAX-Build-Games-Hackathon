"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet } from "@/lib/wallet-context";
import { addEscrow } from "@/lib/escrow-store";
import { type Milestone, type TeamMember } from "@/lib/kite-config";
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
    "Welcome to ChainLancer AI Agent. I'm your autonomous project coordinator. \n\nI don't just create contracts; I analyze risks, assemble expert teams, and automate your entire project lifecycle on Kite AI. \n\n**What can I help you build today?**",
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
    const rawAmount = amountMatch ? amountMatch[1].replace(/,/g, "") : "100000";
    const totalAmount = parseInt(rawAmount);

    const isHighBudget = totalAmount >= 50000;

    // Default Team Assembly for high budget
    const team: TeamMember[] = isHighBudget ? [
      { role: "Lead Web3 Developer", description: "Architecture & Core Smart Contracts", budget: String(Math.floor(totalAmount * 0.5)) },
      { role: "Security Auditor", description: "Independent Audit & Bug Hunting", budget: String(Math.floor(totalAmount * 0.3)) },
      { role: "QA / UI Engineer", description: "Frontend Integration & Testing", budget: String(Math.floor(totalAmount * 0.2)) }
    ] : [];

    const milestones: Milestone[] = [
      {
        id: 1,
        title: "System Architecture & Security Audit",
        description: "Initial design and security verification of core primitives.",
        amount: String(Math.floor(totalAmount * 0.3)),
        status: "pending",
        earlyBonus: "5%"
      },
      {
        id: 2,
        title: "Core Implementation",
        description: "Functional delivery of the requested system features.",
        amount: String(Math.floor(totalAmount * 0.5)),
        status: "pending",
        earlyBonus: "10%"
      },
      {
        id: 3,
        title: "Final Audit & Public Deployment",
        description: "Final AI-driven audit result and public job posting.",
        amount: String(Math.floor(totalAmount * 0.2)),
        status: "pending"
      }
    ];

    return {
      title: lower.includes("accounting") ? "Enterprise Financial System" : "High-Scale Web3 Project",
      description: userInput,
      totalAmount: String(totalAmount),
      milestones,
      team: team.length > 0 ? team : undefined,
      riskLevel: totalAmount > 80000 ? "Medium" : "Low",
      duration: totalAmount > 50000 ? "4-6 Weeks" : "2 Weeks"
    };
  };

  const handleMagicDemo = async (userInput: string) => {
    setIsProcessing(true);

    // Turn 1: Consultation & Risk Analysis
    await new Promise(r => setTimeout(r, 1000));
    const consult: ConsultationResult = {
      riskLevel: "Low",
      budgetAnalysis: "Budget is optimal for a high-security Enterprise solution.",
      estimatedDuration: "45 Days (Optimized by AI Team Assembly)",
      advice: [
        "Use multi-signature escrow for high-budget milestones.",
        "Include 3 independent audit rounds.",
        "Implement performance-based bonuses (5-10%)."
      ]
    };

    const consultMsg: Message = {
      id: `consult-${Date.now()}`,
      role: "assistant",
      content: `I've analyzed your requirements for: "${userInput}".\n\n**AI Risk & Feasibility Assessment:**\n- **Risk:** ${consult.riskLevel}\n- **Budget:** ${consult.budgetAnalysis}\n- **Duration:** ${consult.estimatedDuration}`,
      consultationData: consult
    };
    setMessages(prev => [...prev, consultMsg]);

    // Simulation of AI "thinking" for team assembly
    await new Promise(r => setTimeout(r, 1500));

    const preview = generateTeamAndEscrow(userInput);
    const teamMsg: Message = {
      id: `team-${Date.now()}`,
      role: "assistant",
      content: `Based on the risk profile, I have **auto-assembled a specialized team** and drafted the smart contract primitives. \n\nThis setup ensures maximum security and milestone-based protection on Kite AI.`,
      escrowPreview: preview
    };

    setMessages(prev => [...prev, teamMsg]);
    setIsProcessing(false);
    setChatState("READY");
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
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const contract = addEscrow({
      title: preview.title,
      description: preview.description,
      employer: address || "0xMyAddress",
      worker: "AI Managed Team",
      totalAmount: preview.totalAmount,
      milestones: preview.milestones,
      status: "created",
      contractAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      team: preview.team,
      riskLevel: preview.riskLevel,
      duration: preview.duration,
      aiAuditResult: "PASSED - Optimized for Kite AI Gas"
    });

    const deployMsg: Message = {
      id: `deploy-${Date.now()}`,
      role: "system",
      content: `**Deployment Successful!** 🚀\n\n1. **Smart Contract:** [${contract.contractAddress}](https://testnet.kitescan.ai/address/${contract.contractAddress})\n2. **Team Assembly:** Lead Dev, Auditor & QA accounts linked.\n3. **Public Job Board:** Listed and broadcasted to competent freelancers.\n\nYour $${contract.totalAmount} budget is now locked in a secure, AI-audited escrow.`,
    };
    setMessages((prev) => [...prev, deployMsg]);
    setIsDeploying(false);
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md border-slate-200 bg-white p-8 text-center shadow-xl shadow-emerald-500/5">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Wallet className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Connect to ChainLancer</h2>
          <p className="mt-2 text-sm text-slate-500">
            Connect your wallet to experience the future of autonomous project management on Kite AI.
          </p>
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="mt-6 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 h-11"
          >
            <Wallet className="h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-4xl flex-col px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">ChainLancer AI</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Avalanche AI Auditor & Recruiter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto rounded-3xl border border-slate-200 bg-white/50 p-6 backdrop-blur-sm shadow-inner"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">How can I help you today?</h2>
              <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                I can help you assemble a specialized team and deploy an automated escrow on Kite AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
              {[
                { title: "Defi Yield Optimizer", desc: "Budget $50k, Lead Dev & Auditor required", icon: Zap },
                { title: "NFT Marketplace", desc: "Budget $120k, Full Team Assembly", icon: Globe },
                { title: "DEX Security Audit", desc: "Budget $30k, Senior Auditor Lead", icon: ShieldCheck },
                { title: "Web3 Wallet App", desc: "Budget $80k, QA & Backend Team", icon: Wallet },
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(`I want to build a ${s.title}. ${s.desc}.`)}
                  className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{s.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${msg.role === "user"
                  ? "bg-slate-900 text-white"
                  : msg.role === "system"
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-200 text-emerald-600"
                  }`}
              >
                {msg.role === "user" ? (
                  <User className="h-5 w-5" />
                ) : msg.role === "system" ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>

              {/* Content Container */}
              <div className={`flex-1 space-y-4 max-w-[85%] ${msg.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === "user" ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                  }`}>
                  {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <strong key={i} className="font-bold underline decoration-emerald-500/30">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>

                {/* Consultation Results */}
                {msg.consultationData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1 text-slate-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Risk Level</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{msg.consultationData.riskLevel}</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1 text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Timeline</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{msg.consultationData.estimatedDuration}</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1 text-slate-500">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Pricing</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">Dynamic</span>
                    </div>
                  </div>
                )}

                {/* Escrow Preview Card */}
                {msg.escrowPreview && (
                  <Card className="border-emerald-200 bg-white overflow-hidden shadow-xl shadow-emerald-500/5 transition-all animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-emerald-600 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="font-bold tracking-tight">AI Autonomous Contract</span>
                      </div>
                      <Badge variant="secondary" className="bg-white text-emerald-700 border-none font-bold">
                        ${msg.escrowPreview.totalAmount} KITE
                      </Badge>
                    </div>

                    <div className="p-5 space-y-6">
                      {/* Team assembly */}
                      {msg.escrowPreview.team && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-800">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">Team Assembly</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {msg.escrowPreview.team.map((member, i) => (
                              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/30">
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{member.role}</p>
                                  <p className="text-[10px] text-slate-500">{member.description}</p>
                                </div>
                                <span className="text-xs font-bold text-emerald-700">${member.budget}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Milestones */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-800">
                          <FileCode2 className="h-4 w-4 text-emerald-600" />
                          <h3 className="text-xs font-bold uppercase tracking-widest">Milestones & Game Theory</h3>
                        </div>
                        <div className="space-y-2">
                          {msg.escrowPreview.milestones.map((milestone) => (
                            <div key={milestone.id} className="relative pl-4 border-l-2 border-emerald-200 py-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">{milestone.title}</span>
                                <span className="text-xs font-bold text-emerald-600">${milestone.amount}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{milestone.description}</p>
                              {milestone.earlyBonus && (
                                <Badge className="mt-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 h-4 py-0 font-bold">
                                  <TrendingUp className="mr-1 h-2.5 w-2.5" /> EARLY BONUS: {milestone.earlyBonus}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDeploy(msg.escrowPreview!)}
                        disabled={isDeploying}
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl shadow-lg shadow-emerald-500/20"
                      >
                        {isDeploying ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            Deploying Smart Contract Team...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4" />
                            Confirm & Post to Jobs Board
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-sm font-bold text-emerald-600/80">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI Autonomous Assembly in progress...</span>
              </div>
              <div className="h-1.5 w-32 bg-emerald-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-6 flex gap-4 p-2 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-emerald-500/5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Build accounting system budget $100k..."
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="h-12 w-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
      <p className="text-[10px] text-center mt-3 text-slate-400 font-medium tracking-wide">
        Powered by <span className="text-emerald-600">ChainLancer Core Architecture</span> • Audited Primitives
      </p>
    </div>
  );
}

const Zap = ({ className, ...props }: any) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
