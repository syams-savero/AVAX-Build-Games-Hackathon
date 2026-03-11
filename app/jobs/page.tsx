'use client';

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Search,
    SlidersHorizontal,
    DollarSign,
    ShieldCheck,
    Briefcase,
    TrendingUp,
    Clock,
    Users,
    Loader2,
    Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getEscrows, subscribe, submitProposal, reloadEscrows, getProposalsByFreelancer } from "@/lib/escrow-store";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatKite, ACTIVE_NETWORK } from "@/lib/kite-config";
import { useWallet } from "@/lib/wallet-context";
import { auditProposal } from "@/lib/ai";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProposalModalProps {
    job: any;
    onClose: () => void;
    onSubmit: (content: string, portfolio: string) => void;
    isSubmitting: boolean;
}

function ProposalModal({ job, onClose, onSubmit, isSubmitting }: ProposalModalProps) {
    const [content, setContent] = useState("");
    const [portfolio, setPortfolio] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-emerald-600 p-8 text-white">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Submit Proposal</h3>
                    <p className="text-emerald-100 text-sm mt-1 font-medium italic">
                        Pitch yourself to the AI Agent and Employer
                    </p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Cover Letter
                            </label>
                            <Textarea
                                placeholder="Why are you the best fit for this project? Mention your experience..."
                                className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-200 focus:ring-emerald-500/10"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Portfolio / GitHub URL
                            </label>
                            <Input
                                placeholder="https://github.com/your-repo"
                                className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus:ring-emerald-500/10"
                                value={portfolio}
                                onChange={(e) => setPortfolio(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl font-bold text-slate-500"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => onSubmit(content, portfolio)}
                            disabled={!content || !portfolio || isSubmitting}
                            className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Proposal"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FindJobsPage() {
    const { isConnected, address, connect } = useWallet();
    const [searchTerm, setSearchTerm] = useState("");

    // ✅ Fix 1: Start kosong — jangan load di server, cegah cache bocor antar env
    const [escrows, setEscrows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ✅ Fix 2: isMounted untuk cegah hydration mismatch di date formatting
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // ✅ Fix 3: Selalu fetch fresh dari Supabase saat mount
        reloadEscrows().then(() => {
            setEscrows(getEscrows());
            setIsLoading(false);
        });

        // Subscribe ke perubahan realtime
        const unsub = subscribe(() => {
            setEscrows(getEscrows());
        });

        return unsub;
    }, []);

    const [isScreening, setIsScreening] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [myProposalJobIds, setMyProposalJobIds] = useState<Set<string>>(new Set());

    // Load proposal yang sudah di-submit oleh freelancer ini
    useEffect(() => {
        if (!address) return;
        getProposalsByFreelancer(address).then((proposals) => {
            setMyProposalJobIds(new Set(proposals.map((p: any) => p.escrow_id)));
        });
    }, [address]);

    const appliedJobs = useMemo(() => {
        const status: Record<string, "hired" | "applied"> = {};
        escrows.forEach(job => {
            if (address && job.worker?.toLowerCase() === address.toLowerCase()) {
                status[job.id] = "hired";
            } else if (myProposalJobIds.has(job.id)) {
                status[job.id] = "applied";
            }
        });
        return status;
    }, [escrows, address, myProposalJobIds]);

    const filteredJobs = useMemo(() => {
        return escrows.filter(job =>
            (job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!job.worker || job.worker.trim() === "")
        );
    }, [escrows, searchTerm]);

    const handleApply = async (jobId: string) => {
        if (!isConnected) {
            connect();
            return;
        }
        const job = escrows.find(e => e.id === jobId);
        if (job && address && job.employer?.toLowerCase() === address.toLowerCase()) {
            toast.error("You cannot apply to your own project.");
            return;
        }
        setSelectedJob(job);
    };

    const submitProposalFlow = async (content: string, portfolio: string) => {
        if (!selectedJob || !address) return;

        setIsScreening(selectedJob.id);
        const proposalToast = toast.loading("AI Agent is vetting your proposal...");

        try {
            const result = await auditProposal(content, portfolio, selectedJob.description);

            await submitProposal({
                escrowId: selectedJob.id,
                freelancer: address,
                content,
                portfolioUrl: portfolio,
                aiScore: result.score,
                aiFeedback: result.feedback
            });

            toast.success("Berhasil mengirim lamaran!", {
                description: `Skor Kecocokan AI: ${result.score}% - ${result.feedback}`,
                id: proposalToast
            });

            setSelectedJob(null);
        } catch (e: any) {
            toast.error("Failed to submit: " + e.message, { id: proposalToast });
        } finally {
            setIsScreening(null);
        }
    };

    // ✅ Fix 4: Format tanggal pakai locale tetap, return placeholder sebelum mounted
    const formatDate = (dateStr: string) => {
        if (!isMounted) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        } catch {
            return "—";
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-7xl p-8 pt-12 text-slate-900">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Find Jobs</h1>
                            <p className="text-slate-500 font-medium mt-1">
                                Browse the latest projects and apply to earn in {ACTIVE_NETWORK.nativeCurrency.symbol}.
                            </p>
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 italic font-bold text-[10px] text-emerald-600 px-3 py-2 items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> AI VETTING ACTIVE
                        </div>
                    </div>

                    {/* Search & Filter */}
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
                            <Button
                                variant="outline"
                                className="h-14 px-6 rounded-xl border-slate-200 font-black text-xs uppercase tracking-widest bg-white flex items-center gap-2"
                            >
                                <SlidersHorizontal className="w-4 h-4" /> Filter
                            </Button>
                        </div>
                    </div>

                    {/* ✅ Fix 5: Loading state saat fetch awal */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-10">
                            {/* Illustration */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-emerald-50 to-slate-100 border border-emerald-100 flex items-center justify-center shadow-xl shadow-emerald-500/10">
                                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                        <rect x="8" y="16" width="48" height="36" rx="6" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1.5" />
                                        <rect x="16" y="24" width="20" height="3" rx="1.5" fill="#34d399" />
                                        <rect x="16" y="31" width="32" height="2" rx="1" fill="#a7f3d0" />
                                        <rect x="16" y="37" width="24" height="2" rx="1" fill="#a7f3d0" />
                                        <circle cx="48" cy="44" r="10" fill="#0f172a" />
                                        <path d="M44 44h8M48 40v8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xl font-black text-slate-800 tracking-tight">No open jobs right now</p>
                                <p className="text-slate-400 text-sm max-w-sm">Be the first to post a project and get matched with top Web3 freelancers.</p>
                            </div>

                            {/* How to Start steps */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl text-left">
                                {[
                                    { step: "01", icon: "💬", title: "Describe Your Project", desc: "Chat with our AI assistant to scope your project and set a budget." },
                                    { step: "02", icon: "🔗", title: "Deploy on Avalanche", desc: "Your contract is created on-chain. Funds locked securely in escrow." },
                                    { step: "03", icon: "🚀", title: "Hire & Ship", desc: "Review proposals, hire the best freelancer, and release payment on delivery." },
                                ].map((s) => (
                                    <div key={s.step} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{s.step}</span>
                                            <span className="text-xl">{s.icon}</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-800 mb-1">{s.title}</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <Link href="/chat">
                                <button className="flex items-center gap-2 h-12 px-8 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                                    Post a Project <ArrowRight className="h-4 w-4" />
                                </button>
                            </Link>
                        </div>
                    ) : (
                        /* ✅ Fix 6: Hapus motion.div — pakai div biasa + CSS transition */
                        <div className="grid grid-cols-1 gap-6 pb-20">
                            {filteredJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 group"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                        <div className="flex-1 space-y-5">
                                            <div className="flex flex-wrap items-center gap-3">
                                                {job.aiAuditResult && (
                                                    <Badge className="bg-emerald-600 text-white border-none font-black tracking-widest uppercase text-[9px] h-6 px-3 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> AI AGENT AUDITED
                                                    </Badge>
                                                )}
                                                <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-3 h-7">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        {formatDate(job.createdAt)}
                                                    </span>
                                                </div>
                                                {job.deadline && isMounted && (() => {
                                                    const dl = new Date(job.deadline);
                                                    const now = new Date();
                                                    const daysLeft = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                    const isOverdue = daysLeft <= 0;
                                                    const isUrgent = daysLeft <= 3 && daysLeft > 0;
                                                    return (
                                                        <div className={`flex items-center gap-1.5 rounded-full px-3 h-7 border ${isOverdue
                                                            ? "bg-red-50 border-red-200 text-red-500"
                                                            : isUrgent
                                                                ? "bg-amber-50 border-amber-200 text-amber-600"
                                                                : "bg-slate-100 border-slate-200 text-slate-500"
                                                            }`}>
                                                            <Calendar className="w-3 h-3" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                                {isOverdue
                                                                    ? "Overdue"
                                                                    : isUrgent
                                                                        ? `${daysLeft}d left`
                                                                        : `Due ${dl.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <h2 className="text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase leading-tight tracking-tight">
                                                {job.title}
                                            </h2>

                                            <p className="text-slate-500 text-sm leading-relaxed max-w-4xl font-medium">
                                                {job.description}
                                            </p>

                                            {job.employer && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                                    Posted by{" "}
                                                    <Link href={`/profile/${job.employer.toLowerCase()}`}
                                                        className="font-black text-slate-500 hover:text-emerald-600 transition-colors underline-offset-2 hover:underline font-mono">
                                                        {job.employer.slice(0, 6)}...{job.employer.slice(-4)}
                                                    </Link>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                <div className="flex items-center gap-2 text-slate-900">
                                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                                    {formatKite(job.totalAmount)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-blue-500" />
                                                    Fixed Price
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-amber-500" />
                                                    {job.riskLevel || "Low"} Risk
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-slate-300" />
                                                    0 Proposals
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-4">
                                                {(job.techStack?.length > 0
                                                    ? job.techStack
                                                    : ["Web3", "Smart Contract", ACTIVE_NETWORK.chainName]
                                                ).map((skill: string) => (
                                                    <Badge
                                                        key={skill}
                                                        variant="secondary"
                                                        className="bg-slate-50 text-slate-400 border-slate-100 font-black rounded-xl px-4 h-9 text-[10px] uppercase tracking-widest transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                                                    >
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="lg:w-48">
                                            <Button
                                                onClick={() => handleApply(job.id)}
                                                disabled={!!appliedJobs[job.id] || !!isScreening}
                                                className={cn(
                                                    "w-full rounded-[1.5rem] h-14 font-black shadow-xl tracking-widest text-xs uppercase transition-all active:scale-95",
                                                    appliedJobs[job.id] === "hired"
                                                        ? "bg-emerald-600 text-white shadow-none cursor-default"
                                                        : appliedJobs[job.id] === "applied"
                                                            ? "bg-slate-200 text-slate-500 shadow-none cursor-default"
                                                            : "bg-slate-900 hover:bg-emerald-600 text-white shadow-slate-900/10"
                                                )}
                                            >
                                                {isScreening === job.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" /> Screening...
                                                    </div>
                                                ) : appliedJobs[job.id] === "hired"
                                                    ? "✓ Hired"
                                                    : appliedJobs[job.id] === "applied"
                                                        ? "✓ Applied"
                                                        : "Apply Now"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {selectedJob && (
                <ProposalModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onSubmit={submitProposalFlow}
                    isSubmitting={!!isScreening}
                />
            )}
        </div>
    );
}