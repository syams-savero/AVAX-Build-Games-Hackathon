"use client";

import { TrendingUp } from "lucide-react"
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { ACTIVE_NETWORK } from "@/lib/kite-config";
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
  Bell,
  MessageSquare,
} from "lucide-react";

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
    switchToActiveNetwork,
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
        <Link href="/" className="flex items-center group">
          <span className="text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-emerald-600">
            Chain
          </span>
          <span className="text-xl font-black tracking-tight text-emerald-600 transition-colors group-hover:text-slate-900">
            Lancer
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {[
            { href: "/", label: "Home" },
            { href: "/chat", label: "Consult Assistant" },
            { href: "/jobs", label: "Job Board" },
            { href: "/dashboard", label: "Dashboard" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-bold tracking-tight transition-all ${pathname === link.href
                ? "text-emerald-600"
                : "text-slate-600 hover:text-emerald-600"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 md:flex">
            {!isCorrectChain && isConnected && (
              <Button
                variant="destructive"
                size="sm"
                onClick={switchToActiveNetwork}
                className="h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest animate-pulse"
              >
                <AlertTriangle className="h-3 w-3 mr-2" />
                Switch to {ACTIVE_NETWORK.chainName}
              </Button>
            )}
            <button className="text-slate-500 hover:text-slate-900 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-slate-500 hover:text-slate-900 transition-colors">
              <MessageSquare className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-500 transition-all">
              {/* Placeholder for Avatar */}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 px-5 rounded-xl border-slate-200 bg-white font-black tracking-tight flex items-center gap-3 hover:bg-slate-50 transition-all">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-900">{shortAddress}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-xl">
                  <div className="p-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance</p>
                    <p className="text-lg font-black text-slate-900">{balance} {ACTIVE_NETWORK.nativeCurrency.symbol}</p>
                  </div>
                  <Link href="/dashboard" className="block">
                    <DropdownMenuItem className="rounded-xl h-11 font-bold text-slate-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer gap-2">
                      <TrendingUp className="h-4 w-4" />
                      My Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleCopy} className="rounded-xl h-11 font-bold text-slate-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Address"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={disconnect} className="rounded-xl h-11 font-bold text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer gap-2">
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={connect}
                disabled={isConnecting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 rounded-xl font-black tracking-tight shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
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
              {[
                { href: "/", label: "Home" },
                { href: "/chat", label: "Consult Assistant" },
                { href: "/jobs", label: "Job Board" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((link) => (
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
                    <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-lg border border-emerald-100">{balance} {ACTIVE_NETWORK.nativeCurrency.symbol}</span>
                  </div>
                </div>
                {!isCorrectChain && (
                  <Button
                    variant="destructive"
                    onClick={switchToActiveNetwork}
                    className="w-full h-12 rounded-2xl font-bold animate-pulse"
                  >
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    Switch to {ACTIVE_NETWORK.chainName}
                  </Button>
                )}
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
