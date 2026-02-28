'use client';

import { useState } from "react";
import {
    Briefcase,
    Clock,
    CheckCircle2,
    ShieldCheck,
    ChevronRight,
    Search,
    SlidersHorizontal,
    TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ContractStatus = 'active' | 'completed' | 'pending';

const contracts = [
    {
        id: "0x8a23...f219",
        title: "Web3 Mobile App UI",
        client: "Acme Crypto",
        budget: "2,400.00 KITE",
        status: 'active',
        milestones: [
            { label: "Wireframes", status: "completed" },
            { label: "High-Fidelity UI", status: "in-progress" },
            { label: "Design System", status: "pending" },
        ],
        lastUpdate: "2 hours ago",
        aiAudit: "Verified: Milestone 1 passed security checks."
    },
    {
        id: "0xb412...d102",
        title: "Smart Contract Audit",
        client: "DeFi Protocol X",
        budget: "1,200.00 KITE",
        status: 'completed',
        milestones: [
            { label: "Static Analysis", status: "completed" },
            { label: "Dynamic Testing", status: "completed" },
            { label: "Final Report", status: "completed" },
        ],
        lastUpdate: "2 days ago",
        aiAudit: "Final Report issued and signed by Agent #23."
    }
];

export default function MyContracts() {
    const [activeTab, setActiveTab] = useState<ContractStatus>('active');
    const filteredContracts = contracts.filter(c => c.status === activeTab);

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-7xl p-8 pt-12 text-slate-900">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">My Contracts</h1>
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            {(['active', 'completed', 'pending'] as ContractStatus[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTab === tab
                                            ? "bg-white text-emerald-700 shadow-md border border-slate-100"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contracts List */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {filteredContracts.length > 0 ? (
                                filteredContracts.map((contract, index) => (
                                    <motion.div
                                        key={contract.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group lg:flex items-center gap-12"
                                    >
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px] h-5 rounded-md">
                                                    ID: {contract.id}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" /> Updated {contract.lastUpdate}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                                                {contract.title}
                                            </h3>
                                            <p className="text-sm font-bold text-slate-500 italic">Client: <span className="text-slate-900 not-italic">{contract.client}</span></p>

                                            <div className="flex flex-wrap gap-4 pt-4">
                                                <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 min-w-[140px]">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Value</p>
                                                    <p className="font-black text-slate-900">{contract.budget}</p>
                                                </div>
                                                <div className="bg-emerald-600 text-white rounded-2xl px-5 py-3 flex-1 min-w-[200px] shadow-lg shadow-emerald-600/10">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2 mb-1">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> AI Security Scan
                                                    </p>
                                                    <p className="text-xs font-bold leading-tight">{contract.aiAudit}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:w-64 space-y-4 mt-8 lg:mt-0">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">On-Chain Milestones</h4>
                                            <div className="space-y-2">
                                                {contract.milestones.map((m, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
                                                        <span className="text-slate-600">{m.label}</span>
                                                        {m.status === 'completed' ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-8 lg:mt-0 lg:w-32">
                                            <Button className="w-full lg:h-24 lg:w-24 rounded-[2rem] bg-slate-900 text-white hover:bg-emerald-600 transition-all font-black flex flex-col items-center justify-center gap-1 shadow-xl shadow-slate-900/10">
                                                VIEW
                                                <ChevronRight className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                                    <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No active contracts</h3>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
