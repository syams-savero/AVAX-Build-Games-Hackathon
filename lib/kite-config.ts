export const KITE_TESTNET = {
  chainId: 2368,
  chainIdHex: "0x940",
  chainName: "KiteAI Testnet",
  rpcUrl: "https://rpc-testnet.gokite.ai/",
  blockExplorerUrl: "https://testnet.kitescan.ai/",
  faucetUrl: "https://faucet.gokite.ai",
  nativeCurrency: {
    name: "KITE",
    symbol: "KITE",
    decimals: 18,
  },
} as const;

export const ESCROW_STATUS = {
  CREATED: "created",
  FUNDED: "funded",
  IN_PROGRESS: "in_progress",
  MILESTONE_COMPLETED: "milestone_completed",
  COMPLETED: "completed",
  DISPUTED: "disputed",
  CANCELLED: "cancelled",
} as const;

export type EscrowStatus = (typeof ESCROW_STATUS)[keyof typeof ESCROW_STATUS];

export interface Milestone {
  id: number;
  title: string;
  description: string;
  amount: string;
  status: "pending" | "in_progress" | "completed" | "disputed";
  deadline?: string;
  earlyBonus?: string;
}

export interface TeamMember {
  role: string;
  description: string;
  budget: string;
}

export interface EscrowContract {
  id: string;
  title: string;
  description: string;
  employer: string;
  worker: string;
  totalAmount: string;
  milestones: Milestone[];
  status: EscrowStatus;
  createdAt: string;
  contractAddress?: string;
  team?: TeamMember[];
  riskLevel?: "Low" | "Medium" | "High";
  duration?: string;
  aiAuditResult?: string;
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatKite(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0 KITE";
  return `${num.toLocaleString()} KITE`;
}
