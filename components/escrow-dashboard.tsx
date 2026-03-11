"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@/lib/wallet-context";
import {
  getEscrows,
  updateMilestoneStatus,
  subscribe,
  getProposalsForEscrow,
  updateProposalStatus,
  assignWorker,
  reloadEscrows,
  deleteEscrow,
  updateEscrow,
  checkAndExpireEscrows,
  cancelOverdueEscrow,
  getProposalsByFreelancer,
  cancelProposal,
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
  Loader2,
  Pencil,
  Trash2,
  X,
  Calendar,
  Lock,
  Info,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { getProfile, upsertProfile, type Profile } from "@/lib/profile-store";

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
    const submitToast = toast.loading("Step 1/2 — Submitting on-chain...");

    try {
      // Step 1: On-chain submitWork
      if (escrow.onChainId !== undefined && escrow.onChainId !== null) {
        const { submitWorkOnChain, CONTRACT_ADDRESS } = await import("@/lib/contract");
        await submitWorkOnChain(CONTRACT_ADDRESS, Number(escrow.onChainId), githubUrl);
      }

      // Step 2: Simpan ke Supabase
      toast.loading("Step 2/2 — Saving to database...", { id: submitToast });
      await updateMilestoneStatus(escrow.id, milestone.id, "submitted", githubUrl);
      onUpdate();

      // Done — kasih feedback langsung, jangan tunggu AI
      toast.success("Work submitted! Employer can now review.", {
        id: submitToast,
        description: "AI audit will run in the background.",
        duration: 5000,
      });

      if (onCancelEdit) onCancelEdit();

      // Step 3: AI Audit di background — TIDAK blocking UI
      setTimeout(async () => {
        try {
          const { auditCode } = await import("@/lib/ai");
          const result = await auditCode(githubUrl, escrow.description ?? "");
          if (result?.score !== undefined) {
            // Save audit result to supabase silently
            const { createClient } = await import("@supabase/supabase-js");
            const sb = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            await sb.from("escrows").update({
              ai_audit_result: `${result.status} — Score: ${result.score}/100 — ${result.feedback}`,
            }).eq("id", escrow.id);

            toast.info(`AI Audit: ${result.status} (${result.score}/100)`, {
              description: result.feedback,
              duration: 8000,
            });
          }
        } catch (e) {
          console.warn("Background AI audit failed (non-critical):", e);
        }
      }, 500);

    } catch (e: any) {
      toast.error("Submission failed: " + e.message, { id: submitToast });
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
  disabled = false,
}: {
  milestone: Milestone;
  escrow: EscrowContract;
  onRelease: () => void;
  disabled?: boolean;
}) {
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
      {disabled ? (
        <div className="flex flex-col items-end gap-1">
          <Button size="sm" disabled className="h-9 rounded-lg px-4 font-black text-[10px] uppercase tracking-widest opacity-40 cursor-not-allowed bg-emerald-600 text-white">
            ✓ Approve & Release
          </Button>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No freelancer hired</span>
        </div>
      ) : (
        <CountdownButton onConfirm={onRelease} label="✓ Approve & Release" />
      )}
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({
  escrow,
  onConfirm,
  onClose,
}: {
  escrow: EscrowContract;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [count, setCount] = useState(3);
  const hasOnChain = escrow.onChainId !== undefined && escrow.onChainId !== null;

  useEffect(() => {
    if (count === 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-base font-black text-slate-900">Delete this contract?</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-bold text-slate-700">"{escrow.title}"</span>?
            {hasOnChain && escrow.totalAmount && (
              <>
                {" "}Your locked budget of{" "}
                <span className="font-black text-emerald-600">{escrow.totalAmount} AVAX</span>{" "}
                will be refunded to your wallet.
              </>
            )}
          </p>
          {hasOnChain && (
            <p className="text-[11px] text-slate-400 font-medium">
              MetaMask will ask you to confirm the on-chain cancellation.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest border-slate-200 h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={count > 0}
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-widest h-11 disabled:opacity-60 transition-all"
          >
            {count > 0 ? `Delete (${count}s)` : "Yes, Delete"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Countdown confirm button (5 detik) ──────────────────────────────────────
function CountdownButton({
  onConfirm,
  label = "Approve & Release",
  className = "",
}: {
  onConfirm: () => void;
  label?: string;
  className?: string;
}) {
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (!counting) return;
    if (count === 0) {
      setCounting(false);
      setCount(5);
      onConfirm();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [counting, count, onConfirm]);

  const handleClick = () => {
    if (counting) {
      // Cancel
      setCounting(false);
      setCount(5);
    } else {
      setCounting(true);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className={`h-8 rounded-lg px-4 font-black text-[10px] uppercase tracking-widest transition-all ${counting
          ? "bg-amber-500 hover:bg-red-500 text-white"
          : "bg-emerald-600 hover:bg-emerald-700 text-white"
        } ${className}`}
    >
      {counting ? (
        <span className="flex items-center gap-1.5">
          <X className="h-3 w-3" /> Cancel ({count}s)
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

// ─── Edit Escrow Modal ────────────────────────────────────────────────────────
function EditEscrowModal({
  escrow,
  onClose,
  onSave,
}: {
  escrow: EscrowContract;
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(escrow.title);
  const [description, setDescription] = useState(escrow.description);
  // deadline disimpan sebagai "YYYY-MM-DD" untuk input type=date
  const [deadline, setDeadline] = useState<string>(
    escrow.deadline ? escrow.deadline.slice(0, 10) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const hasOnChain = escrow.onChainId !== undefined && escrow.onChainId !== null;

  // Minimum deadline = besok
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (deadline && deadline < minDateStr) {
      toast.error("Deadline must be at least tomorrow");
      return;
    }
    setIsSaving(true);
    const result = await updateEscrow(escrow.id, {
      title,
      description,
      deadline: deadline || null,
    });
    if (result.success) {
      toast.success("Contract updated!");
      onSave();
      onClose();
    } else {
      toast.error(result.error ?? "Update failed");
    }
    setIsSaving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Edit Contract</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 rounded-xl border-slate-200 text-sm font-bold"
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isSaving}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Deadline
            </label>
            <input
              type="date"
              value={deadline}
              min={minDateStr}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isSaving}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
            {deadline && (
              <p className="mt-1 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                <Info className="h-3 w-3" />
                Project will auto-cancel and refund AVAX if not completed by this date.
              </p>
            )}
          </div>

          {/* Budget — locked, explain why */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Budget
            </label>
            <div className="mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 flex items-center justify-between">
              <span className="text-sm font-black text-slate-400">{escrow.totalAmount} AVAX</span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Locked</span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 font-medium leading-relaxed">
              {hasOnChain
                ? "Budget is locked in the smart contract and cannot be changed. To use a different budget, delete this contract and create a new one — your current AVAX will be refunded."
                : "Budget cannot be changed after a project is created. Delete and recreate the contract to use a different budget."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl font-black text-[10px] uppercase" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase">
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { address } = useWallet();
  const isFreelancer = address?.toLowerCase() === escrow.worker?.toLowerCase();
  const isEmployer = address?.toLowerCase() === escrow.employer?.toLowerCase();

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

  // ✅ Delete — buka modal konfirmasi
  const handleDelete = () => {
    if (escrow.worker) {
      toast.error("Cannot delete — a freelancer has already been hired.");
      return;
    }
    setShowDeleteModal(true);
  };

  // ✅ Cancel overdue — khusus kalau deadline lewat + sudah ada worker tapi belum submit
  const isOverdue = escrow.deadline
    ? new Date(escrow.deadline) < new Date()
    : false;
  const hasSubmission = escrow.milestones?.some(
    (m) => m.status === "submitted" || !!m.githubUrl
  ) || !!escrow.githubUrl;
  const canForceCancel = isOverdue && !!escrow.worker && !hasSubmission;

  const [isCancellingOverdue, setIsCancellingOverdue] = useState(false);
  const [showOverdueCancelModal, setShowOverdueCancelModal] = useState(false);

  const handleOverdueCancel = async () => {
    setShowOverdueCancelModal(false);
    setIsCancellingOverdue(true);
    const cancelToast = toast.loading("Cancelling overdue contract — AVAX will be refunded...");
    const result = await cancelOverdueEscrow(escrow.id);
    if (result.success) {
      toast.success("Contract cancelled. AVAX refunded to your wallet ✓", { id: cancelToast });
      onUpdate();
    } else if (result.error === "user_rejected") {
      toast.error("Cancelled — MetaMask transaction rejected.", { id: cancelToast });
    } else {
      toast.error(result.error ?? "Cancel failed", { id: cancelToast });
    }
    setIsCancellingOverdue(false);
  };

  const executeDelete = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    const hasOnChain = escrow.onChainId !== undefined && escrow.onChainId !== null;
    const deleteToast = toast.loading(
      hasOnChain ? "Cancelling contract — AVAX will be refunded..." : "Deleting contract..."
    );
    const result = await deleteEscrow(escrow.id);
    if (result.success) {
      toast.success(
        hasOnChain ? "Contract cancelled. AVAX refunded to your wallet ✓" : "Contract deleted.",
        { id: deleteToast }
      );
      onUpdate();
    } else {
      if (result.error === "user_rejected") {
        toast.error("Cancelled — MetaMask transaction rejected.", { id: deleteToast });
      } else {
        toast.error(result.error ?? "Delete failed", { id: deleteToast });
      }
      setIsDeleting(false);
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
          <div className="flex items-center gap-2">
            {/* Edit & Delete — employer only, sebelum hire */}
            {isEmployer && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowEditModal(true)}
                  title="Edit contract"
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || !!escrow.worker}
                  title={escrow.worker ? "Cannot delete — freelancer hired" : `Delete contract — ${escrow.totalAmount ?? "?"} AVAX will be refunded`}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
                {/* Cancel & Refund — hanya muncul kalau overdue + ada worker + belum submit */}
                {canForceCancel && (
                  <button
                    onClick={() => setShowOverdueCancelModal(true)}
                    disabled={isCancellingOverdue}
                    title={`Force cancel — freelancer overdue. ${escrow.totalAmount} AVAX will be refunded.`}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {isCancellingOverdue
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <><AlertTriangle className="h-3 w-3" /> Cancel & Refund</>
                    }
                  </button>
                )}
              </div>
            )}
            <Badge className={statusConfig.className}>
              <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <EditEscrowModal
            escrow={escrow}
            onClose={() => setShowEditModal(false)}
            onSave={onUpdate}
          />
        )}

        {/* Delete Confirm Modal */}
        {showDeleteModal && (
          <DeleteConfirmModal
            escrow={escrow}
            onConfirm={executeDelete}
            onClose={() => setShowDeleteModal(false)}
          />
        )}

        {/* Overdue Cancel Modal */}
        {showOverdueCancelModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-base font-black text-slate-900">Cancel Overdue Contract?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  The deadline for <span className="font-bold text-slate-700">"{escrow.title}"</span> has passed and the freelancer has not submitted any work.
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Your locked budget of <span className="font-black text-emerald-600">{escrow.totalAmount} AVAX</span> will be refunded to your wallet.
                </p>
                <p className="text-[11px] text-amber-600 font-bold bg-amber-50 rounded-xl px-3 py-2 mt-2">
                  ⚠️ This will terminate the contract with the freelancer.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setShowOverdueCancelModal(false)} className="flex-1 rounded-xl font-black text-[11px] uppercase h-11">
                  Keep Waiting
                </Button>
                <Button onClick={handleOverdueCancel} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[11px] uppercase h-11">
                  Cancel & Refund
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
                                onRelease={escrow.worker ? () => handleRelease(milestone.id) : () => { }}
                                disabled={!escrow.worker}
                              />
                            );
                          }
                          // Belum ada submission — Release disabled kalau belum ada worker
                          const noWorker = !escrow.worker;
                          return (
                            <div className="flex flex-col items-end gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleRelease(milestone.id)}
                                disabled={noWorker}
                                title={noWorker ? "Hire a freelancer first before releasing payment" : "Release payment"}
                                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Release
                              </Button>
                              {noWorker && (
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  No freelancer hired
                                </span>
                              )}
                            </div>
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




// ─── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({
  address,
  onClose,
  onSave,
}: {
  address: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProfile(address).then((prof) => {
      if (prof) {
        setName(prof.name);
        setBio(prof.bio);
        setSkills(prof.skills);
        setGithub(prof.githubUrl);
        setTwitter(prof.twitterUrl);
        setPortfolio(prof.portfolioUrl);
      }
      setIsLoading(false);
    });
  }, [address]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 10) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter((sk) => sk !== s));

  const handleSave = async () => {
    setIsSaving(true);
    const result = await upsertProfile(address, { name, bio, skills, githubUrl: github, twitterUrl: twitter, portfolioUrl: portfolio });
    if (result.success) {
      toast.success("Profile updated!");
      onSave();
      onClose();
    } else {
      toast.error(result.error ?? "Failed to save profile");
    }
    setIsSaving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Edit Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex the Builder" className="mt-1 rounded-xl border-slate-200 text-sm" disabled={isSaving} maxLength={50} />
            </div>

            {/* Bio */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Solidity dev, DeFi enthusiast, 3 years on-chain..."
                rows={3}
                maxLength={300}
                disabled={isSaving}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
              <p className="text-[10px] text-slate-300 text-right mt-0.5">{bio.length}/300</p>
            </div>

            {/* Skills */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="e.g. Solidity, React, Next.js..."
                  className="rounded-xl border-slate-200 text-sm h-9"
                  disabled={isSaving}
                />
                <Button onClick={addSkill} disabled={!skillInput.trim() || skills.length >= 10} size="sm"
                  className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs">
                  Add
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((s) => (
                    <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Social links */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Social Links</label>
              <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username" className="rounded-xl border-slate-200 text-sm h-9" disabled={isSaving} />
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/username" className="rounded-xl border-slate-200 text-sm h-9" disabled={isSaving} />
              <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://yourportfolio.com" className="rounded-xl border-slate-200 text-sm h-9" disabled={isSaving} />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="flex-1 rounded-xl font-black text-[10px] uppercase h-11">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-11">
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Freelancer Profile Section ───────────────────────────────────────────────
function FreelancerProfile({ address, escrows }: { address: string; escrows: EscrowContract[] }) {
  const myGigs = escrows.filter((e) => e.worker?.toLowerCase() === address.toLowerCase());
  const completed = myGigs.filter((e) => e.status === "completed");
  const totalEarned = completed.reduce((acc, e) => acc + parseFloat(e.totalAmount || "0"), 0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    getProfile(address).then((p) => { if (p?.name) setProfileName(p.name); });
  }, [address]);

  // Trust Score — weighted formula:
  // 60% completion rate (completed / total gigs)
  // 25% AI audit pass rate (gigs with PASS audit / completed gigs)
  // 15% activity bonus (capped at 15 for 3+ jobs)
  const completionRate = myGigs.length > 0 ? completed.length / myGigs.length : 0;
  const auditPassCount = completed.filter((e) => e.aiAuditResult?.includes("PASS")).length;
  const auditPassRate = completed.length > 0 ? auditPassCount / completed.length : 0;
  const activityBonus = Math.min(15, myGigs.length * 5);
  const trustScore = myGigs.length === 0 ? 0
    : Math.min(100, Math.round(completionRate * 60 + auditPassRate * 25 + activityBonus));

  const trustLabel = trustScore >= 80 ? "Elite" : trustScore >= 60 ? "Trusted" : trustScore >= 30 ? "Rising" : "New";
  const trustColor = trustScore >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : trustScore >= 60 ? "text-blue-600 bg-blue-50 border-blue-200"
      : trustScore >= 30 ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-slate-500 bg-slate-50 border-slate-200";

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-8">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <span className="text-lg font-black text-slate-600">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-slate-900">
              {profileName || `${address.slice(0, 6)}...${address.slice(-4)}`}
            </p>
            <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${trustColor}`}>
              {trustLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{address.slice(0, 6)}...{address.slice(-4)} · Avalanche Fuji</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/profile/${address}`} target="_blank"
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 text-[10px] font-black uppercase tracking-widest transition-all">
            <ExternalLink className="h-3 w-3" /> View
          </Link>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 text-[10px] font-black uppercase tracking-widest transition-all">
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <p className="text-lg font-black text-slate-900">{totalEarned.toFixed(3)}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AVAX Earned</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <p className="text-lg font-black text-slate-900">{completed.length}<span className="text-xs font-bold text-slate-400 ml-0.5">/{myGigs.length}</span></p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <p className="text-lg font-black text-slate-900">{trustScore}<span className="text-xs font-bold text-slate-400 ml-0.5">/100</span></p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trust Score</p>
          </div>
        </div>
      </div>

      {/* Trust bar — only if has gigs */}
      {myGigs.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Score</span>
            <span className="text-[10px] font-black text-slate-600">{trustScore}/100</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${trustScore}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {trustScore === 0 ? "Complete your first job to start building your score."
              : trustScore < 30 ? "Keep completing jobs to build your reputation."
                : trustScore < 60 ? "Rising reputation — AI-audited completions boost your score."
                  : trustScore < 80 ? "Strong track record. Employers will notice you."
                    : "Top-tier freelancer — employers trust you on-chain."}
          </p>
        </div>
      )}

      {showEditModal && (
        <EditProfileModal
          address={address}
          onClose={() => setShowEditModal(false)}
          onSave={() => getProfile(address).then((p) => { if (p?.name) setProfileName(p.name); })}
        />
      )}
    </div>
  );
}

// ─── My Applications Section (Freelancer Tab) ────────────────────────────────
function MyApplicationsSection({ address, onUpdate }: { address: string; onUpdate: () => void }) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState<{ id: string; title: string } | null>(null);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    const data = await getProposalsByFreelancer(address);
    setProposals(data);
    setLoading(false);
  }, [address]);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  const handleCancel = (proposalId: string, projectTitle: string) => {
    setConfirmWithdraw({ id: proposalId, title: projectTitle });
  };

  const executeWithdraw = async () => {
    if (!confirmWithdraw) return;
    const { id, title } = confirmWithdraw;
    setConfirmWithdraw(null);
    setCancellingId(id);
    const result = await cancelProposal(id);
    if (result.success) {
      toast.success(`Application for "${title}" withdrawn.`);
      loadProposals();
      onUpdate();
    } else {
      toast.error(result.error ?? "Failed to withdraw application");
    }
    setCancellingId(null);
  };

  const statusBadge = (status: string) => {
    if (status === "accepted") return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Hired
      </span>
    );
    if (status === "rejected") return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-100">
        <X className="h-3 w-3" /> Not Selected
      </span>
    );
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-200">
        <Clock className="h-3 w-3" /> Pending Review
      </span>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
    </div>
  );

  return (
    <>
      <div className="space-y-6 mt-8 bg-white/50 border border-slate-100 rounded-[40px] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">My Applications</h2>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-bold uppercase tracking-widest text-[9px] px-3 h-5">
            {proposals.length} Applied
          </Badge>
        </div>

        {proposals.length === 0 ? (
          <Card className="flex h-48 flex-col items-center justify-center border-slate-100 bg-white p-8 text-center rounded-[32px] shadow-sm">
            <div className="h-12 w-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-3">
              <FileCode2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400">No applications yet.</p>
            <Link href="/jobs">
              <Button variant="link" className="mt-1 text-emerald-600 font-black flex items-center gap-2 hover:no-underline hover:text-emerald-700">
                Browse open jobs <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {proposals.filter((prop) => {
              // Sembunyikan kalau sudah hired DAN project sudah completed
              if (prop.status === "accepted" && prop.escrows?.status === "completed") return false;
              return true;
            }).map((prop) => {
              const escrow = prop.escrows;
              const canCancel = prop.status === "pending";
              const isCancelling = cancellingId === prop.id;
              return (
                <div
                  key={prop.id}
                  className={`bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${prop.status === "accepted" ? "border-emerald-200 bg-emerald-50/30" :
                      prop.status === "rejected" ? "border-red-100 opacity-70" :
                        "border-slate-100 hover:border-emerald-200"
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 shrink-0">
                          <FileCode2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{escrow?.title ?? "Unknown Project"}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            by {escrow?.employer ? shortenAddress(escrow.employer) : "—"} · {escrow?.total_amount ?? "?"} AVAX budget
                          </p>
                        </div>
                        {statusBadge(prop.status)}
                      </div>
                      <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">
                        "{prop.content}"
                      </p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-500">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" />
                          AI Score: <span className="text-emerald-600">{prop.ai_score}/100</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Applied {new Date(prop.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {prop.portfolio_url && (
                          <a href={prop.portfolio_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-[9px] font-black text-blue-600 hover:underline">
                            <ExternalLink className="h-2.5 w-2.5" /> Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {prop.status === "accepted" && (
                        <div className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                          You're hired! Check<br />your Active Gigs above.
                        </div>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(prop.id, escrow?.title ?? "this project")}
                          disabled={isCancelling}
                          className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="h-3 w-3" /> Withdraw</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Confirm Modal */}
      {confirmWithdraw && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                <X className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900">Withdraw Application?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Are you sure you want to withdraw your application for{" "}
                <span className="font-bold text-slate-700">"{confirmWithdraw.title}"</span>?
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                You can re-apply to this project later if it's still open.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setConfirmWithdraw(null)}
                className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest border-slate-200 h-11"
              >
                Keep Application
              </Button>
              <Button
                onClick={executeWithdraw}
                className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-widest h-11"
              >
                Yes, Withdraw
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── EscrowDashboard ──────────────────────────────────────────────────────────
export function EscrowDashboard() {
  const { isConnected, connect, isConnecting, address, balance, shortAddress } = useWallet();
  const [escrows, setEscrows] = useState<EscrowContract[]>([]);
  const [activeTab, setActiveTab] = useState<"employer" | "freelancer">("employer");

  const refresh = useCallback(() => {
    setEscrows([...getEscrows()]);
  }, []); // stable — no deps needed

  useEffect(() => {
    reloadEscrows().then(refresh);
  }, []); // load once on mount — no realtime loop

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

      {/* Freelancer Profile — muncul di atas Available Work Gigs */}
      {activeTab === "freelancer" && address && (
        <FreelancerProfile address={address} escrows={escrows} />
      )}

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
          activeTab === "employer" ? (
            /* ── Employer empty state ── */
            <div className="flex flex-col items-center justify-center py-16 text-center gap-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-[1.75rem] bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                    <rect x="8" y="14" width="40" height="30" rx="5" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1.5" />
                    <rect x="16" y="22" width="16" height="2.5" rx="1.25" fill="#34d399" />
                    <rect x="16" y="28" width="24" height="2" rx="1" fill="#a7f3d0" />
                    <rect x="16" y="33" width="18" height="2" rx="1" fill="#a7f3d0" />
                    <circle cx="42" cy="38" r="8" fill="#0f172a" />
                    <path d="M38.5 38h7M42 34.5v7" stroke="#34d399" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-lg font-black text-slate-800 tracking-tight">No active hires yet</p>
                <p className="text-slate-400 text-sm mt-1 max-w-xs">Post your first project and let AI match you with top Web3 freelancers.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-xl text-left">
                {[
                  { step: "01", icon: "💬", title: "Chat with AI", desc: "Describe your project to our assistant to auto-generate milestones & budget." },
                  { step: "02", icon: "⛓️", title: "Deploy Escrow", desc: "Your AVAX is locked on-chain — safe until you approve the work." },
                  { step: "03", icon: "✅", title: "Approve & Pay", desc: "Review submissions, release payment with one click." },
                ].map((s) => (
                  <div key={s.step} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{s.step}</span>
                      <span className="text-lg">{s.icon}</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 mb-1">{s.title}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/chat">
                <Button className="h-11 px-8 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-95">
                  Post Your First Project <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          ) : (
            /* ── Freelancer empty state ── */
            <div className="flex flex-col items-center justify-center py-16 text-center gap-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-[1.75rem] bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                    <circle cx="28" cy="20" r="9" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" />
                    <path d="M28 14v12M22 20h12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 44c0-8.837 7.163-12 16-12s16 3.163 16 12" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-lg font-black text-slate-800 tracking-tight">No active gigs yet</p>
                <p className="text-slate-400 text-sm mt-1 max-w-xs">Browse open jobs, submit a proposal, and start earning AVAX on-chain.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-xl text-left">
                {[
                  { step: "01", icon: "🔍", title: "Browse Jobs", desc: "Explore open projects filtered by budget, tech stack, and risk level." },
                  { step: "02", icon: "📋", title: "Submit Proposal", desc: "AI vets your proposal before it reaches the employer — higher quality, better odds." },
                  { step: "03", icon: "💰", title: "Get Paid On-Chain", desc: "Work gets approved, AVAX lands in your wallet. No middleman." },
                ].map((s) => (
                  <div key={s.step} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{s.step}</span>
                      <span className="text-lg">{s.icon}</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 mb-1">{s.title}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/jobs">
                <Button className="h-11 px-8 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-95">
                  Find Your First Gig <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredEscrows.map((escrow, index) => (
              <EscrowCard key={escrow.id || index} escrow={escrow} onUpdate={refresh} />
            ))}
          </div>
        )}
      </div>

      {/* My Applications — freelancer only */}
      {activeTab === "freelancer" && address && (
        <MyApplicationsSection address={address} onUpdate={refresh} />
      )}
    </div>
  );
}