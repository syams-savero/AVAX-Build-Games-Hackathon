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
    Github,
    Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getEscrows, subscribe, assignWorker, submitProposal } from "@/lib/escrow-store";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
            >
                <div className="bg-emerald-600 p-8 text-white">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Submit Proposal</h3>
                    <p className="text-emerald-100 text-sm mt-1 font-medium italic">Pitch yourself to the AI Agent and Employer</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cover Letter</label>
                            <Textarea
                                placeholder="Why are you the best fit for this project? Mention your experience..."
                                className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-200 focus:ring-emerald-500/10"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portfolio / GitHub URL</label>
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
            </motion.div>
        </div>
    );
}

export default function FindJobsPage() {
    const { isConnected, address, connect } = useWallet();
    const [searchTerm, setSearchTerm] = useState("");
    const [escrows, setEscrows] = useState(getEscrows());

    useEffect(() => {
        return subscribe(() => {
            setEscrows(getEscrows());
        });
    }, []);

    const appliedJobs = useMemo(() => {
        const status: Record<string, boolean> = {};
        escrows.forEach(job => {
            if (address && job.worker?.toLowerCase() === address.toLowerCase()) {
                status[job.id] = true;
            }
        });
        return status;
    }, [escrows, address]);

    const [isScreening, setIsScreening] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

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
            // 1. AI Screening
            const result = await auditProposal(content, portfolio, selectedJob.description);

            // 2. Save to Supabase
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


    const filteredJobs = useMemo(() => {
        return escrows.filter(job =>
            (job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!job.worker || job.worker.trim() === "") // Only show jobs without assigned workers
        );
    }, [escrows, searchTerm]);

    return (
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-7xl p-8 pt-12 text-slate-900">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Find Jobs</h1>
                            <p className="text-slate-500 font-medium mt-1">Browse the latest projects and apply to earn in {ACTIVE_NETWORK.nativeCurrency.symbol}.</p>
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
                        {filteredJobs.map((job) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex-1 space-y-5">
                                        <div className="flex flex-wrap items-center gap-3">
                                            {job.aiAuditResult && (
                                                <Badge className="bg-emerald-600 text-white border-none font-black tracking-widest uppercase text-[9px] h-6 px-3 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> AI AGENT AUDITED
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className="text-[10px] font-black uppercase text-slate-400 p-0 hover:bg-transparent">Starting at</Badge>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" /> {new Date(job.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h2 className="text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase leading-tight tracking-tight">
                                            {job.title}
                                        </h2>

                                        <p className="text-slate-500 text-sm leading-relaxed max-w-4xl font-medium">
                                            {job.description}
                                        </p>

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
                                            {(job.techStack || ["Web3", "Smart Contract", ACTIVE_NETWORK.chainName]).map((skill: string) => (
                                                <Badge key={skill} variant="secondary" className="bg-slate-50 text-slate-400 border-slate-100 font-black rounded-xl px-4 h-9 text-[10px] uppercase tracking-widest transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600">
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
                                                appliedJobs[job.id]
                                                    ? "bg-emerald-600 text-white shadow-none cursor-default"
                                                    : "bg-slate-900 hover:bg-emerald-600 text-white shadow-slate-900/10"
                                            )}
                                        >
                                            {isScreening === job.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Screening...
                                                </div>
                                            ) : appliedJobs[job.id] ? "Hired" : "Apply Now"}
                                        </Button>
                                    </div>
                                </div>

                            </motion.div>
                        ))}
                    </div>
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
