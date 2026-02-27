import { EscrowDashboard } from "@/components/escrow-dashboard";

export const metadata = {
  title: "Dashboard | ChainLancer",
  description:
    "Manage your escrow smart contracts on the Kite AI Testnet blockchain",
};

export default function DashboardPage() {
  return (
    <main>
      <EscrowDashboard />
    </main>
  );
}
