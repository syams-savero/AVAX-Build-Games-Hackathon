'use client';

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import {
    Search,
    SlidersHorizontal,
    MapPin,
    Clock,
    DollarSign,
    ShieldCheck,
    Zap,
    Star,
    ChevronRight
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
        budget: "$8,000 - $12,000",
        experience: "Expert",
        time: "2 hours ago",
        difficulty: "High",
        aiVetted: true,
        skills: ["Solidity", "Avalanche", "Next.js", "AI Audit"],
        tags: ["Pinned", "High Budget"]
    },
    {
        id: 2,
        title: "Technical Content Writer - Blockchain & AI",
        description: "Write deep-dive articles about Autonomous AI Agents on Kite AI. Need someone who understands agentic workflows and on-chain reputation systems.",
        budget: "$1,500",
        experience: "Intermediate",
        time: "5 hours ago",
        difficulty: "Low",
        aiVetted: false,
        skills: ["Writing", "AI Agents", "Tokenomics"],
        tags: ["Fast Payment"]
    },
    {
        id: 3,
        title: "UI/UX Designer for Freelance Marketplace",
        description: "Design a clean, professional dashboard for our Web3 talent hub. Focus on 'Calm Tech' and emerald-themed minimal aesthetics.",
        budget: "$3,500 - $5,000",
        experience: "Intermediate",
        time: "1 day ago",
        difficulty: "Medium",
        aiVetted: true,
        skills: ["Figma", "UI Design", "Tailwind CSS"],
        tags: ["Design"]
    }
];

export default function MarketplacePage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="flex-1 ml-64 p-8 pt-24 text-slate-900">
                <div className="max-w-5xl mx-auto">
                    {/* Marketplace Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900">Marketplace</h1>
                            <p className="text-slate-500 font-medium mt-1">Discover high-quality Web3 projects vetted by AI.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl border-slate-200 font-bold h-12 gap-2">
                                <SlidersHorizontal className="w-4 h-4" /> Filters
                            </Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold h-12 px-8 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                My Feed
                            </Button>
                        </div>
                    </div>

                    {/* Search Area */}
                    <div className="relative mb-12">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search for jobs (e.g. Solidity Developer, AI Auditor...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                        />
                    </div>

                    {/* Job List */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Recommended Jobs</h3>

                        {JOBS.map((job) => (
                            <motion.div
                                key={job.id}
                                whileHover={{ y: -2 }}
                                className="group relative bg-white border border-slate-200 p-8 rounded-3xl transition-all hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {job.aiVetted && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold tracking-tight rounded-lg flex items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3" /> AI Vetted
                                                </Badge>
                                            )}
                                            {job.tags.map(tag => (
                                                <Badge key={tag} variant="secondary" className="bg-slate-50 text-slate-500 border-slate-100 font-bold rounded-lg px-2">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>

                                        <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                                            {job.title}
                                        </h2>

                                        <p className="text-slate-500 text-sm leading-relaxed max-w-3xl line-clamp-2">
                                            {job.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-400 tracking-tight">
                                            <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-600" /> {job.budget}</div>
                                            <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> {job.difficulty} Priority</div>
                                            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {job.time}</div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {job.skills.map(skill => (
                                                <span key={skill} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="lg:w-48 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                                        <div className="flex items-center gap-1 text-emerald-600 mb-2">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="text-lg font-black">4.9</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Employer Rating</p>
                                        <button className="mt-4 text-emerald-600 text-sm font-black flex items-center gap-1 group/btn">
                                            Apply Now <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <Button variant="ghost" className="text-slate-400 font-bold hover:text-emerald-600">
                            Load more opportunities
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
