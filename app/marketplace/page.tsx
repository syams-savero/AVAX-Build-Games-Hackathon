"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, ShieldCheck, Zap, ArrowRight, User } from "lucide-react";
import Link from "next/link";

const mockJobs = [
    {
        id: "J1",
        title: "Yield Optimizer V2 Lead",
        budget: "50,000",
        client: "0x82...1f2",
        tags: ["Solidity", "Avalanche", "Defi"],
        audit: "PASSED",
    },
    {
        id: "J2",
        title: "NFT Marketplace Audit",
        budget: "12,000",
        client: "0x44...9a1",
        tags: ["Security", "ERC-721"],
        audit: "PENDING",
    },
    {
        id: "J3",
        title: "Bridge Protocol Support",
        budget: "85,000",
        client: "0x11...ec4",
        tags: ["Cross-Chain", "DevOps"],
        audit: "PASSED",
    }
];

export default function MarketplacePage() {
    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">On-Chain Job Board</h1>
                    <p className="mt-2 text-slate-500 font-medium">Find specialized Web3 roles managed and secured by ChainLancer AI Agents.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {mockJobs.map((job) => (
                            <Card key={job.id} className="p-6 border border-slate-200 hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{job.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User className="h-3 w-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500">{job.client}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-emerald-600">${job.budget}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">USDC Budget</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {job.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px]">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className={`h-4 w-4 ${job.audit === 'PASSED' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Audit: {job.audit}</span>
                                    </div>
                                    <Button className="rounded-xl bg-slate-900 hover:bg-black text-white px-6 font-bold text-xs h-9">
                                        Apply for Gig
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6 bg-emerald-600 text-white border-none shadow-2xl shadow-emerald-500/20">
                            <h2 className="text-xl font-black mb-2">Want to Hire?</h2>
                            <p className="text-sm font-medium opacity-90 leading-relaxed mb-6">
                                Let our AI Agent assemble a team for you automatically. Deploy your first escrow in seconds.
                            </p>
                            <Link href="/chat">
                                <Button className="w-full bg-white text-emerald-700 hover:bg-slate-50 font-black rounded-xl h-12 shadow-lg">
                                    Start Hiring Now
                                </Button>
                            </Link>
                        </Card>

                        <Card className="p-6 border border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="h-5 w-5 text-emerald-600" />
                                <h3 className="font-bold text-slate-900">Partner Networks</h3>
                            </div>
                            <div className="space-y-3">
                                {["Avalanche L1", "Kite AI Core", "Tether WDK"].map(net => (
                                    <div key={net} className="flex items-center justify-between text-xs font-bold text-slate-500 p-2 rounded-lg bg-slate-50">
                                        {net}
                                        <ArrowRight className="h-3 w-3" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
