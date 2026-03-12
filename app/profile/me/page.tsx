// app/profile/me/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { getProfile, upsertProfile, type Profile } from "@/lib/profile-store";
import { getEscrows, reloadEscrows } from "@/lib/escrow-store";
import type { EscrowContract } from "@/lib/kite-config";
import { ACTIVE_NETWORK } from "@/lib/kite-config";
import {
    ArrowLeft, Github, Twitter, Globe, ShieldCheck,
    Briefcase, Users, Loader2, Save, X, ExternalLink, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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

// ─── My Profile Page ──────────────────────────────────────────────────────────
export default function MyProfilePage() {
    const { address, isConnected } = useWallet();
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [escrows, setEscrows] = useState<EscrowContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [skillInput, setSkillInput] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [github, setGithub] = useState("");
    const [twitter, setTwitter] = useState("");
    const [portfolio, setPortfolio] = useState("");

    useEffect(() => {
        if (!address) return;
        Promise.all([
            getProfile(address),
            reloadEscrows().then(() => getEscrows()),
        ]).then(([prof, allEscrows]) => {
            if (prof) {
                setName(prof.name);
                setBio(prof.bio);
                setSkills(prof.skills);
                setGithub(prof.githubUrl);
                setTwitter(prof.twitterUrl);
                setPortfolio(prof.portfolioUrl);
                setProfile(prof);
            }
            setEscrows(allEscrows);
            setLoading(false);
        });
    }, [address]);

    // Stats
    const asFreelancer = escrows.filter((e) => e.worker?.toLowerCase() === address?.toLowerCase());
    const asEmployer = escrows.filter((e) => e.employer?.toLowerCase() === address?.toLowerCase());
    const freelancerCompleted = asFreelancer.filter((e) => e.status === "completed");
    const employerCompleted = asEmployer.filter((e) => e.status === "completed");
    const totalEarned = freelancerCompleted.reduce((acc, e) => acc + parseFloat(e.totalAmount || "0"), 0);
    const totalSpent = employerCompleted.reduce((acc, e) => acc + parseFloat(e.totalAmount || "0"), 0);
    const trustScore = calcTrustScore(asFreelancer);
    const trustLabel = trustScore >= 80 ? "Elite" : trustScore >= 60 ? "Trusted" : trustScore >= 30 ? "Rising" : "New";
    const trustColor = trustScore >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : trustScore >= 60 ? "text-blue-700 bg-blue-50 border-blue-200"
            : trustScore >= 30 ? "text-amber-700 bg-amber-50 border-amber-200"
                : "text-slate-500 bg-slate-50 border-slate-200";

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !skills.includes(s) && skills.length < 10) {
            setSkills([...skills, s]);
            setSkillInput("");
        }
    };

    const handleSave = async () => {
        if (!address) return;
        setIsSaving(true);
        const result = await upsertProfile(address, {
            name, bio, skills,
            githubUrl: github,
            twitterUrl: twitter,
            portfolioUrl: portfolio,
        });
        if (result.success) {
            toast.success("Profile saved!");
        } else {
            toast.error(result.error ?? "Failed to save");
        }
        setIsSaving(false);
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-slate-500 font-bold">Connect your wallet to view your profile.</p>
                    <Link href="/" className="text-emerald-600 text-sm font-black hover:underline">← Go Home</Link>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
                </Link>
                <Link
                    href={`/profile/${address?.toLowerCase()}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors"
                >
                    <ExternalLink className="h-3.5 w-3.5" /> View Public Profile
                </Link>
            </div>

            {/* ── Identity Card (read-only preview) ── */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7">
                <div className="flex items-center gap-5">
                    <WalletAvatar address={address!} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-lg font-black text-slate-900">{name || address?.slice(0, 6) + "..." + address?.slice(-4)}</h1>
                            {asFreelancer.length > 0 && (
                                <span className={`px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${trustColor}`}>
                                    <ShieldCheck className="inline h-3 w-3 mr-1" />{trustLabel}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{address}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {asFreelancer.length > 0 && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                                    <Briefcase className="h-2.5 w-2.5" /> Freelancer
                                </span>
                            )}
                            {asEmployer.length > 0 && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[9px] font-black text-blue-700 uppercase tracking-widest">
                                    <Users className="h-2.5 w-2.5" /> Employer
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* On-chain stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {[
                        { label: "AVAX Earned", value: totalEarned.toFixed(3) },
                        { label: "Jobs Done", value: `${freelancerCompleted.length}/${asFreelancer.length}` },
                        { label: "Total Spent", value: totalSpent.toFixed(3) },
                        { label: "Trust Score", value: `${trustScore}/100` },
                    ].map((s) => (
                        <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                            <p className="text-base font-black text-slate-900">{s.value}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {asFreelancer.length > 0 && (
                    <div className="mt-4">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${trustScore}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Edit Form ── */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-slate-400" />
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Edit Profile</p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest"
                    >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save</>}
                    </Button>
                </div>

                <div className="border-t border-slate-100" />

                {/* Display Name */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex the Builder"
                        className="rounded-xl border-slate-200 text-sm"
                        maxLength={50}
                        disabled={isSaving}
                    />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Solidity dev, DeFi enthusiast, building on Avalanche..."
                        rows={3}
                        maxLength={300}
                        disabled={isSaving}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-slate-300 text-right">{bio.length}/300</p>
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills <span className="text-slate-300 normal-case font-medium">(max 10)</span></label>
                    <div className="flex gap-2">
                        <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                            placeholder="Solidity, React, Next.js..."
                            className="rounded-xl border-slate-200 text-sm h-9"
                            disabled={isSaving}
                        />
                        <Button
                            onClick={addSkill}
                            disabled={!skillInput.trim() || skills.length >= 10 || isSaving}
                            size="sm"
                            className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs"
                        >
                            Add
                        </Button>
                    </div>
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {skills.map((s) => (
                                <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                                    {s}
                                    <button onClick={() => setSkills(skills.filter((sk) => sk !== s))} disabled={isSaving} className="text-slate-400 hover:text-red-500 transition-colors ml-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100" />

                {/* Social Links */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Social Links</label>
                    <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username"
                            className="pl-9 rounded-xl border-slate-200 text-sm h-10" disabled={isSaving} />
                    </div>
                    <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/username"
                            className="pl-9 rounded-xl border-slate-200 text-sm h-10" disabled={isSaving} />
                    </div>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://yourportfolio.com"
                            className="pl-9 rounded-xl border-slate-200 text-sm h-10" disabled={isSaving} />
                    </div>
                </div>
            </div>
        </div>
    );
}