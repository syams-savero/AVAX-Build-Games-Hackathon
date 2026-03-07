"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/lib/wallet-context";
import {
  getEscrows,
  updateMilestoneStatus,
  subscribe,
  getProposalsForEscrow,
  updateProposalStatus,
  assignWorker,
  reloadEscrows,
} from "@/lib/escrow-store";
import {
  type EscrowContract,
  type EscrowStatus,
  type Milestone,
  formatKite,
  shortenAddress,
  ACTIVE_NETWORK
} from "@/lib/kite-config";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  Users,
  ShieldCheck,
  TrendingUp,
  Loader2
} from "lucide-react";
import Link from "next/link";

function getStatusConfig(status: EscrowStatus) {
  const configs: Record<
    EscrowStatus,
    { label: string; className: string; icon: typeof Clock }
  > = {
    created: {
      label: "Created",
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
      icon: Clock,
    },
    funded: {
      label: "Funded",
      className: "border-emerald-200 bg-emerald-100 text-emerald-800",
      icon: Zap,
    },
    in_progress: {
      label: "In Progress",
      className: "border-blue-100 bg-blue-50 text-blue-700",
      icon: Clock,
    },
    milestone_completed: {
      label: "Milestone Done",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },
    completed: {
      label: "Completed",
      className: "border-emerald-200 bg-emerald-600 text-white",
      icon: ShieldCheck,
    },
    disputed: {
      label: "Disputed",
      className: "border-red-100 bg-red-50 text-red-700",
      icon: AlertCircle,
    },
    cancelled: {
      label: "Cancelled",
      className: "border-slate-200 bg-slate-100 text-slate-600",
      icon: AlertCircle,
    },
  };
  return configs[status] || configs.created;
}

// ─── Freelancer: submit work per milestone ────────────────────────────────────
function MilestoneSubmitRow({
  milestone,
  escrow,
  onUpdate,
  isEdit = false,
  onCancelEdit,
}: {
  milestone: Milestone;
  escrow: EscrowContract;
  onUpdate: () => void;
  isEdit?: boolean;
  onCancelEdit?: () => void;
}) {
  // Pre-fill dengan URL yang sudah pernah disubmit (untuk edit)
  const existingUrl = milestone.githubUrl ?? (escrow as any).githubUrl ?? "";
  const [githubUrl, setGithubUrl] = useState(isEdit ? existingUrl : "");
  const [isAuditing, setIsAuditing] = useState(false);

  const handleSubmit = async () => {
    if (!githubUrl) {
      toast.error("Please provide a GitHub URL.");
      return;
    }

    setIsAuditing(true);
    const auditToast = toast.loading("Submitting work to blockchain...");

    try {
      // Step 1: On-chain submitWork — ubah status Assigned → Submitted
      // Harus dilakukan sebelum releasePayment bisa dipanggil
      if (escrow.onChainId !== undefined && escrow.onChainId !== null) {
        toast.loading("Submitting on-chain...", { id: auditToast });
        const { submitWorkOnChain, CONTRACT_ADDRESS } = await import("@/lib/contract");
        await submitWorkOnChain(CONTRACT_ADDRESS, Number(escrow.onChainId), githubUrl);
      }

      // Step 2: Simpan github_url ke Supabase
      await updateMilestoneStatus(escrow.id, milestone.id, "submitted", githubUrl);
      onUpdate();

      toast.loading("Running AI Audit...", { id: auditToast });

      // Step 3: AI Audit — opsional, tidak memblokir
      try {
        const { submitAndAuditWork } = await import("@/app/actions/audit");
        const response = await submitAndAuditWork(escrow.id, githubUrl, "");

        if (response.success && response.result) {
          const { result } = response;
          if (result.status === "PASS" && result.score >= 70) {
            toast.success(`AI Audit Passed (${result.score}/100) — Waiting for employer approval.`, {
              description: result.feedback,
              id: auditToast,
            });
          } else {
            toast.warning(`AI Score: ${result.score}/100 — Submitted for employer review.`, {
              description: result.feedback,
              id: auditToast,
            });
          }
        } else {
          toast.success("Work submitted! Waiting for employer approval.", { id: auditToast });
        }
      } catch (auditErr: any) {
        console.warn("AI audit failed (non-blocking):", auditErr.message);
        toast.success("Work submitted on-chain ✓ Employer can now review.", { id: auditToast });
      }

      if (onCancelEdit) onCancelEdit();
    } catch (e: any) {
      toast.error("Submission failed: " + e.message, { id: auditToast });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <div className="flex items-center gap-2">
        <Input
          placeholder="GitHub / repo URL..."
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="h-9 w-48 text-xs rounded-lg border-slate-200"
          disabled={isAuditing}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isAuditing || !githubUrl}
          className="h-9 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg px-4 font-black text-[10px] uppercase tracking-widest"
        >
          {isAuditing ? <Loader2 className="h-3 w-3 animate-spin" /> : isEdit ? "Resubmit" : "Submit & Audit"}
        </Button>
        {isEdit && onCancelEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelEdit}
            disabled={isAuditing}
            className="h-9 px-3 text-slate-400 hover:text-slate-600 text-[10px]"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Freelancer: info sudah submit + bisa edit/resubmit ─────────────────────
function FreelancerSubmittedInfo({
  milestone,
  escrow,
  onUpdate,
}: {
  milestone: Milestone;
  escrow: EscrowContract;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  // Cek dari milestone dulu (data baru), fallback ke escrow level (data lama sebelum fix)
  const submittedUrl = milestone.githubUrl ?? escrow.githubUrl ?? "";
  const isActuallySubmitted = milestone.status === "submitted" || !!submittedUrl;

  if (isEditing) {
    return (
      <MilestoneSubmitRow
        milestone={milestone}
        escrow={escrow}
        onUpdate={onUpdate}
        isEdit={true}
        onCancelEdit={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 min-w-[220px]">
      {/* Status badge */}
      <div className="flex items-center gap-2 bg-amber-500 text-white rounded-xl px-4 h-9 shadow-lg shadow-amber-500/25 w-full justify-center">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[10px] font-black tracking-widest uppercase">Submitted · Awaiting Approval</span>
      </div>

      {/* Preview link */}
      {submittedUrl && (
        <a
          href={submittedUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-3 h-9 transition-all group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileCode2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 truncate max-w-[140px]">
              {submittedUrl.replace("https://github.com/", "").replace("https://", "")}
            </span>
          </div>
          <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-blue-500 shrink-0" />
        </a>
      )}

      {/* Edit button */}
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1.5 w-full justify-center text-[10px] font-black text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl h-8 transition-all"
      >
        ✎ Edit & Resubmit
      </button>
    </div>
  );
}

// ─── Employer: review submitted work sebelum release ─────────────────────────
function MilestoneReviewRow({
  milestone,
  escrow,
  onRelease,
}: {
  milestone: Milestone;
  escrow: EscrowContract;
  onRelease: () => void;
}) {
  // Cek milestone dulu (data baru), fallback ke escrow level (data lama sebelum fix)
  const submittedUrl = milestone.githubUrl ?? escrow.githubUrl ?? "";

  return (
    <div className="flex flex-col items-end gap-2">
      {submittedUrl ? (
        <a
          href={submittedUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:underline bg-blue-50 border border-blue-200 rounded-lg px-3 h-8"
        >
          <ExternalLink className="h-3 w-3" />
          REVIEW SUBMITTED WORK ↗
        </a>
      ) : (
        <span className="text-[10px] text-slate-400 italic">No link yet</span>
      )}
      <Button
        size="sm"
        onClick={onRelease}
        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 font-black text-[10px] uppercase tracking-widest"
      >
        ✓ Approve & Release
      </Button>
    </div>
  );
}

// ─── EscrowCard ───────────────────────────────────────────────────────────────
function EscrowCard({
  escrow,
  onUpdate,
}: {
  escrow: EscrowContract;
  onUpdate: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getStatusConfig(escrow.status);
  const StatusIcon = statusConfig.icon;

  const completedMilestones = escrow.milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const progress =
    escrow.milestones.length > 0
      ? (completedMilestones / escrow.milestones.length) * 100
      : 0;

  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const { address } = useWallet();

  const loadProposals = useCallback(async () => {
    if (escrow.status === "created") {
      setIsLoadingProposals(true);
      try {
        const data = await getProposalsForEscrow(escrow.id);
        setProposals(data);
      } catch (e) {
        console.error("Failed to load proposals:", e);
      } finally {
        setIsLoadingProposals(false);
      }
    }
  }, [escrow.id, escrow.status]);

  useEffect(() => {
    if (isExpanded) loadProposals();
  }, [isExpanded, loadProposals]);

  const handleHire = async (proposal: any) => {
    const hireToast = toast.loading(`Hiring ${shortenAddress(proposal.freelancer)}...`);
    try {
      // Step 1: On-chain assignFreelancer — ubah status Open → Assigned
      if (escrow.onChainId !== undefined && escrow.onChainId !== null) {
        toast.loading("Confirming on-chain...", { id: hireToast });
        const { assignFreelancerOnChain, CONTRACT_ADDRESS } = await import("@/lib/contract");
        await assignFreelancerOnChain(CONTRACT_ADDRESS, Number(escrow.onChainId), proposal.freelancer);
      }

      // Step 2: Update Supabase
      await assignWorker(escrow.id, proposal.freelancer);
      await updateProposalStatus(proposal.id, "accepted");
      toast.success("Freelancer hired! On-chain status: Assigned ✓", { id: hireToast });
      onUpdate();
    } catch (e: any) {
      toast.error("Hiring failed: " + e.message, { id: hireToast });
    }
  };

  // Release payment — on-chain dulu baru Supabase
  const handleRelease = async (milestoneId: number) => {
    const releaseToast = toast.loading("Releasing payment on-chain...");
    try {
      // Step 1: On-chain releasePayment — transfer AVAX ke freelancer
      // Butuh status Submitted on-chain (sudah di-set saat submitWork)
      if (escrow.onChainId !== undefined && escrow.onChainId !== null) {
        const { releasePaymentOnChain, CONTRACT_ADDRESS } = await import("@/lib/contract");
        await releasePaymentOnChain(CONTRACT_ADDRESS, Number(escrow.onChainId));
      }

      // Step 2: Update Supabase milestone jadi completed
      await updateMilestoneStatus(escrow.id, milestoneId, "completed");
      toast.success("Payment released! AVAX sent to freelancer ✓", { id: releaseToast });
      onUpdate();
    } catch (e: any) {
      toast.error("Release failed: " + e.message, { id: releaseToast });
    }
  };

  const isFreelancer = address?.toLowerCase() === escrow.worker?.toLowerCase();
  const isEmployer = address?.toLowerCase() === escrow.employer?.toLowerCase();

  return (
    <Card className="overflow-hidden border-slate-200 bg-white transition-all hover:shadow-xl hover:shadow-emerald-500/5">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
              <FileCode2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">{escrow.title}</h3>
                {escrow.riskLevel && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1 ${escrow.riskLevel === "Low"
                      ? "border-emerald-200 text-emerald-600 bg-emerald-50"
                      : "border-amber-200 text-amber-600 bg-amber-50"
                      }`}
                  >
                    {escrow.riskLevel} Risk
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                {escrow.description}
              </p>
            </div>
          </div>
          <Badge className={statusConfig.className}>
            <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
            {statusConfig.label}
          </Badge>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Budget</span>
            <span className="text-sm font-bold text-emerald-600">{formatKite(escrow.totalAmount)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completion</span>
            <span className="text-sm font-bold text-slate-700">
              {completedMilestones}/{escrow.milestones.length} Milestones
            </span>
          </div>
          {escrow.team && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Users className="h-3.5 w-3.5 text-emerald-500" />
                AI Team Assembled
              </div>
            </div>
          )}
          {escrow.contractAddress && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On-Chain</span>
              <a
                href={`${ACTIVE_NETWORK.blockExplorerUrl}/tx/${escrow.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
              >
                {shortenAddress(escrow.contractAddress)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">On-Chain Progress</span>
              <span className="text-[10px] font-black text-emerald-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 rounded-full bg-slate-100" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg h-9 w-9 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-white p-6 space-y-8 shadow-inner">
          {/* Proposals — employer only, saat status masih created */}
          {isEmployer && escrow.status === "created" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  Received Proposals ({proposals.length})
                </h4>
                {isLoadingProposals && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
              </div>
              {proposals.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No proposals yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {proposals.map((prop) => (
                    <div
                      key={prop.id}
                      className="bg-white border border-slate-100 p-5 rounded-2xl hover:border-emerald-200 transition-all shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-900">
                              {shortenAddress(prop.freelancer)}
                            </span>
                            <Badge className="bg-emerald-600 text-white border-none font-black text-[9px] h-5">
                              AI SCORE: {prop.ai_score}/100
                            </Badge>
                            {prop.status === "accepted" && (
                              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 font-black text-[9px] h-5">
                                ✓ HIRED
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                            "{prop.content}"
                          </p>
                          {prop.portfolio_url && (
                            <a
                              href={prop.portfolio_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[9px] font-black text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-2.5 w-2.5" /> VIEW PORTFOLIO
                            </a>
                          )}
                        </div>
                        {prop.status === "accepted" ? (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-5 h-10">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Hired</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleHire(prop)}
                            disabled={!!escrow.worker}
                            className="bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase h-10 px-6 rounded-xl"
                          >
                            Hire Now
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Info */}
          {escrow.team && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                Assembled Expert Team
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {escrow.team.map((member, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-800">{member.role}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{member.description}</p>
                    <div className="mt-2 text-xs font-bold text-emerald-600">{member.budget} AVAX</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Audit Result */}
          {escrow.aiAuditResult && (
            <div
              className={`p-5 rounded-2xl flex flex-col gap-3 shadow-lg ${escrow.aiAuditResult.includes("PASS")
                ? "bg-emerald-600 text-white"
                : "bg-red-50 text-red-700 border border-red-100"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-[10px] font-black uppercase tracking-wider">AI Security Auditor Analysis</p>
                </div>
                <Badge
                  className={
                    escrow.aiAuditResult.includes("PASS")
                      ? "bg-white/20 text-white"
                      : "bg-red-200 text-red-700"
                  }
                >
                  {escrow.aiAuditResult.includes("PASS") ? "VERIFIED" : "REJECTED"}
                </Badge>
              </div>
              <p className="text-sm font-bold leading-relaxed">{escrow.aiAuditResult}</p>
              {escrow.githubUrl && (
                <a
                  href={escrow.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-black underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> REVIEW SUBMITTED CODE
                </a>
              )}
            </div>
          )}

          {/* Milestones */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Smart Contract Milestones
            </h4>
            <div className="space-y-2">
              {escrow.milestones?.map((milestone, index) => (
                <div
                  key={milestone.id || index}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all ${milestone.status === "submitted"
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-100 bg-white"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Status icon */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${milestone.status === "completed"
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                          : milestone.status === "submitted"
                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                            : milestone.status === "in_progress"
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                              : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : milestone.status === "submitted" ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        milestone.id
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800">{milestone.title}</p>
                        {milestone.status === "submitted" && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black text-[9px] h-4 px-2">
                            AWAITING REVIEW
                          </Badge>
                        )}
                        {milestone.earlyBonus && (
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] h-4 py-0">
                            + {milestone.earlyBonus} Bonus
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{milestone.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-emerald-600">
                      {milestone.amount} AVAX
                    </span>

                    {milestone.status !== "completed" && (
                      <>
                        {isFreelancer && (() => {
                          // Cek apakah sudah ada submission — dari status ATAU dari githubUrl yang tersimpan
                          const hasSubmitted = milestone.status === "submitted" || !!milestone.githubUrl || !!escrow.githubUrl;
                          if (hasSubmitted) {
                            return (
                              <FreelancerSubmittedInfo
                                milestone={milestone}
                                escrow={escrow}
                                onUpdate={onUpdate}
                              />
                            );
                          }
                          return (
                            <MilestoneSubmitRow
                              milestone={milestone}
                              escrow={escrow}
                              onUpdate={onUpdate}
                            />
                          );
                        })()}

                        {isEmployer && (() => {
                          // Cek apakah freelancer sudah submit — dari status ATAU dari githubUrl
                          const submittedUrl = milestone.githubUrl ?? escrow.githubUrl ?? "";
                          const hasSubmitted = milestone.status === "submitted" || !!submittedUrl;
                          if (hasSubmitted) {
                            return (
                              <MilestoneReviewRow
                                milestone={milestone}
                                escrow={escrow}
                                onRelease={() => handleRelease(milestone.id)}
                              />
                            );
                          }
                          // Belum ada submission — tombol Release saja
                          return (
                            <Button
                              size="sm"
                              onClick={() => handleRelease(milestone.id)}
                              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 font-bold"
                            >
                              Release
                            </Button>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── EscrowDashboard ──────────────────────────────────────────────────────────
export function EscrowDashboard() {
  const { isConnected, connect, isConnecting, address, balance, shortAddress } = useWallet();
  const [escrows, setEscrows] = useState<EscrowContract[]>([]);
  const [activeTab, setActiveTab] = useState<"employer" | "freelancer">("employer");

  const refresh = useCallback(() => {
    setEscrows(getEscrows());
  }, []);

  useEffect(() => {
    reloadEscrows().then(refresh);
    return subscribe(refresh);
  }, [refresh]);

  const filteredEscrows =
    activeTab === "employer"
      ? escrows.filter((e) => e.employer?.toLowerCase() === address?.toLowerCase())
      : escrows.filter((e) => e.worker?.toLowerCase() === address?.toLowerCase());

  if (!isConnected) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-emerald-500/5">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
          <Wallet className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Access Your Dashboard</h2>
        <p className="mt-2 text-slate-500 font-medium max-w-sm">
          Connect your wallet to monitor active executions and manage your autonomous team.
        </p>
        <Button
          onClick={connect}
          disabled={isConnecting}
          className="mt-8 h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-500/20"
        >
          <Wallet className="h-5 w-5 mr-3" />
          {isConnecting ? "Connecting..." : "Connect to Avalanche"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h1>
          </div>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-200">
            <button
              onClick={() => setActiveTab("employer")}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === "employer"
                ? "bg-white text-emerald-700 shadow-md border border-slate-100"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              Hire (Employer)
            </button>
            <button
              onClick={() => setActiveTab("freelancer")}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === "freelancer"
                ? "bg-white text-emerald-700 shadow-md border border-slate-100"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              Work (Freelancer)
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-1 px-4 py-3 border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Identity</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-900">{shortAddress}</span>
            <span className="h-4 w-px bg-slate-300" />
            <span className="text-xs font-bold text-emerald-600">{balance} AVAX</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Active Projects", value: filteredEscrows.filter((e) => e.status !== "completed").length, icon: Zap },
          { label: "Total Committed", value: `${filteredEscrows.reduce((acc, curr) => acc + parseFloat(curr.totalAmount || "0"), 0).toFixed(4)} AVAX`, icon: TrendingUp },
          { label: "Completed", value: filteredEscrows.filter((e) => e.status === "completed").length, icon: CheckCircle2 },
          { label: "AI Audits", value: filteredEscrows.filter((e) => e.aiAuditResult).length, icon: ShieldCheck },
          { label: "Total Workers", value: filteredEscrows.reduce((acc, curr) => acc + (curr.team?.length || 0), 0), icon: Users },
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-200 bg-white p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shadow-inner">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-1 text-xl font-black text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-6 mt-12 bg-white/50 border border-slate-100 rounded-[40px] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {activeTab === "employer" ? "My Global Hires" : "Available Work Gigs"}
          </h2>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold uppercase tracking-widest text-[9px] px-3 h-5">
            LIVE AVALANCHE FEED
          </Badge>
        </div>

        {filteredEscrows.length === 0 ? (
          <Card className="flex h-64 flex-col items-center justify-center border-slate-100 bg-white p-8 text-center rounded-[32px] shadow-sm">
            <div className="h-14 w-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4">
              <FileCode2 className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-slate-400 tracking-tight">
              No active items in your {activeTab === "employer" ? "Hires" : "Gigs"}.
            </p>
            <Link href={activeTab === "employer" ? "/chat" : "/jobs"}>
              <Button variant="link" className="mt-2 text-emerald-600 font-black flex items-center gap-2 hover:no-underline hover:text-emerald-700">
                {activeTab === "employer" ? "Hire your first team" : "Find projects to earn"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredEscrows.map((escrow, index) => (
              <EscrowCard key={escrow.id || index} escrow={escrow} onUpdate={refresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}