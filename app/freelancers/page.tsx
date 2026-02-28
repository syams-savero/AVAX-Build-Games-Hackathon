'use client';

import { useState } from "react";
import {
    Search,
    SlidersHorizontal,
    MapPin,
    Star,
    Bot,
    ChevronDown,
    MessageSquare,
    CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { AIChat } from "@/components/ai-chat";

const FREELANCERS = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Senior UI/UX Designer",
        location: "New York, USA",
        rate: "$85/hr",
        rating: 4.9,
        reviews: 127,
        jobs: 342,
        description: "Award-winning designer with 8+ years of experience creating beautiful and functional digital experiences.",
        skills: ["UI/UX Design", "Figma", "Adobe XD", "Prototyping"],
        topRated: true,
        avatar: "SJ"
    },
    {
        id: 2,
        name: "Michael Chen",
        role: "Full Stack Developer",
        location: "San Francisco, USA",
        rate: "$95/hr",
        rating: 5.0,
        reviews: 89,
        jobs: 156,
        description: "Experienced developer specializing in building scalable web applications and APIs.",
        skills: ["React", "Node.js", "Python", "AWS"],
        topRated: true,
        avatar: "MC"
    },
    {
        id: 3,
        name: "Emma Davis",
        role: "Digital Marketing Strategist",
        location: "London, UK",
        rate: "$75/hr",
        rating: 4.8,
        reviews: 156,
        jobs: 210,
        description: "Helping brands grow their online presence through data-driven marketing strategies.",
        skills: ["SEO", "SEM", "Social Media", "Content Strategy"],
        topRated: false,
        avatar: "ED"
    },
    {
        id: 4,
        name: "James Wilson",
        role: "Video Editor & Motion Designer",
        location: "Los Angeles, USA",
        rate: "$80/hr",
        rating: 4.9,
        reviews: 92,
        jobs: 145,
        description: "Creating engaging visual content that tells a story and captures the audience's attention.",
        skills: ["After Effects", "Premiere Pro", "Motion Graphics"],
        topRated: true,
        avatar: "JW"
    }
];

export default function FindTalentPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showAI, setShowAI] = useState(false);

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-7xl p-8 pt-12 text-slate-900">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Find Talent</h1>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search for freelancers or skills..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="h-14 px-6 rounded-xl border-slate-200 font-bold bg-white flex items-center gap-2">
                                All Categories <ChevronDown className="w-4 h-4 text-slate-400" />
                            </Button>
                            <Button variant="outline" className="h-14 px-6 rounded-xl border-slate-200 font-bold bg-white flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-slate-400" /> More Filters
                            </Button>
                        </div>
                    </div>

                    {/* AI Trigger */}
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setShowAI(!showAI)}
                            className={`h-11 px-6 rounded-xl font-bold gap-2 transition-all shadow-lg ${showAI ? 'bg-slate-900 text-white shadow-slate-500/10' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'}`}
                        >
                            <Bot className="w-4 h-4" />
                            {showAI ? "Close AI Recruiter" : "AI Agent Recruiter"}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {showAI && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mb-8"
                            >
                                <Card className="border-emerald-100 bg-emerald-50/10 p-2 rounded-3xl shadow-2xl shadow-emerald-500/5">
                                    <AIChat />
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Results Count & Sort */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                        <span className="text-sm font-bold text-slate-500">{FREELANCERS.length} freelancers available</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort by:</span>
                            <Button variant="ghost" className="h-9 px-3 font-bold text-slate-900 flex items-center gap-2 hover:bg-slate-50">
                                Recommended <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-hover:rotate-180" />
                            </Button>
                        </div>
                    </div>

                    {/* Talent List */}
                    <div className="grid grid-cols-1 gap-6 pb-20">
                        {FREELANCERS.map((talent) => (
                            <motion.div
                                key={talent.id}
                                whileHover={{ scale: 1.005 }}
                                className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group lg:flex items-start gap-8"
                            >
                                {/* Left: Avatar Image (Mock) */}
                                <div className="relative mb-6 lg:mb-0">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-400 border-4 border-white shadow-inner">
                                        {talent.avatar}
                                    </div>
                                    <div className="absolute bottom-1 right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="Online"></div>
                                </div>

                                {/* Center: Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                                {talent.name}
                                                {talent.topRated && (
                                                    <Badge className="bg-amber-400 hover:bg-amber-400 text-white border-none text-[10px] h-5 rounded-md font-black px-2 shadow-sm">
                                                        Top Rated
                                                    </Badge>
                                                )}
                                            </h3>
                                            <p className="text-base font-bold text-slate-500 mt-1">{talent.role}</p>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <span className="text-2xl font-black text-slate-900">{talent.rate}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Rate</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 mt-4 text-sm font-bold text-slate-400">
                                        <div className="flex items-center gap-2 tracking-tight">
                                            <MapPin className="w-4 h-4 text-slate-300" /> {talent.location}
                                        </div>
                                        <div className="flex items-center gap-2 tracking-tight text-emerald-600">
                                            <Star className="w-4 h-4 fill-current" /> {talent.rating} ({talent.reviews})
                                        </div>
                                        <div className="h-4 w-px bg-slate-200"></div>
                                        <div className="flex items-center gap-2 tracking-tight">
                                            <CheckCircle2 className="w-4 h-4 text-slate-300" /> {talent.jobs} jobs
                                        </div>
                                    </div>

                                    <p className="mt-5 text-slate-500 text-sm leading-relaxed max-w-2xl font-medium">
                                        {talent.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-6">
                                        {talent.skills.map(skill => (
                                            <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-500 border-slate-100 font-bold rounded-lg px-3 h-8 text-xs transition-colors hover:bg-emerald-50 hover:text-emerald-700">
                                                {skill}
                                            </Badge>
                                        ))}
                                        <Badge variant="ghost" className="text-slate-400 font-bold text-xs h-8">+1</Badge>
                                    </div>
                                </div>

                                {/* Right: Action */}
                                <div className="mt-8 lg:mt-0 lg:w-48 space-y-3">
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-black shadow-lg shadow-emerald-500/10 tracking-tight">
                                        Contact
                                    </Button>
                                    <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
                                        View Profile
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
