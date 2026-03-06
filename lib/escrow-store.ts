import { type EscrowContract, type Milestone } from "./kite-config";
import { supabase } from "./supabase";

// In-memory store that syncs with Supabase
let escrows: EscrowContract[] = [];
let listeners: (() => void)[] = [];

// Initialize: Load from Supabase if available
async function load() {
  console.log("EscrowStore: Initializing load from Supabase...");
  try {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data) {
      console.log(`EscrowStore: Successfully loaded ${data.length} items from Supabase.`);
      escrows = data.map((item: any) => ({
        ...item,
        onChainId: item.on_chain_id,
        totalAmount: item.total_amount,
        createdAt: item.created_at,
        contractAddress: item.contract_address,
        riskLevel: item.risk_level,
        githubUrl: item.github_url,
        aiAuditResult: item.ai_audit_result,
        techStack: Array.isArray(item.tech_stack) ? item.tech_stack : (item.tech_stack ? [item.tech_stack] : []),
        employer: item.employer,
        worker: item.worker
      })) as EscrowContract[];
      notify();
    } else {
      console.log("EscrowStore: No data returned from Supabase.");
    }
  } catch (err: any) {
    console.error("EscrowStore: Supabase load error:", err.message || err);
  }
}

export async function refreshEscrows() {
  await load();
}

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

  // Immediate local update for UI responsiveness
  escrows = [newEscrow, ...escrows];
  notify();

  // Map to snake_case for Supabase insertion
  const dbData = {
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
    on_chain_id: newEscrow.onChainId,
    team: newEscrow.team ?? null,
    risk_level: newEscrow.riskLevel,
    duration: newEscrow.duration,
    tech_stack: newEscrow.techStack ?? [],
    github_url: newEscrow.githubUrl ?? "",
    ai_audit_result: newEscrow.aiAuditResult ?? "",
  };

  console.log("EscrowStore: Attempting Supabase insert with data:", JSON.stringify(dbData, null, 2));

  const { error } = await supabase.from('escrows').insert([dbData]);

  if (error) {
    // ✅ Detailed error logging — check browser console for these
    console.error("━━━ Supabase Insert Error ━━━");
    console.error("code   :", error.code);
    console.error("message:", error.message);
    console.error("details:", error.details);
    console.error("hint   :", error.hint);
    console.error("full   :", JSON.stringify(error, null, 2));
    console.error("━━━ Data Sent ━━━");
    console.error(JSON.stringify(dbData, null, 2));

    // Common fixes hint
    if (error.code === "42501") {
      console.error("🔒 RLS POLICY BLOCKING INSERT — Add this in Supabase SQL Editor:");
      console.error(`CREATE POLICY "Allow insert" ON escrows FOR INSERT WITH CHECK (true);`);
    }
    if (error.code === "23502") {
      console.error("⚠️ NOT NULL VIOLATION — A required column is missing or null.");
    }
    if (error.code === "PGRST204") {
      console.error("🔃 SCHEMA CACHE ERROR — Supabase doesn't see your new column yet.");
      console.error("👉 Solution: Refresh your browser or wait 2-3 minutes for Supabase to sync.");
    }
    if (error.code === "42703") {
      console.error("⚠️ COLUMN NOT FOUND — The column 'on_chain_id' doesn't exist in your table.");
    }
  } else {
    console.log("EscrowStore: ✅ Insert successful!");
  }

  return newEscrow;
}

export async function updateMilestoneStatus(
  escrowId: string,
  milestoneId: number,
  status: Milestone["status"]
) {
  let updatedEscrow: EscrowContract | null = null;

  escrows = escrows.map((e: EscrowContract) => {
    if (e.id !== escrowId) return e;
    const milestones = e.milestones.map((m: Milestone) =>
      m.id === milestoneId ? { ...m, status } : m
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

  if (updatedEscrow) {
    const { error } = await supabase
      .from('escrows')
      .update({
        milestones: (updatedEscrow as EscrowContract).milestones,
        status: (updatedEscrow as EscrowContract).status,
      })
      .eq('id', escrowId);

    if (error) console.error("Supabase update error:", error.message, error.hint);
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
      .from('escrows')
      .update({
        worker: workerAddress,
        status: "funded",
      })
      .eq('id', escrowId);

    if (error) console.error("Supabase worker assignment error:", error.message, error.hint);
  }
}

// Proposals management
export async function submitProposal(data: {
  escrowId: string;
  freelancer: string;
  content: string;
  portfolioUrl: string;
  aiScore: number;
  aiFeedback: string;
}) {
  const proposal = {
    id: `prop-${Date.now()}`,
    escrow_id: data.escrowId,
    freelancer: data.freelancer,
    content: data.content,
    portfolio_url: data.portfolioUrl,
    ai_score: data.aiScore,
    ai_feedback: data.aiFeedback,
    status: 'pending'
  };

  const { error } = await supabase.from('proposals').insert([proposal]);
  if (error) throw error;
  notify();
  return proposal;
}

export async function getProposalsForEscrow(escrowId: string) {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateProposalStatus(proposalId: string, status: 'accepted' | 'rejected') {
  const { error } = await supabase
    .from('proposals')
    .update({ status })
    .eq('id', proposalId);

  if (error) throw error;
  notify();
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}