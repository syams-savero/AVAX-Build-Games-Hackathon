"use client";

import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Bot,
  Shield,
  Zap,
  Globe,
  Wallet,
  ShieldCheck,
  Users,
  Code2,
  Lock,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";

const stats = [
  { value: "AVAL", label: "Network" },
  { value: "<1s", label: "Finality" },
  { value: "0.01", label: "Avg Gas ($)" },
  { value: "100%", label: "Autonomous" },
];

const features = [
  {
    icon: Users,
    title: "Autonomous Team Assembly",
    description:
      "AI doesn't just hire; it assembles lead devs, auditors, and QA into coordinated teams based on your project budget.",
  },
  {
    icon: ShieldCheck,
    title: "Audited Primitives",
    description:
      "All escrow contracts use pre-audited security primitives to eliminate common smart contract vulnerabilities.",
  },
  {
    icon: Zap,
    title: "Dynamic Milestones",
    description:
      "Game theory-driven pricing: Auto-bonuses for early delivery and auto-penalties for delays, all managed on-chain.",
  },
  {
    icon: Bot,
    title: "AI Project Recruiter",
    description:
      "Our agent scans applicant competence in real-time and releases payments ONLY when technical requirements are met.",
  },
];

export function HeroSection() {
  const { isConnected, connect, isConnecting } = useWallet();

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[5%] h-[40%] w-[40%] rounded-full bg-emerald-50 blur-[100px] opacity-60" />
        <div className="absolute -right-[5%] top-[20%] h-[30%] w-[30%] rounded-full bg-blue-50 blur-[100px] opacity-40" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 lg:px-8 lg:pt-16">
        {/* Badge */}
        <div className="mb-6 flex justify-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Autonomous AI Recruiter is active
          </div>
        </div>

        {/* Heading */}
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="mx-auto max-w-5xl text-balance text-6xl font-black tracking-tight text-slate-900 sm:text-7xl lg:text-8xl">
            Autonomous <br className="hidden sm:block" />
            <span className="text-emerald-600 bg-clip-text">AI-Agent Agency</span> <br />
            on Avalanche.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg font-bold leading-relaxed text-slate-500 uppercase tracking-widest text-xs">
            Hire, Manage, & Settle Web3 Teams in 30 Seconds.
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-400">
            ChainLancer uses specialized AI Agents to handle the heavy lifting: from prompt-to-escrow deployment to team assembly and automated technical audits.
          </p>
        </div>

        {/* Path Selection CTA */}
        <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <Link href="/chat">
              <Button size="lg" className="relative h-16 gap-3 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white shadow-2xl font-black text-base transition-all hover:scale-105 active:scale-95">
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter mb-1">Employers</span>
                  <span className="flex items-center gap-2">Start Hiring <ArrowRight className="h-4 w-4" /></span>
                </div>
              </Button>
            </Link>
          </div>

          <Link href="/marketplace">
            <Button variant="outline" size="lg" className="h-16 gap-3 px-8 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-black text-base transition-all hover:border-emerald-500/50 active:scale-95">
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Freelancers</span>
                <span className="flex items-center gap-2">Find Work <Globe className="h-4 w-4" /></span>
              </div>
            </Button>
          </Link>
        </div>

        {/* Hero Visual Mockup - COMPACT LAYERED DESIGN */}
        <div className="mt-20 relative mx-auto max-w-5xl animate-in fade-in zoom-in duration-1000 delay-500">
          {/* Background Grid Accent */}
          <div className="absolute inset-0 bg-grid-slate-200 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-40" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Layer: Project Card */}
            <div className="lg:col-span-5 space-y-4 lg:translate-x-6 z-10">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl shadow-emerald-500/10">
                <div className="flex items-center justify-between mb-6">
                  <Badge className="bg-emerald-600 text-white border-none text-[10px] font-bold">ACTIVE EXECUTION</Badge>
                  <span className="text-xs font-bold text-slate-400">#8291</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Yield Optimizer V2</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">Autonomous project with multi-role assembly and Kite AI gas optimization enabled.</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5 font-bold text-[10px] uppercase tracking-widest">
                      <span className="text-slate-400">Milestone Progress</span>
                      <span className="text-emerald-600">65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Secured</p>
                      <p className="text-sm font-bold text-slate-900">$50,000</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Roles</p>
                      <p className="text-sm font-bold text-slate-900">3 Heads</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Layer: Live Team Assembly Visual */}
            <div className="lg:col-span-4 relative -mt-8 lg:mt-0">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-2xl text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">AI Team Assembled </span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { role: "Smart Contract Lead", rating: "99" },
                    { role: "Security Auditor", rating: "98" },
                    { role: "QA Engineer", rating: "95" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Bot className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold">{t.role}</span>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] font-black">{t.rating}%</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">Syncing...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Layer: Small Data Snippets */}
            <div className="lg:col-span-3 space-y-4 lg:-translate-x-6">
              <div className="bg-emerald-600 rounded-2xl p-4 shadow-xl text-white">
                <div className="flex items-center gap-3 mb-1">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-xs font-black uppercase tracking-widest">AI Audit</p>
                </div>
                <p className="text-lg font-black tracking-tight">PASSED</p>
                <p className="text-[10px] font-medium opacity-80">Security coverage 100%</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Release</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-black text-slate-900">$12,500</p>
                  <p className="text-xs font-bold text-emerald-600">IN 2D</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pain Points Section */}
        <div className="mt-40">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4 shadow-sm">The Pain Points</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Traditonal Freelance is Broken.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "High Fees", desc: "Traditional platforms take 10-20% of your budget for manual overhead.", icon: TrendingUp },
              { title: "Trust Gap", desc: "Risk of freelancers not being paid or clients receiving poor results.", icon: Shield },
              { title: "Manual Management", desc: "Hours spent vetting profiles and supervising execution daily.", icon: Clock },
              { title: "Security Risk", desc: "Unverified smart contracts lead to devastating vulnerabilities.", icon: AlertTriangle },
            ].map((p, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                  <p.icon className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{p.title}</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Row */}
        <div className="mx-auto mt-40">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4">The Solution</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Autonomous Orchestration.</h3>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-4 p-4"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mx-auto mt-40 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4 px-4 bg-slate-50/50 p-8 rounded-[40px] border border-slate-100 shadow-inner">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="relative text-center"
            >
              <p className="text-4xl font-black text-slate-900">{stat.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
