'use client';

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Search, SlidersHorizontal, DollarSign, ShieldCheck,
    Briefcase, TrendingUp, Clock, Users, Loader2, Calendar,
    X, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getEscrows, subscribe, submitProposal, reloadEscrows, getProposalsByFreelancer, getProposalsForEscrow as getProposalsByEscrow } from "@/lib/escrow-store";
import Link from "next/link";
import { formatKite, ACTIVE_NETWORK } from "@/lib/kite-config";
import { useWallet } from "@/lib/wallet-context";
import { auditProposal } from "@/lib/ai";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


// ─── Categories (replaces dynamic tech stack chips) ──────────────────────────
const CATEGORIES = [
    "Graphics & Design",
    "Digital Marketing",
    "Writing & Translation",
    "Video & Animation",
    "Programming & Tech",
    "Business",
    "AI Services",
    "Music & Audio",
];

const PROGRAMMING_TECH_STACKS = [
    "Solidity", "Rust", "React", "Next.js", "Vue.js", "Angular",
    "Node.js", "Python", "TypeScript", "JavaScript", "Go", "Java",
    "Swift", "Kotlin", "Flutter", "React Native", "Hardhat", "Foundry",
    "Web3.js", "Ethers.js", "PostgreSQL", "MongoDB", "Redis", "GraphQL",
    "Docker", "Kubernetes", "AWS", "Supabase",
];

interface Filters {
    budgetMin: string; budgetMax: string;
    riskLevels: string[];
    deadline: string; techStack: string[];
}

const DEFAULT_FILTERS: Filters = {
    budgetMin: "", budgetMax: "",
    riskLevels: [],
    deadline: "any", techStack: [],
};

function countActiveFilters(f: Filters) {
    let n = 0;
    if (f.budgetMin || f.budgetMax) n++;
    if (f.riskLevels.length) n++;
    if (f.deadline !== "any") n++;
    if (f.techStack.length) n++;
    return n;
}

// ─── Proposal Modal ───────────────────────────────────────────────────────────
function ProposalModal({ job, onClose, onSubmit, isSubmitting }: {
    job: any; onClose: () => void;
    onSubmit: (content: string, portfolio: string) => void;
    isSubmitting: boolean;
}) {
    const [content, setContent] = useState("");
    const [portfolio, setPortfolio] = useState("");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-emerald-600 p-8 text-white">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Submit Proposal</h3>
                    <p className="text-emerald-100 text-sm mt-1 font-medium italic">Pitch yourself to the AI Agent and Employer</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cover Letter</label>
                            <Textarea placeholder="Why are you the best fit for this project? Mention your experience..."
                                className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-200"
                                value={content} onChange={(e) => setContent(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portfolio / GitHub URL</label>
                            <Input placeholder="https://github.com/your-repo"
                                className="h-12 rounded-2xl bg-slate-50 border-slate-200"
                                value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-slate-500">Cancel</Button>
                        <Button onClick={() => onSubmit(content, portfolio)}
                            disabled={!content || !portfolio || isSubmitting}
                            className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Proposal"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Inline Filter Panel ──────────────────────────────────────────────────────
function FilterPanel({ filters, onChange }: {
    filters: Filters;
    onChange: (f: Filters) => void;
}) {
    const [techInput, setTechInput] = useState("");
    const active = countActiveFilters(filters);

    const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
        <button onClick={onClick}
            className={cn("px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all",
                active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
            {label}
        </button>
    );

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Filters</p>
                    {active > 0 && (
                        <span className="h-5 w-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">{active}</span>
                    )}
                </div>
                {active > 0 && (
                    <button onClick={() => onChange(DEFAULT_FILTERS)}
                        className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">
                        Reset
                    </button>
                )}
            </div>

            <div className="px-5 py-5 space-y-6">
                {/* Budget */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget (AVAX)</p>
                    <div className="flex items-center gap-2">
                        <input value={filters.budgetMin}
                            onChange={e => onChange({ ...filters, budgetMin: e.target.value })}
                            placeholder="Min" type="number" min="0" step="0.01"
                            className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10" />
                        <span className="text-slate-400 text-xs shrink-0">—</span>
                        <input value={filters.budgetMax}
                            onChange={e => onChange({ ...filters, budgetMax: e.target.value })}
                            placeholder="Max" type="number" min="0" step="0.01"
                            className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10" />
                    </div>
                </div>

                {/* Risk Level */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Level</p>
                    <div className="flex flex-wrap gap-1.5">
                        {["Low", "Medium", "High"].map(r => (
                            <Chip key={r} label={r} active={filters.riskLevels.includes(r)}
                                onClick={() => onChange({ ...filters, riskLevels: filters.riskLevels.includes(r) ? filters.riskLevels.filter(x => x !== r) : [...filters.riskLevels, r] })} />
                        ))}
                    </div>
                </div>

                {/* Deadline */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</p>
                    <div className="flex flex-col gap-1.5">
                        {[{ val: "any", label: "Any" }, { val: "urgent", label: "Urgent (≤3d)" }, { val: "week", label: "This Week" }, { val: "month", label: "This Month" }].map(d => (
                            <button key={d.val} onClick={() => onChange({ ...filters, deadline: d.val })}
                                className={cn("px-3 py-2 rounded-xl text-[11px] font-black border transition-all text-left",
                                    filters.deadline === d.val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                    <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map(t => (
                            <Chip key={t} label={t} active={filters.techStack.includes(t)}
                                onClick={() => onChange({ ...filters, techStack: filters.techStack.includes(t) ? filters.techStack.filter(x => x !== t) : [...filters.techStack, t] })} />
                        ))}
                    </div>
                    {/* Sub tech stack — only show when Programming & Tech is selected */}
                    {filters.techStack.includes("Programming & Tech") && (
                        <div className="mt-2 space-y-2">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tech Stack</p>
                            <div className="flex flex-wrap gap-1.5">
                                {PROGRAMMING_TECH_STACKS.map(t => (
                                    <Chip key={t} label={t} active={filters.techStack.includes(t)}
                                        onClick={() => onChange({ ...filters, techStack: filters.techStack.includes(t) ? filters.techStack.filter(x => x !== t) : [...filters.techStack, t] })} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input value={techInput} onChange={e => setTechInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && techInput.trim()) {
                                    const t = techInput.trim();
                                    onChange({ ...filters, techStack: filters.techStack.includes(t) ? filters.techStack : [...filters.techStack, t] });
                                    setTechInput("");
                                }
                            }}
                            placeholder="Type + Enter"
                            className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10" />
                    </div>
                    {filters.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {filters.techStack.map(t => (
                                <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-bold">
                                    {t}
                                    <button onClick={() => onChange({ ...filters, techStack: filters.techStack.filter(x => x !== t) })}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function FindJobsPageInner() {
    const { isConnected, address, connect } = useWallet();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");
    const [escrows, setEscrows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [isScreening, setIsScreening] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [myProposalJobIds, setMyProposalJobIds] = useState<Set<string>>(new Set());
    const [proposalCounts, setProposalCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        setIsMounted(true);
        reloadEscrows().then(() => { setEscrows(getEscrows()); setIsLoading(false); });
        return subscribe(() => setEscrows(getEscrows()));
    }, []);

    useEffect(() => {
        if (!address) return;
        getProposalsByFreelancer(address).then(proposals =>
            setMyProposalJobIds(new Set(proposals.map((p: any) => p.escrow_id)))
        );
    }, [address]);

    // Fetch proposal counts for all visible jobs
    useEffect(() => {
        if (escrows.length === 0) return;
        const openJobs = escrows.filter(e => !e.worker || e.worker.trim() === "");
        Promise.all(
            openJobs.map(job =>
                getProposalsByEscrow(job.id).then(p => ({ id: job.id, count: p.length }))
            )
        ).then(results => {
            const counts: Record<string, number> = {};
            results.forEach(r => { counts[r.id] = r.count; });
            setProposalCounts(counts);
        });
    }, [escrows]);

    const appliedJobs = useMemo(() => {
        const status: Record<string, "hired" | "applied"> = {};
        escrows.forEach(job => {
            if (address && job.worker?.toLowerCase() === address.toLowerCase()) status[job.id] = "hired";
            else if (myProposalJobIds.has(job.id)) status[job.id] = "applied";
        });
        return status;
    }, [escrows, address, myProposalJobIds]);

    const filteredJobs = useMemo(() => {
        return escrows.filter(job => {
            const q = searchTerm.toLowerCase();
            if (q && !job.title?.toLowerCase().includes(q) && !job.description?.toLowerCase().includes(q)) return false;
            if (job.worker && job.worker.trim() !== "") return false;
            const amt = parseFloat(job.totalAmount ?? "0");
            if (filters.budgetMin && amt < parseFloat(filters.budgetMin)) return false;
            if (filters.budgetMax && amt > parseFloat(filters.budgetMax)) return false;
            if (filters.riskLevels.length && !filters.riskLevels.includes(job.riskLevel ?? "Low")) return false;
            if (filters.deadline !== "any" && job.deadline) {
                const daysLeft = Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000);
                if (filters.deadline === "urgent" && daysLeft > 3) return false;
                if (filters.deadline === "week" && daysLeft > 7) return false;
                if (filters.deadline === "month" && daysLeft > 30) return false;
            }
            if (filters.techStack.length) {
                const jobTech = (job.techStack ?? []).map((t: string) => t.toLowerCase());
                const jobText = `${job.title} ${job.description}`.toLowerCase();
                // Separate category filters from specific tech stack filters
                const categoryFilters = filters.techStack.filter(t => CATEGORIES.includes(t as any));
                const techFilters = filters.techStack.filter(t => !CATEGORIES.includes(t as any));
                // Category: exact match against jobTech
                const categoryMatch = categoryFilters.length === 0 || categoryFilters.some(t => jobTech.includes(t.toLowerCase()));
                // Specific tech: exact match only
                const techMatch = techFilters.length === 0 || techFilters.some(t => jobTech.includes(t.toLowerCase()));
                if (!categoryMatch || !techMatch) return false;
            }
            return true;
        });
    }, [escrows, searchTerm, filters]);

    const handleApply = async (jobId: string) => {
        if (!isConnected) { connect(); return; }
        const job = escrows.find(e => e.id === jobId);
        if (job && address && job.employer?.toLowerCase() === address.toLowerCase()) {
            toast.error("You cannot apply to your own project."); return;
        }
        setSelectedJob(job);
    };

    const submitProposalFlow = async (content: string, portfolio: string) => {
        if (!selectedJob || !address) return;
        setIsScreening(selectedJob.id);
        const proposalToast = toast.loading("AI Agent is vetting your proposal...");
        try {
            const result = await auditProposal(content, portfolio, selectedJob.description);
            await submitProposal({ escrowId: selectedJob.id, freelancer: address, content, portfolioUrl: portfolio, aiScore: result.score, aiFeedback: result.feedback });
            toast.success("Berhasil mengirim lamaran!", { description: `Skor AI: ${result.score}% - ${result.feedback}`, id: proposalToast });
            setProposalCounts(prev => ({ ...prev, [selectedJob.id]: (prev[selectedJob.id] ?? 0) + 1 }));
            setSelectedJob(null);
        } catch (e: any) {
            toast.error("Failed: " + e.message, { id: proposalToast });
        } finally { setIsScreening(null); }
    };

    const formatDate = (d: string) => {
        if (!isMounted) return "—";
        try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
        catch { return "—"; }
    };

    const activeFilterCount = countActiveFilters(filters);

    return (
        <div className="min-h-screen bg-slate-50/30">
            <div className="mx-auto max-w-7xl px-6 pt-6 pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Find Jobs</h1>
                        <p className="text-slate-500 font-medium mt-1">Browse the latest projects and apply to earn in {ACTIVE_NETWORK.nativeCurrency.symbol}.</p>
                    </div>
                    <div className="flex bg-white px-3 py-2 rounded-xl border border-slate-100 italic font-bold text-[10px] text-emerald-600 items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> AI VETTING ACTIVE
                    </div>
                </div>

                {/* Two-column layout */}
                <div className="flex gap-6 items-start">
                    {/* ── Left: Filter sidebar ── */}
                    <div className="hidden lg:block w-60 shrink-0 sticky top-6">
                        <FilterPanel filters={filters} onChange={setFilters} />
                    </div>

                    {/* ── Right: Search + Jobs ── */}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="text"
                                placeholder="Search for jobs (e.g. Solidity Developer, AI Auditor...)"
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm" />
                        </div>

                        {/* Results count */}
                        {!isLoading && (
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
                                </p>
                                {activeFilterCount > 0 && (
                                    <button onClick={() => setFilters(DEFAULT_FILTERS)}
                                        className="text-xs font-black text-red-400 hover:text-red-600 transition-colors">
                                        Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                                    </button>
                                )}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-32">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center gap-10">
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
                                    <p className="text-xl font-black text-slate-800 tracking-tight">
                                        {activeFilterCount > 0 ? "No jobs match your filters" : "No open jobs right now"}
                                    </p>
                                    <p className="text-slate-400 text-sm max-w-sm">
                                        {activeFilterCount > 0 ? "Try adjusting or clearing your filters." : "Be the first to post a project and get matched with top Web3 freelancers."}
                                    </p>
                                </div>
                                {activeFilterCount > 0 ? (
                                    <button onClick={() => setFilters(DEFAULT_FILTERS)}
                                        className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest transition-all">
                                        Clear Filters
                                    </button>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl text-left">
                                            {[
                                                { step: "01", title: "Describe Your Project", desc: "Chat with our AI assistant to scope your project and set a budget." },
                                                { step: "02", title: "Deploy on Avalanche", desc: "Your contract is created on-chain. Funds locked securely in escrow." },
                                                { step: "03", title: "Hire & Ship", desc: "Review proposals, hire the best freelancer, and release payment on delivery." },
                                            ].map(s => (
                                                <div key={s.step} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                                                    <p className="text-sm font-black text-slate-800 mb-2">
                                                        <span className="text-emerald-600 mr-1.5">{s.step}</span>{s.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <Link href="/chat">
                                            <button className="flex items-center gap-2 h-12 px-8 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95">
                                                Post a Project <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {filteredJobs.map(job => (
                                    <div key={job.id}
                                        className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {job.aiAuditResult && (
                                                        <Badge className="bg-emerald-600 text-white border-none font-black tracking-widest uppercase text-[9px] h-6 px-3 rounded-lg flex items-center gap-1.5">
                                                            <ShieldCheck className="w-3.5 h-3.5" /> AI AUDITED
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-3 h-7">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formatDate(job.createdAt)}</span>
                                                    </div>
                                                    {job.deadline && isMounted && (() => {
                                                        const daysLeft = Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000);
                                                        const isOverdue = daysLeft <= 0;
                                                        const isUrgent = daysLeft <= 3 && daysLeft > 0;
                                                        return (
                                                            <div className={`flex items-center gap-1.5 rounded-full px-3 h-7 border ${isOverdue ? "bg-red-50 border-red-200 text-red-500" : isUrgent ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                                                                <Calendar className="w-3 h-3" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                                    {isOverdue ? "Overdue" : isUrgent ? `${daysLeft}d left` : `Due ${new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase leading-tight tracking-tight">{job.title}</h2>
                                                <p className="text-slate-500 text-sm leading-relaxed font-medium">{job.description}</p>
                                                {job.employer && (
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        Posted by{" "}
                                                        <Link href={`/profile/${job.employer.toLowerCase()}`}
                                                            className="font-black text-slate-500 hover:text-emerald-600 transition-colors font-mono">
                                                            {job.employer.slice(0, 6)}...{job.employer.slice(-4)}
                                                        </Link>
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5 text-slate-900"><DollarSign className="w-4 h-4 text-emerald-600" />{formatKite(job.totalAmount)}</span>
                                                    <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-blue-500" />Fixed Price</span>
                                                    <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-amber-500" />{job.riskLevel || "Low"} Risk</span>
                                                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-300" />{proposalCounts[job.id] ?? 0} Proposal{(proposalCounts[job.id] ?? 0) !== 1 ? "s" : ""}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {(job.techStack?.length > 0 ? job.techStack : ["Web3", "Smart Contract", ACTIVE_NETWORK.chainName]).map((skill: string) => (
                                                        <Badge key={skill} variant="secondary"
                                                            className="bg-slate-50 text-slate-400 border-slate-100 font-black rounded-xl px-3 h-8 text-[10px] uppercase tracking-widest transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 cursor-pointer"
                                                            onClick={() => setFilters(f => ({ ...f, techStack: f.techStack.includes(skill) ? f.techStack : [...f.techStack, skill] }))}>
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="lg:w-40 shrink-0">
                                                <Button onClick={() => handleApply(job.id)}
                                                    disabled={!!appliedJobs[job.id] || !!isScreening}
                                                    className={cn(
                                                        "w-full rounded-2xl h-12 font-black tracking-widest text-xs uppercase transition-all active:scale-95",
                                                        appliedJobs[job.id] === "hired" ? "bg-emerald-600 text-white cursor-default"
                                                            : appliedJobs[job.id] === "applied" ? "bg-slate-200 text-slate-500 cursor-default"
                                                                : "bg-slate-900 hover:bg-emerald-600 text-white"
                                                    )}>
                                                    {isScreening === job.id
                                                        ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Screening...</span>
                                                        : appliedJobs[job.id] === "hired" ? "✓ Hired"
                                                            : appliedJobs[job.id] === "applied" ? "✓ Applied"
                                                                : "Apply Now"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedJob && (
                <ProposalModal job={selectedJob} onClose={() => setSelectedJob(null)}
                    onSubmit={submitProposalFlow} isSubmitting={!!isScreening} />
            )}
        </div>
    );
}

export default function FindJobsPage() {
    return <Suspense><FindJobsPageInner /></Suspense>;
}