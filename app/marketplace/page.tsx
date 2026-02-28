'use client';

import { useState } from "react";
import {
    Search,
    SlidersHorizontal,
    Star,
    ChevronDown,
    ArrowRight,
    MapPin,
    ShieldCheck,
    Zap,
    Heart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const SERVICES = [
    {
        id: 1,
        title: "I will design a modern logo for your business",
        name: "Sarah Design",
        rank: "Top Rated",
        rating: 4.9,
        reviews: 328,
        price: "45",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=400&auto=format&fit=crop",
        aiVetted: true
    },
    {
        id: 2,
        title: "I will develop a responsive website using React",
        name: "Tech Solutions",
        rank: "Level 2",
        rating: 5.0,
        reviews: 156,
        price: "150",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop",
        aiVetted: true
    },
    {
        id: 3,
        title: "I will create engaging social media content",
        name: "Marketing Pro",
        rank: "Top Rated",
        rating: 4.8,
        reviews: 213,
        price: "75",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop",
        aiVetted: false
    },
    {
        id: 4,
        title: "I will edit your video professionally",
        name: "Video Master",
        rank: "Level 2",
        rating: 4.9,
        reviews: 189,
        price: "120",
        image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=400&auto=format&fit=crop",
        aiVetted: true
    },
    {
        id: 5,
        title: "I will perform a security audit on your smart contract",
        name: "Crypto Audit",
        rank: "Pro",
        rating: 5.0,
        reviews: 89,
        price: "1,200",
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=400&auto=format&fit=crop",
        aiVetted: true
    },
    {
        id: 6,
        title: "I will write SEO optimized articles for your blog",
        name: "Content King",
        rank: "Level 1",
        rating: 4.7,
        reviews: 54,
        price: "35",
        image: "https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=400&auto=format&fit=crop",
        aiVetted: false
    }
];

export default function MarketplacePage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-7xl p-8 pt-12 text-slate-900">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Browse Services</h1>
                            <p className="text-slate-500 font-medium mt-1">Get your projects done by top-tier freelance experts.</p>
                        </div>
                        <div className="flex bg-emerald-50 text-emerald-700 p-3 rounded-2xl border border-emerald-100 items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">AI Matching Ready</span>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="What service are you looking for today?"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="h-14 px-6 rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-[0.2em] bg-white flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-slate-400" /> Options
                            </Button>
                        </div>
                    </div>

                    {/* Filters & Info */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-4">
                        <div className="flex flex-wrap gap-2">
                            {["Design", "Dev", "Writing", "AI", "Business"].map(tag => (
                                <Badge key={tag} variant="outline" className="bg-white border-slate-200 text-slate-400 font-bold px-3 py-1 rounded-lg hover:border-emerald-500 hover:text-emerald-700 cursor-pointer">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{SERVICES.length} results found</p>
                    </div>

                    {/* Services Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                        {SERVICES.map((s) => (
                            <motion.div
                                key={s.id}
                                whileHover={{ y: -8 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Card className="overflow-hidden border-slate-100 bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all group relative">
                                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                        <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-4 right-4">
                                            <button className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-900 shadow-lg hover:bg-emerald-500 hover:text-white transition-all">
                                                <Heart className="h-5 w-5" />
                                            </button>
                                        </div>
                                        {s.aiVetted && (
                                            <div className="absolute bottom-4 left-4 bg-emerald-600 text-white font-black text-[9px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 uppercase tracking-widest">
                                                <ShieldCheck className="w-3.5 h-3.5" /> AI AGENT AUDITED
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-300 border border-slate-50 uppercase text-xs">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 leading-none">{s.name}</h3>
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1 italic">{s.rank}</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-slate-700 leading-snug mb-4 group-hover:text-emerald-700 transition-colors line-clamp-2 h-10 tracking-tight">
                                            {s.title}
                                        </p>
                                        <div className="flex items-center gap-1 text-amber-500 mb-6">
                                            <Star className="h-4 w-4 fill-current" />
                                            <span className="text-sm font-black text-slate-900">{s.rating}</span>
                                            <span className="text-xs font-bold text-slate-300">({s.reviews})</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                            <span className="text-[10px] font-black uppercase text-slate-400 p-0">Starting at</span>
                                            <div className="text-2xl font-black text-slate-900 tracking-tighter">
                                                <span className="text-sm text-emerald-600 mr-1">$</span>
                                                {s.price}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
