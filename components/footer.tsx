import { Zap } from "lucide-react";
import { KITE_TESTNET } from "@/lib/kite-config";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">ChainLancer</span>
          <span className="text-sm text-slate-500">
            {"| AI-Driven Escrow on Kite"}
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href={KITE_TESTNET.blockExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Block Explorer
          </a>
          <a
            href={KITE_TESTNET.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Faucet
          </a>
          <a
            href="https://docs.gokite.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
