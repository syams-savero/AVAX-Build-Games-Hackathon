// app/profile/[address]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { getProfile, type Profile } from "@/lib/profile-store";
import { getEscrows, reloadEscrows } from "@/lib/escrow-store";
import { shortenAddress, ACTIVE_NETWORK } from "@/lib/kite-config";
import type { EscrowContract } from "@/lib/kite-config";
import {
    ExternalLink, Github, Twitter, Globe, ShieldCheck,
    Briefcase, ArrowLeft, Loader2, Wallet, TrendingUp,
    CheckCircle2, Clock, Users, MessageSquare
} from "lucide-react";
import Link from "next/link";

// ─── Trust Score ──────────────────────────────────────────────────────────────
function calcTrustScore(myGigs: EscrowContract[]) {
    const completed = myGigs.filter((e) => e.status === "completed");
    const completionRate = myGigs.length > 0 ? completed.length / myGigs.length : 0;
    const auditPassCount = completed.filter((e) => e.aiAuditResult?.includes("PASS")).length;
    const auditPassRate = completed.length > 0 ? auditPassCount / completed.length : 0;
    const activityBonus = Math.min(15, myGigs.length * 5);
    return myGigs.length === 0 ? 0
        : Math.min(100, Math.round(completionRate * 60 + auditPassRate * 25 + activityBonus));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function WalletAvatar({ address }: { address: string }) {
    return (
        <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <span className="text-xl font-black text-slate-600">{address.slice(2, 4).toUpperCase()}</span>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
    );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────
function StatBox({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
    return (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
            <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl font-black text-slate-900">{value}</span>
                {unit && <span className="text-[10px] font-bold text-slate-400">{unit}</span>}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const params = useParams();
    const address = (params?.address as string ?? "").toLowerCase();
    const { address: connectedAddress } = useWallet();
    const isOwnProfile = connectedAddress?.toLowerCase() === address;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [escrows, setEscrows] = useState<EscrowContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"freelancer" | "employer">("freelancer");

    useEffect(() => {
        if (!address) return;
        Promise.all([
            getProfile(address),
            reloadEscrows().then(() => getEscrows()),
        ]).then(([prof, allEscrows]) => {
            setProfile(prof);
            setEscrows(allEscrows);
            setLoading(false);
        });
    }, [address]);

    // ── Freelancer stats ──
    const asFreelancer = escrows.filter((e) => e.worker?.toLowerCase() === address);
    const freelancerCompleted = asFreelancer.filter((e) => e.status === "completed");
    const totalEarned = freelancerCompleted.reduce((acc, e) => acc + parseFloat(e.totalAmount || "0"), 0);
    const trustScore = calcTrustScore(asFreelancer);
    const trustLabel = trustScore >= 80 ? "Elite" : trustScore >= 60 ? "Trusted" : trustScore >= 30 ? "Rising" : "New";
    const trustColor = trustScore >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : trustScore >= 60 ? "text-blue-700 bg-blue-50 border-blue-200"
            : trustScore >= 30 ? "text-amber-700 bg-amber-50 border-amber-200"
                : "text-slate-500 bg-slate-50 border-slate-200";

    // ── Employer stats ──
    const asEmployer = escrows.filter((e) => e.employer?.toLowerCase() === address);
    const employerCompleted = asEmployer.filter((e) => e.status === "completed");
    const totalSpent = employerCompleted.reduce((acc, e) => acc + parseFloat(e.totalAmount || "0"), 0);
    const activeJobs = asEmployer.filter((e) => e.status !== "completed" && e.status !== "cancelled").length;

    const isFreelancer = asFreelancer.length > 0;
    const isEmployer = asEmployer.length > 0;

    // Auto-set tab to whichever role has activity
    useEffect(() => {
        if (!loading) {
            if (!isFreelancer && isEmployer) setActiveTab("employer");
        }
    }, [loading, isFreelancer, isEmployer]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
    );

    const displayName = profile?.name || shortenAddress(address);

    return (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-5">
            {/* Back */}
            <Link href="/jobs" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Jobs
            </Link>

            {/* ── Header Card ── */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 space-y-5">
                {/* Identity row */}
                <div className="flex items-start gap-5">
                    <WalletAvatar address={address} />
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-xl font-black text-slate-900">{displayName}</h1>
                            {isFreelancer && (
                                <span className={`px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${trustColor}`}>
                                    <ShieldCheck className="inline h-3 w-3 mr-1" />{trustLabel}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono">{address.slice(0, 10)}...{address.slice(-6)}</p>

                        {/* Role badges */}
                        <div className="flex items-center gap-2 pt-0.5">
                            {isFreelancer && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                                    <Briefcase className="h-2.5 w-2.5" /> Freelancer
                                </span>
                            )}
                            {isEmployer && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[9px] font-black text-blue-700 uppercase tracking-widest">
                                    <Users className="h-2.5 w-2.5" /> Employer
                                </span>
                            )}
                            {!isFreelancer && !isEmployer && (
                                <span className="text-xs text-slate-400 italic">No on-chain activity yet</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bio */}
                {profile?.bio && (
                    <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                    {isOwnProfile ? (
                        <Link href="/profile/me"
                            className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all">
                            Edit Profile
                        </Link>
                    ) : (
                        <Link href={`/messages?dm=${address}`}
                            className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all">
                            <MessageSquare className="h-3.5 w-3.5" /> Message
                        </Link>
                    )}
                </div>

                {/* Skills */}
                {profile?.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((s) => (
                            <span key={s} className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">{s}</span>
                        ))}
                    </div>
                )}

                {/* Social links */}
                {(profile?.githubUrl || profile?.twitterUrl || profile?.portfolioUrl) && (
                    <div className="flex items-center gap-4 pt-1 flex-wrap">
                        {profile.githubUrl && (
                            <a href={profile.githubUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                                <Github className="h-3.5 w-3.5" /> GitHub
                            </a>
                        )}
                        {profile.twitterUrl && (
                            <a href={profile.twitterUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                                <Twitter className="h-3.5 w-3.5" /> Twitter
                            </a>
                        )}
                        {profile.portfolioUrl && (
                            <a href={profile.portfolioUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                                <Globe className="h-3.5 w-3.5" /> Portfolio
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* ── Tab switcher (only show if both roles active) ── */}
            {isFreelancer && isEmployer && (
                <div className="flex bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-200">
                    <button
                        onClick={() => setActiveTab("freelancer")}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === "freelancer" ? "bg-white text-emerald-700 shadow-md border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        Freelancer
                    </button>
                    <button
                        onClick={() => setActiveTab("employer")}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === "employer" ? "bg-white text-blue-700 shadow-md border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        Employer
                    </button>
                </div>
            )}

            {/* ── Freelancer Section ── */}
            {(activeTab === "freelancer" || !isEmployer) && isFreelancer && (
                <div className="bg-white border border-slate-200 rounded-3xl p-7 space-y-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-emerald-500" /> Freelancer Stats
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        <StatBox label="Total Earned" value={totalEarned.toFixed(3)} unit="AVAX" />
                        <StatBox label="Jobs Completed" value={freelancerCompleted.length} unit={`of ${asFreelancer.length}`} />
                        <StatBox label="Trust Score" value={trustScore} unit="/ 100" />
                    </div>

                    {/* Trust bar */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Score Progress</span>
                            <span className="text-[10px] font-black text-slate-600">{trustScore}/100</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${trustScore}%` }} />
                        </div>
                    </div>

                    {/* Completed jobs */}
                    {freelancerCompleted.length > 0 && (
                        <div className="space-y-1 pt-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Completed Projects</p>
                            {freelancerCompleted.map((e) => (
                                <div key={e.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-slate-800">{e.title}</p>
                                        <div className="flex items-center gap-3">
                                            {e.aiAuditResult?.includes("PASS") && (
                                                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                                    <ShieldCheck className="h-3 w-3" /> AI Verified
                                                </span>
                                            )}
                                            {e.contractAddress && (
                                                <a href={`${ACTIVE_NETWORK.blockExplorerUrl}/tx/${e.contractAddress}`}
                                                    target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                                                    <ExternalLink className="h-2.5 w-2.5" /> On-Chain
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-emerald-600 shrink-0">{e.totalAmount} AVAX</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Employer Section ── */}
            {(activeTab === "employer" || !isFreelancer) && isEmployer && (
                <div className="bg-white border border-slate-200 rounded-3xl p-7 space-y-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-blue-500" /> Employer Stats
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        <StatBox label="Jobs Posted" value={asEmployer.length} />
                        <StatBox label="Completed" value={employerCompleted.length} unit={`of ${asEmployer.length}`} />
                        <StatBox label="Total Spent" value={totalSpent.toFixed(3)} unit="AVAX" />
                    </div>

                    {/* Posted jobs */}
                    {asEmployer.length > 0 && (
                        <div className="space-y-1 pt-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Posted Projects</p>
                            {asEmployer.map((e) => (
                                <div key={e.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-slate-800">{e.title}</p>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${e.status === "completed" ? "text-emerald-600"
                                                : e.status === "cancelled" ? "text-slate-400"
                                                    : "text-amber-600"
                                            }`}>
                                            {e.status === "completed" ? "✓ Completed"
                                                : e.status === "cancelled" ? "Cancelled"
                                                    : e.status === "created" ? "Open"
                                                        : "In Progress"}
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-slate-700 shrink-0">{e.totalAmount} AVAX</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* No activity at all */}
            {!isFreelancer && !isEmployer && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
                    <Wallet className="h-8 w-8 text-slate-200 mx-auto" />
                    <p className="text-sm font-bold text-slate-400">No on-chain activity found for this address.</p>
                    <p className="text-xs text-slate-300">They may not have started using ChainLancer yet.</p>
                </div>
            )}
        </div>
    );
}