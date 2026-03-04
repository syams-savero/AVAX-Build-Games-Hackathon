import { type EscrowContract, type Milestone } from "./kite-config";
import { supabase } from "./supabase";

// In-memory store that syncs with Supabase
let escrows: EscrowContract[] = [];
let listeners: (() => void)[] = [];

// Initialize: Load from Supabase if available
async function load() {
  try {
    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data) {
      // Map snake_case from DB to camelCase for the app
      escrows = data.map((item: any) => ({
        ...item,
        totalAmount: item.total_amount,
        createdAt: item.created_at,
        contractAddress: item.contract_address,
        riskLevel: item.risk_level,
        githubUrl: item.github_url,
        aiAuditResult: item.ai_audit_result,
        techStack: item.tech_stack,
        employer: item.employer,
        worker: item.worker
      })) as EscrowContract[];
      notify();
    }
  } catch (err: any) {
    console.error("Supabase load error:", err.message || err);
  }
}

// Initial load
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
    worker: newEscrow.worker,
    total_amount: newEscrow.totalAmount,
    milestones: newEscrow.milestones,
    status: newEscrow.status,
    created_at: newEscrow.createdAt,
    contract_address: newEscrow.contractAddress,
    team: newEscrow.team,
    risk_level: newEscrow.riskLevel,
    duration: newEscrow.duration,
    tech_stack: newEscrow.techStack,
    github_url: newEscrow.githubUrl,
    ai_audit_result: newEscrow.aiAuditResult
  };

  const { error } = await supabase.from('escrows').insert([dbData]);
  if (error) {
    console.error("Supabase insert error:", error);
    // Optionally rollback local state or show error
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

    if (error) console.error("Supabase update error:", error);
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

    if (error) console.error("Supabase worker assignment error:", error);
  }
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
