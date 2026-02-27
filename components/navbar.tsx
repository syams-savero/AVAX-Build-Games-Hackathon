"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { KITE_TESTNET } from "@/lib/kite-config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wallet,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
  AlertTriangle,
  Copy,
  ArrowRight,
  Check,
} from "lucide-react";

const employerLinks = [
  { href: "/chat", label: "Hire AI Agent" },
];

const freelancerLinks = [
  { href: "/marketplace", label: "Find Work" },
];

const commonLinks = [
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    address,
    shortAddress,
    balance,
    isConnected,
    isConnecting,
    isCorrectChain,
    connect,
    disconnect,
    switchToKiteTestnet,
  } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-xl font-black tracking-tight text-slate-900 hover:text-emerald-600 transition-colors">
            ChainLancer
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {/* Employer Links */}
          {employerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold tracking-tight transition-all ${pathname === link.href
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-center gap-2">
                {link.label}
              </div>
            </Link>
          ))}
          {/* Freelancer Links */}
          {freelancerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold tracking-tight transition-all ${pathname === link.href
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-center gap-2">
                {link.label}
              </div>
            </Link>
          ))}
          {/* Common Links */}
          {commonLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold tracking-tight transition-all ${pathname === link.href
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-center gap-2">
                {link.label}
              </div>
            </Link>
          ))}
        </nav>

        {/* Wallet */}
        <div className="hidden items-center gap-3 md:flex">
          {isConnected && !isCorrectChain && (
            <Button
              variant="destructive"
              size="sm"
              onClick={switchToKiteTestnet}
              className="gap-1.5 h-10 rounded-xl px-4 font-bold"
            >
              <AlertTriangle className="h-4 w-4" />
              Switch Network
            </Button>
          )}

          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-3 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-slate-900 h-11 px-5 rounded-xl font-bold"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {shortAddress}
                  <ChevronDown className="h-4 w-4 text-emerald-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 bg-white shadow-2xl">
                <div className="px-3 py-3 bg-slate-50/50 rounded-xl mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {balance} <span className="text-xs font-bold text-emerald-600">KITE</span>
                  </p>
                </div>
                <DropdownMenuSeparator className="my-1 bg-slate-50" />
                <DropdownMenuItem onClick={handleCopy} className="gap-3 h-10 rounded-lg cursor-pointer font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700">
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Address"}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={`${KITE_TESTNET.blockExplorerUrl}address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-3 h-10 rounded-lg cursor-pointer font-bold text-slate-600 focus:bg-emerald-50 focus:text-emerald-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Explorer
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-50" />
                <DropdownMenuItem onClick={disconnect} className="gap-3 h-10 rounded-lg cursor-pointer font-bold text-red-600 focus:bg-red-50 focus:text-red-700">
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={connect} disabled={isConnecting} className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20">
              <Wallet className="h-4 w-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-900 md:hidden border border-slate-100 bg-slate-50"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white p-6 md:hidden animate-in fade-in slide-in-from-top-4">
          <nav className="flex flex-col gap-6">
            <div className="space-y-2">
              <span className="px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employers</span>
              {employerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex flex-col rounded-xl px-5 py-3 tracking-tight transition-all ${pathname === link.href ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <span className="text-sm font-bold">{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Freelancers</span>
              {freelancerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex flex-col rounded-xl px-5 py-3 tracking-tight transition-all ${pathname === link.href ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <span className="text-sm font-bold">{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              {commonLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-5 py-4 tracking-tight transition-all ${pathname === link.href ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-emerald-50 text-emerald-700"}`}
                >
                  <span className="text-sm font-black">{link.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </nav>
          <div className="mt-6 border-t border-slate-50 pt-6">
            {isConnected ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Connected Wallet</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-slate-800">{shortAddress}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-lg border border-emerald-100">{balance} KITE</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={disconnect}
                  className="w-full h-12 rounded-2xl border-red-100 text-red-600 font-bold hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connect}
                disabled={isConnecting}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
              >
                <Wallet className="h-5 w-5 mr-3" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
