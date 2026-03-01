"use client";

import { type EscrowContract, type Milestone } from "./kite-config";

// In-memory store for demo purposes. In production, this would be backed by smart contracts.
let escrows: EscrowContract[] = [
  {
    id: "esc-001",
    title: "Landing Page Redesign",
    description:
      "Complete redesign of company landing page with modern UI/UX patterns and responsive design.",
    employer: "0x1234...abcd",
    worker: "0x5678...efgh",
    totalAmount: "500",
    milestones: [
      {
        id: 1,
        title: "Wireframe & Mockup",
        description: "Create wireframes and high-fidelity mockups",
        amount: "150",
        status: "completed",
      },
      {
        id: 2,
        title: "Frontend Development",
        description: "Develop the frontend with React and Tailwind",
        amount: "250",
        status: "in_progress",
      },
      {
        id: 3,
        title: "Testing & Deployment",
        description: "QA testing and production deployment",
        amount: "100",
        status: "pending",
      },
    ],
    status: "in_progress",
    createdAt: "2026-02-18T10:00:00Z",
    contractAddress: "0xabc123...def456",
  },
  {
    id: "esc-002",
    title: "Smart Contract Audit",
    description:
      "Security audit of ERC-20 token smart contract including vulnerability assessment.",
    employer: "0x9012...ijkl",
    worker: "0x3456...mnop",
    totalAmount: "800",
    milestones: [
      {
        id: 1,
        title: "Initial Review",
        description: "First pass code review and automated scanning",
        amount: "300",
        status: "completed",
      },
      {
        id: 2,
        title: "Detailed Report",
        description: "Comprehensive vulnerability report with recommendations",
        amount: "500",
        status: "pending",
      },
    ],
    status: "in_progress",
    createdAt: "2026-02-20T14:30:00Z",
    contractAddress: "0xdef789...ghi012",
  },
];

let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function getEscrows(): EscrowContract[] {
  return [...escrows];
}

export function getEscrowById(id: string): EscrowContract | undefined {
  return escrows.find((e) => e.id === id);
}

export function addEscrow(escrow: Omit<EscrowContract, "id" | "createdAt">): EscrowContract {
  const newEscrow: EscrowContract = {
    ...escrow,
    id: `esc-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  escrows = [newEscrow, ...escrows];
  notify();
  return newEscrow;
}

export function updateMilestoneStatus(
  escrowId: string,
  milestoneId: number,
  status: Milestone["status"]
) {
  escrows = escrows.map((e) => {
    if (e.id !== escrowId) return e;
    const milestones = e.milestones.map((m) =>
      m.id === milestoneId ? { ...m, status } : m
    );
    const allCompleted = milestones.every((m) => m.status === "completed");
    return {
      ...e,
      milestones,
      status: allCompleted ? "completed" : e.status,
    };
  });
  notify();
}

export function assignWorker(escrowId: string, workerAddress: string) {
  escrows = escrows.map((e) => {
    if (e.id !== escrowId) return e;
    return {
      ...e,
      worker: workerAddress,
      status: "funded", // Mark as funded/active when worker is assigned in this demo flow
    };
  });
  notify();
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
