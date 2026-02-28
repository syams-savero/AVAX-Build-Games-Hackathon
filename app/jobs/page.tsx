'use client';

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Search,
    SlidersHorizontal,
    DollarSign,
    ShieldCheck,
    Zap,
    Clock,
    ChevronDown,
    Briefcase,
    TrendingUp,
    MapPin,
    Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const JOBS = [
    {
        id: 1,
        title: "Senior Web3 Developer for DeFi Vault Integration",
        description: "Looking for an expert to help us integrate cross-chain yield vaults into our platform. Must be familiar with Avalanche primitives and AI-audited smart contracts.",
        company: "DeFi Protocol X",
        budget: "$8,000 - $12,000",
        type: "Fixed Price",
        time: "2 hours ago",
        difficulty: "Expert",
        aiVetted: true,
        skills: ["Solidity", "Avalanche", "Next.js", "AI Audit"],
        proposals: "12-15"
    },
    {
        id: 2,
        title: "Technical Content Writer - Blockchain & AI",
        description: "Write deep-dive articles about Autonomous AI Agents on Kite AI. Need someone who understands agentic workflows and on-chain reputation systems.",
        company: "AI Labs",
        budget: "$1,500",
        type: "Fixed Price",
        time: "5 hours ago",
        difficulty: "Intermediate",
        aiVetted: false,
        skills: ["Writing", "AI Agents", "Tokenomics"],
        proposals: "5-10"
    },
    {
        id: 3,
        title: "UI/UX Designer for Freelance Marketplace",
        description: "Design a clean, professional dashboard for our Web3 talent hub. Focus on 'Calm Tech' and emerald-themed minimal aesthetics.",
        company: "ChainLancer Core",
        budget: "$3,500 - $5,000",
        type: "Fixed Price",
        time: "1 day ago",
        difficulty: "Intermediate",
        aiVetted: true,
        skills: ["Figma", "UI Design", "Tailwind CSS"],
        proposals: "20+"
    }
];

export default function FindJobsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [appliedJobs, setAppliedJobs] = useState<Record<number, boolean>>({});

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-7xl p-8 pt-12 text-slate-900">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Find Jobs</h1>
                            <p className="text-slate-500 font-medium mt-1">Browse the latest projects and apply to earn in KITE.</p>
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 italic font-bold text-[10px] text-emerald-600 px-3 py-2 items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> AI VETTING ACTIVE
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search for jobs (e.g. Solidity Developer, AI Auditor...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="h-14 px-6 rounded-xl border-slate-200 font-black text-xs uppercase tracking-widest bg-white flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4" /> Filter
                            </Button>
                        </div>
                    </div>

                    {/* Job List */}
                    <div className="grid grid-cols-1 gap-6 pb-20">
                        {JOBS.map((job) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex-1 space-y-5">
                                        <div className="flex flex-wrap items-center gap-3">
                                            {job.aiVetted && (
                                                <Badge className="bg-emerald-600 text-white border-none font-black tracking-widest uppercase text-[9px] h-6 px-3 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> AI AGENT AUDITED
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className="text-[10px] font-black uppercase text-slate-400 p-0 hover:bg-transparent">Starting at</Badge>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" /> {job.time}
                                            </span>
                                        </div>

                                        <h2 className="text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase leading-tight tracking-tight">
                                            {job.title}
                                        </h2>

                                        <p className="text-slate-500 text-sm leading-relaxed max-w-4xl font-medium">
                                            {job.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            <div className="flex items-center gap-2 text-slate-900"><DollarSign className="w-4 h-4 text-emerald-600" /> {job.budget}</div>
                                            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> {job.type}</div>
                                            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> {job.difficulty}</div>
                                            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-300" /> {job.proposals} Proposals</div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {job.skills.map(skill => (
                                                <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-400 border-slate-100 font-black rounded-xl px-4 h-9 text-[10px] uppercase tracking-widest transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="lg:w-48">
                                        <Button
                                            onClick={() => setAppliedJobs(prev => ({ ...prev, [job.id]: true }))}
                                            disabled={appliedJobs[job.id]}
                                            className={cn(
                                                "w-full rounded-[1.5rem] h-14 font-black shadow-xl tracking-widest text-xs uppercase transition-all active:scale-95",
                                                appliedJobs[job.id]
                                                    ? "bg-slate-100 text-slate-400 shadow-none cursor-default"
                                                    : "bg-slate-900 hover:bg-emerald-600 text-white shadow-slate-900/10"
                                            )}
                                        >
                                            {appliedJobs[job.id] ? "Applied" : "Apply Now"}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
