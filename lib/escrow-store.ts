import { type EscrowContract, type Milestone } from "./kite-config";
import { supabase } from "./supabase";

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

supabase
  .channel("escrows-realtime")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "escrows" },
    async () => {
      await load();
    }
  )
  .subscribe();

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

  return { success: true };
}

export async function updateProposalStatus(
  proposalId: string,
  status: "pending" | "accepted" | "rejected"
): Promise<void> {
  const { error } = await supabase
    .from("proposals")
    .update({ status })
    .eq("id", proposalId);

  if (error) console.error("Proposal status update error:", error.code, error.message);
}