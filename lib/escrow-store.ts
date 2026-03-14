import { type EscrowContract, type Milestone } from "./kite-config";
import { supabase } from "./supabase";
import { createNotification } from "./chat-notif-store";
import { getProfile } from "./profile-store";

// In-memory store that syncs with Supabase
let escrows: EscrowContract[] = [];
let listeners: (() => void)[] = [];

// Map DB row to EscrowContract
function mapRow(item: any): EscrowContract {
  return {
    ...item,
    onChainId: item.on_chain_id,
    totalAmount: item.total_amount,
    createdAt: item.created_at,
    deadline: item.duration ?? null,  // kolom DB = "duration", app = "deadline"
    contractAddress: item.contract_address,
    riskLevel: item.risk_level,
    githubUrl: item.github_url,
    aiAuditResult: item.ai_audit_result,
    techStack: Array.isArray(item.tech_stack)
      ? item.tech_stack
      : item.tech_stack ? [item.tech_stack] : [],
    employer: item.employer,
    worker: item.worker,
  };
}

// Load fresh data from Supabase — always replaces in-memory cache
async function load() {
  try {
    const { data, error } = await supabase
      .from("escrows")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    escrows = (data ?? []).map(mapRow);
    notify();
  } catch (err: any) {
    console.error("EscrowStore load error:", err.message || err);
  }
}

export async function reloadEscrows() {
  await load();
}

// Load once on module init — no realtime subscription
// Realtime dihandle manual via reloadEscrows() setelah setiap action
load();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getEscrows(): EscrowContract[] {
  return [...escrows];
}

export function getEscrowById(id: string): EscrowContract | undefined {
  return escrows.find((e) => e.id === id);
}

export async function addEscrow(escrow: Omit<EscrowContract, "id" | "createdAt">): Promise<EscrowContract> {
  const newEscrow: EscrowContract = {
    ...escrow,
    id: `esc-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  escrows = [newEscrow, ...escrows];
  notify();

  const dbDataBase = {
    id: newEscrow.id,
    title: newEscrow.title,
    description: newEscrow.description,
    employer: newEscrow.employer,
    worker: newEscrow.worker || "",
    total_amount: newEscrow.totalAmount,
    milestones: newEscrow.milestones,
    status: newEscrow.status,
    created_at: newEscrow.createdAt,
    contract_address: newEscrow.contractAddress,
    team: newEscrow.team ?? null,
    risk_level: newEscrow.riskLevel,
    duration: newEscrow.duration,
    tech_stack: newEscrow.techStack ?? [],
    github_url: newEscrow.githubUrl ?? "",
    ai_audit_result: newEscrow.aiAuditResult ?? "",
  };

  const { error: insertError } = await supabase.from("escrows").insert([dbDataBase]);

  if (insertError) {
    console.error("Supabase insert error:", insertError.code, insertError.message);
    return newEscrow;
  }

  if (newEscrow.onChainId !== undefined && newEscrow.onChainId !== null) {
    const { error: updateError } = await supabase
      .from("escrows")
      .update({ on_chain_id: newEscrow.onChainId })
      .eq("id", newEscrow.id);

    if (updateError) {
      console.error("Supabase on_chain_id update error:", updateError.code, updateError.message);
    }
  }

  return newEscrow;
}

// ✅ githubUrl disimpan di milestone JSON dan di kolom github_url
export async function updateMilestoneStatus(
  escrowId: string,
  milestoneId: number,
  status: Milestone["status"],
  githubUrl?: string
) {
  let updatedEscrow: EscrowContract | null = null;

  escrows = escrows.map((e: EscrowContract) => {
    if (e.id !== escrowId) return e;
    const milestones = e.milestones.map((m: Milestone) =>
      m.id === milestoneId
        ? { ...m, status, ...(githubUrl ? { githubUrl } : {}) }
        : m
    );
    const allCompleted = milestones.every((m) => m.status === "completed");
    updatedEscrow = {
      ...e,
      milestones,
      status: allCompleted ? "completed" : e.status,
    };
    return updatedEscrow;
  });

  notify();

  if (!updatedEscrow) return;

  // Trigger notifications
  const finalEscrow = updatedEscrow as EscrowContract;
  if (status === "submitted" && finalEscrow.employer) {
    await createNotification({
      recipient: finalEscrow.employer,
      escrowId,
      type: "work_submitted",
      message: `📦 Freelancer submitted work for "${finalEscrow.title}". Review and approve payment.`,
    });
  }
  if (status === "completed" && finalEscrow.worker) {
    await createNotification({
      recipient: finalEscrow.worker,
      escrowId,
      type: "payment_released",
      message: `💰 Payment released for "${finalEscrow.title}"! Check your wallet.`,
    });
  }

  // Step 1: Update milestones JSON + status
  const milestonesPayload = (updatedEscrow as EscrowContract).milestones;
  const statusPayload = (updatedEscrow as EscrowContract).status;

  console.log("updateMilestoneStatus: saving milestones to Supabase...", { escrowId, milestoneId, status, githubUrl });

  const { error: milestoneError } = await supabase
    .from("escrows")
    .update({
      milestones: milestonesPayload,
      status: statusPayload,
    })
    .eq("id", escrowId);

  if (milestoneError) {
    console.error("Supabase milestones update error:", milestoneError.message, milestoneError.hint);
  } else {
    console.log("updateMilestoneStatus: ✅ milestones saved");
  }

  // Step 2: Update github_url secara terpisah (sama seperti pola on_chain_id)
  // Ini menghindari PostgREST issue kalau kolom baru
  if (githubUrl) {
    console.log("updateMilestoneStatus: saving github_url...", githubUrl);
    const { error: githubError } = await supabase
      .from("escrows")
      .update({ github_url: githubUrl })
      .eq("id", escrowId);

    if (githubError) {
      console.error("Supabase github_url update error:", githubError.message, githubError.hint);
    } else {
      console.log("updateMilestoneStatus: ✅ github_url saved:", githubUrl);
    }
  }
}

export async function assignWorker(escrowId: string, workerAddress: string) {
  let updatedEscrow: EscrowContract | null = null;

  escrows = escrows.map((e: EscrowContract) => {
    if (e.id !== escrowId) return e;
    updatedEscrow = {
      ...e,
      worker: workerAddress,
      status: "funded",
    };
    return updatedEscrow;
  });

  notify();

  if (updatedEscrow) {
    const { error } = await supabase
      .from("escrows")
      .update({ worker: workerAddress, status: "funded" })
      .eq("id", escrowId);

    if (error) console.error("Supabase worker assignment error:", error.message, error.hint);
  }
}

// ✅ Delete escrow — cancel on-chain dulu (refund AVAX), baru hapus Supabase
export async function deleteEscrow(escrowId: string): Promise<{ success: boolean; error?: string }> {
  const escrow = escrows.find((e) => e.id === escrowId);
  if (!escrow) return { success: false, error: "Escrow not found" };
  if (escrow.worker) return { success: false, error: "Cannot delete — freelancer already hired" };

  // Step 1: Cancel on-chain → AVAX dikembalikan ke employer
  // cancelProject di contract handle status Open & Assigned, refund ke client
  if (escrow.onChainId !== undefined && escrow.onChainId !== null) {
    console.log("deleteEscrow: calling cancelProject on-chain...", escrow.onChainId);
    try {
      const { cancelProjectOnChain, CONTRACT_ADDRESS } = await import("@/lib/contract");
      await cancelProjectOnChain(CONTRACT_ADDRESS, Number(escrow.onChainId));
      console.log("deleteEscrow: ✅ on-chain cancel success, AVAX refunded");
    } catch (onChainErr: any) {
      // Cek apakah user sengaja reject di MetaMask
      const isUserRejected =
        onChainErr?.code === 4001 ||
        onChainErr?.code === "ACTION_REJECTED" ||
        onChainErr?.message?.toLowerCase().includes("user rejected") ||
        onChainErr?.message?.toLowerCase().includes("user denied");

      if (isUserRejected) {
        console.log("deleteEscrow: user rejected MetaMask — cancel aborted");
        return { success: false, error: "user_rejected" };
      }

      console.error("deleteEscrow: on-chain cancel failed:", onChainErr.message);
      return { success: false, error: "On-chain cancel failed: " + onChainErr.message };
    }
  }

  // Step 2: Hapus dari Supabase
  console.log("deleteEscrow: deleting from Supabase...", escrowId);
  const { error, count } = await supabase
    .from("escrows")
    .delete()
    .eq("id", escrowId)
    .select();

  if (error) {
    console.error("Supabase delete error:", error.code, error.message, error.hint);
    return { success: false, error: error.message };
  }

  console.log("deleteEscrow: ✅ Supabase delete success, rows affected:", count);

  // Step 3: Update in-memory cache
  escrows = escrows.filter((e) => e.id !== escrowId);
  notify();

  return { success: true };
}

// ✅ Cancel escrow meski sudah ada worker — hanya boleh kalau deadline sudah lewat
// AVAX refund ke employer via cancelProject on-chain (status Assigned)
export async function cancelOverdueEscrow(escrowId: string): Promise<{ success: boolean; error?: string }> {
  const escrow = escrows.find((e) => e.id === escrowId);
  if (!escrow) return { success: false, error: "Escrow not found" };

  // Guard: hanya boleh kalau deadline sudah lewat
  if (escrow.deadline) {
    const isOverdue = new Date(escrow.deadline) < new Date();
    if (!isOverdue) return { success: false, error: "Deadline has not passed yet" };
  } else {
    return { success: false, error: "No deadline set — cannot force cancel" };
  }

  // Guard: freelancer belum submit (kalau sudah submit, employer harus review dulu)
  const hasSubmission = escrow.milestones?.some(
    (m) => m.status === "submitted" || !!m.githubUrl
  ) || !!escrow.githubUrl;
  if (hasSubmission) {
    return { success: false, error: "Freelancer has already submitted work — please review before cancelling" };
  }

  // Step 1: Cancel on-chain → AVAX refund ke employer
  if (escrow.onChainId !== undefined && escrow.onChainId !== null) {
    console.log("cancelOverdueEscrow: calling cancelProject on-chain...", escrow.onChainId);
    try {
      const { cancelProjectOnChain, CONTRACT_ADDRESS } = await import("@/lib/contract");
      await cancelProjectOnChain(CONTRACT_ADDRESS, Number(escrow.onChainId));
      console.log("cancelOverdueEscrow: ✅ on-chain cancel success, AVAX refunded");
    } catch (onChainErr: any) {
      const isUserRejected =
        onChainErr?.code === 4001 ||
        onChainErr?.code === "ACTION_REJECTED" ||
        onChainErr?.message?.toLowerCase().includes("user rejected") ||
        onChainErr?.message?.toLowerCase().includes("user denied");

      if (isUserRejected) return { success: false, error: "user_rejected" };
      return { success: false, error: "On-chain cancel failed: " + onChainErr.message };
    }
  }

  // Step 2: Hapus dari Supabase
  const { error } = await supabase
    .from("escrows")
    .delete()
    .eq("id", escrowId)
    .select();

  if (error) {
    console.error("Supabase delete error:", error.message);
    return { success: false, error: error.message };
  }

  // Step 3: Update in-memory
  escrows = escrows.filter((e) => e.id !== escrowId);
  notify();

  return { success: true };
}

// ✅ Update escrow title, description, deadline, milestones
export async function updateEscrow(
  escrowId: string,
  updates: {
    title?: string;
    description?: string;
    deadline?: string | null;
    milestones?: EscrowContract["milestones"];
  }
): Promise<{ success: boolean; error?: string }> {
  const escrow = escrows.find((e) => e.id === escrowId);
  if (!escrow) return { success: false, error: "Escrow not found" };
  if (escrow.worker) return { success: false, error: "Cannot edit — freelancer already hired" };

  escrows = escrows.map((e) =>
    e.id === escrowId ? { ...e, ...updates, deadline: updates.deadline ?? undefined } : e
  );
  notify();

  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.deadline !== undefined) payload.duration = updates.deadline;  // kolom DB = "duration"
  if (updates.milestones !== undefined) payload.milestones = updates.milestones;

  const { error } = await supabase.from("escrows").update(payload).eq("id", escrowId);
  if (error) {
    console.error("Supabase update error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ✅ Auto-expire: cek semua escrow yang sudah lewat deadline
// Dipanggil client-side saat dashboard dibuka
export async function checkAndExpireEscrows(): Promise<void> {
  const now = new Date();

  // Notif deadline soon (3 hari sebelum) — hanya sekali, cek by escrow
  const soonThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const soonEscrows = escrows.filter((e) => {
    if (!e.deadline) return false;
    if (e.status === "completed" || e.status === "cancelled") return false;
    const dl = new Date(e.deadline);
    return dl > now && dl <= soonThreshold;
  });
  for (const e of soonEscrows) {
    const daysLeft = Math.ceil((new Date(e.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (e.employer) {
      await createNotification({
        recipient: e.employer,
        escrowId: e.id,
        type: "deadline_soon",
        message: `⏰ "${e.title}" deadline is in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Take action if needed.`,
      });
    }
    if (e.worker) {
      await createNotification({
        recipient: e.worker,
        escrowId: e.id,
        type: "deadline_soon",
        message: `⏰ Deadline for "${e.title}" is in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Submit your work soon!`,
      });
    }
  }

  const expired = escrows.filter((e) => {
    if (!e.deadline) return false;
    if (e.status === "completed" || e.status === "cancelled") return false;
    if (e.worker) return false; // sudah hire, jangan auto-cancel
    return new Date(e.deadline) < now;
  });

  if (expired.length === 0) return;

  console.log(`checkAndExpireEscrows: ${expired.length} expired escrow(s) found`);

  for (const escrow of expired) {
    console.log(`Auto-expiring escrow: ${escrow.id} — deadline: ${escrow.deadline}`);
    const result = await deleteEscrow(escrow.id);
    if (result.success) {
      console.log(`✅ Auto-expired: ${escrow.id}`);
    } else if (result.error === "user_rejected") {
      console.log(`Auto-expire skipped (user rejected MetaMask): ${escrow.id}`);
    } else {
      console.error(`Auto-expire failed for ${escrow.id}:`, result.error);
    }
  }
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export async function getProposalsForEscrow(escrowId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("escrow_id", escrowId)
    .order("ai_score", { ascending: false });

  if (error) {
    console.error("Failed to fetch proposals:", error.code, error.message);
    return [];
  }
  return data ?? [];
}

interface SubmitProposalParams {
  escrowId: string;
  freelancer: string;
  content: string;
  portfolioUrl?: string;
  aiScore?: number;
  aiFeedback?: string;
}

export async function submitProposal(
  params: SubmitProposalParams
): Promise<{ success: boolean; error?: string }> {
  const { escrowId, freelancer, content, portfolioUrl, aiScore, aiFeedback } = params;

  const { data: existing } = await supabase
    .from("proposals")
    .select("id")
    .eq("escrow_id", escrowId)
    .eq("freelancer", freelancer.toLowerCase())
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You already submitted a proposal for this job." };
  }

  const finalScore = aiScore ?? Math.min(
    40 + Math.floor(content.length / 10) + (portfolioUrl ? 20 : 0),
    100
  );

  const feedbackNote = aiFeedback ? `\n\n---\nAI Feedback: ${aiFeedback}` : "";

  const { error } = await supabase.from("proposals").insert([{
    id: `prop-${Date.now()}`,
    escrow_id: escrowId,
    freelancer: freelancer.toLowerCase(),
    content: content + feedbackNote,
    portfolio_url: portfolioUrl ?? "",
    ai_score: finalScore,
    status: "pending",
    created_at: new Date().toISOString(),
  }]);

  if (error) {
    console.error("Proposal insert error:", error.code, error.message);
    return { success: false, error: error.message };
  }

  // Notif ke employer
  const escrow = escrows.find((e) => e.id === escrowId);
  if (escrow?.employer) {
    const profile = await getProfile(freelancer);
    const displayName = profile?.name || `${freelancer.slice(0, 6)}...${freelancer.slice(-4)}`;
    await createNotification({
      recipient: escrow.employer,
      escrowId,
      type: "proposal_received",
      message: `New proposal received for "${escrow.title}" from ${displayName}`,
    });
  }

  return { success: true };
}

export async function updateProposalStatus(
  proposalId: string,
  status: "pending" | "accepted" | "rejected",
  freelancerAddress?: string,
  escrowId?: string
): Promise<void> {
  const { error } = await supabase
    .from("proposals")
    .update({ status })
    .eq("id", proposalId);

  if (error) { console.error("Proposal status update error:", error.code, error.message); return; }

  if (freelancerAddress && escrowId && status !== "pending") {
    const escrow = escrows.find((e) => e.id === escrowId);
    await createNotification({
      recipient: freelancerAddress,
      escrowId,
      type: status === "accepted" ? "proposal_accepted" : "proposal_rejected",
      message: status === "accepted"
        ? `🎉 Your proposal for "${escrow?.title ?? "a project"}" was accepted! Check your dashboard.`
        : `Your proposal for "${escrow?.title ?? "a project"}" was not selected this time.`,
    });
  }
}

// ─── Get proposals by freelancer ──────────────────────────────────────────────
export async function getProposalsByFreelancer(freelancerAddress: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("*, escrows(id, title, description, status, total_amount, employer)")
    .eq("freelancer", freelancerAddress.toLowerCase())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch freelancer proposals:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── Cancel proposal (only if still pending / not hired) ─────────────────────
export async function cancelProposal(
  proposalId: string
): Promise<{ success: boolean; error?: string }> {
  // Cek dulu status proposal — tidak boleh cancel kalau sudah accepted
  const { data: proposal, error: fetchErr } = await supabase
    .from("proposals")
    .select("status")
    .eq("id", proposalId)
    .maybeSingle();  // pakai maybeSingle agar tidak error kalau tidak ketemu

  if (fetchErr) {
    console.error("cancelProposal fetch error:", fetchErr.message);
    return { success: false, error: fetchErr.message };
  }
  if (!proposal) return { success: false, error: "Proposal not found" };
  if (proposal.status === "accepted") return { success: false, error: "Cannot withdraw — you have already been hired for this project." };

  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", proposalId);

  if (error) {
    console.error("cancelProposal delete error:", error.message, error.code);
    // Cek apakah RLS yang block
    if (error.code === "42501") return { success: false, error: "Permission denied — RLS policy belum diset. Jalankan migration_proposals_rls.sql di Supabase." };
    return { success: false, error: error.message };
  }
  return { success: true };
}