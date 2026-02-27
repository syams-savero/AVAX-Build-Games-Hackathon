'use client';

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import {
    Briefcase,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    ShieldCheck,
    Search,
    SlidersHorizontal,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    },
    {
        id: "0xf921...c338",
        title: "Frontend Integration",
        client: "NFT Marketplace",
        budget: "1,800.00 KITE",
        status: 'pending',
        milestones: [
            { label: "Wagmi Setup", status: "pending" },
            { label: "Gallery Logic", status: "pending" },
        ],
        lastUpdate: "Just now",
        aiAudit: "Pending Client Funding."
    }
];

export default function MyContracts() {
    const [activeTab, setActiveTab] = useState<ContractStatus>('active');

    const filteredContracts = contracts.filter(c => c.status === activeTab);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="flex-1 ml-64 p-8 pt-24 text-slate-900">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900">My Contracts</h1>
                            <p className="text-slate-500 font-medium mt-2">Kelola project, milestone, dan pembayaran escrow Anda.</p>
                        </div>
                        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
                            {(['active', 'completed', 'pending'] as ContractStatus[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                        activeTab === tab
                                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </header>

                    {/* List */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {filteredContracts.length > 0 ? (
                                filteredContracts.map((contract, index) => (
                                    <motion.div
                                        key={contract.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:border-emerald-500/30 transition-all group"
                                    >
                                        <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                                            {/* Left: Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Badge className={cn(
                                                        "bg-slate-50 border-none font-black tracking-tighter rounded-lg h-6 px-3",
                                                        contract.status === 'active' ? "text-emerald-600" :
                                                            contract.status === 'completed' ? "text-indigo-600" : "text-amber-600"
                                                    )}>
                                                        {contract.id}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3" /> Updated {contract.lastUpdate}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase pr-4">{contract.title}</h3>
                                                <p className="text-slate-500 font-bold mt-1">Client: <span className="text-slate-900">{contract.client}</span></p>

                                                <div className="mt-6 flex flex-wrap gap-4">
                                                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Value</p>
                                                        <p className="font-black text-slate-900">{contract.budget}</p>
                                                    </div>
                                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl px-4 py-3 flex-1 min-w-[200px]">
                                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                            <ShieldCheck className="w-3 h-3" /> AI Verification Log
                                                        </p>
                                                        <p className="text-[11px] font-bold text-emerald-800 leading-relaxed italic">{contract.aiAudit}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Milestones */}
                                            <div className="lg:w-64 space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Milestones</p>
                                                <div className="space-y-2">
                                                    {contract.milestones.map((m, i) => (
                                                        <div key={i} className="flex items-center justify-between text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-slate-600">{m.label}</span>
                                                            {m.status === 'completed' ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            ) : m.status === 'in-progress' ? (
                                                                <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex flex-row lg:flex-col gap-2">
                                                <Button className="flex-1 lg:flex-none bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black h-14 px-8 shadow-xl shadow-slate-900/10">
                                                    DETAILS
                                                </Button>
                                                <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 p-0 transition-all">
                                                    <ChevronRight className="w-6 h-6" />
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="bg-white border border-dashed border-slate-300 rounded-[2.5rem] p-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Briefcase className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-wider">No {activeTab} contracts found</h3>
                                    <p className="text-slate-400 font-bold mt-2">Mulai kontrak baru untuk melihat history Anda disini.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
