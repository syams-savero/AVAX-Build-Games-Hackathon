'use client';

import { Sidebar } from "@/components/sidebar";
import {
    Star,
    MapPin,
    ShieldCheck,
    Globe,
    Github,
    Twitter,
    Linkedin,
    Clock,
    Briefcase,
    History,
    TrendingUp,
    Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function FreelancerProfile() {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="flex-1 ml-64 p-8 pt-24 text-slate-900">
                <div className="max-w-5xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 mb-8 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-32 h-32 rounded-[2rem] bg-emerald-600 flex items-center justify-center text-5xl font-black text-white shadow-xl shadow-emerald-600/20">
                                DS
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                                            DesignSavant
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black tracking-tight rounded-lg flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" /> VERIFIED AGENT
                                            </Badge>
                                        </h1>
                                        <p className="text-lg font-bold text-slate-500 mt-1">Senior Product Designer & Web3 Architect</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="outline" className="rounded-xl border-slate-200 font-bold h-12">Message</Button>
                                        <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold h-12 px-8 shadow-lg shadow-emerald-500/20">Invite to Project</Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 mt-6 text-sm font-bold text-slate-400">
                                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Indonesia / Remote</div>
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                        <Star className="w-4 h-4 fill-current" /> 4.9 (12 reviews)
                                    </div>
                                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 23 Projects Completed</div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-100"><Github className="w-5 h-5" /></button>
                                    <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-100"><Twitter className="w-5 h-5" /></button>
                                    <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-100"><Linkedin className="w-5 h-5" /></button>
                                    <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-100"><Globe className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 mb-4">About</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">
                                    Specialized in building high-end Web3 interfaces and complex AI agent dashboards. I focus on 'Calm Tech' principles—making sure users feel empowered, not overwhelmed.
                                    <br /><br />
                                    Experienced with Avalanche primitives, Kite AI agentic workflows, and professional minimal aesthetics. I translate technical complexity into stunning interactive experiences.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Work History (AI-Audited)</h3>
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-black text-slate-900">DeFi Liquid Staking Dashboard</h4>
                                            <span className="text-emerald-600 font-black text-sm">$4,200</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] h-5">COMPLETED</Badge>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">March 2026</span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                                            "DesignSavant deliver high-quality frames. AI Audit passed milestone 1 & 2 without any issues. Performance index remains at 99.2%."
                                        </p>
                                    </div>
                                ))}
                            </section>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-8">
                            <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">On-chain Metrics</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs"><History className="w-4 h-4" /> Completion Rate</div>
                                        <span className="font-black text-emerald-600 text-sm">100%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs"><TrendingUp className="w-4 h-4" /> Recommendation</div>
                                        <span className="font-black text-emerald-600 text-sm">9.8/10</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs"><Award className="w-4 h-4" /> AI Accuracy</div>
                                        <span className="font-black text-indigo-600 text-sm">99.9%</span>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {["UI Design", "Figma", "Web3", "Next.js", "React", "Tailwind", "AI Agentic UX"].map(s => (
                                        <Badge key={s} variant="secondary" className="bg-slate-50 text-slate-500 border-slate-100 font-bold rounded-lg">{s}</Badge>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
