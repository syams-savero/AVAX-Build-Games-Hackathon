'use client';

import { Sidebar } from "@/components/sidebar";
import {
  Briefcase,
  TrendingUp,
  Users,
  ShieldCheck,
  Plus,
  Search,
  ArrowUpRight,
  Clock,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AppHome() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 pt-24 text-slate-900">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Dashboard Overview</h1>
              <p className="text-slate-500 font-medium text-sm mt-1">Lacak project dan monitoring AI Agent Anda secara real-time.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kontrak..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-48 transition-all"
                />
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 px-6 font-bold h-11">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Button>
            </div>
          </header>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Stats Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Value Secured</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">2,450.00 KITE</h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Trust Reputation</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Exquisite (98%)</h2>
              </div>
            </div>

            {/* Active Contracts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Ongoing Contracts</h3>
                <button className="text-emerald-600 text-xs font-black hover:underline flex items-center gap-1">
                  View All <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {[1, 2].map((i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 4 }}
                  className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between group cursor-pointer shadow-sm hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">Web3 Mobile App UI</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">0x8a23...f219</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-bold text-emerald-600">Milestone 2/3</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">800.00 KITE</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Pending Audit</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
