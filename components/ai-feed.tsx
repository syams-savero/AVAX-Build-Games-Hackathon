'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Terminal as TerminalIcon, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'process' | 'error';
}

const INITIAL_LOGS: LogEntry[] = [
    { id: '1', timestamp: '17:42:01', message: 'Kite AI Node connected: 0x2368', type: 'info' },
    { id: '2', timestamp: '17:42:05', message: 'Agent Passport verified. Session active.', type: 'success' },
];

const RANDOM_LOGS = [
    "Scanning marketplace for matching opportunities...",
    "Monitoring smart contract 0x7a21... for event 'MilestoneSubmitted'",
    "Vetting applicant 0xde81... using performance history",
    "AI Technical Audit in progress: Commit hash 8af21",
    "Adjusting escrow game theory parameters for optimized security",
    "Syncing with Avalanche P-Chain indexer...",
    "Automating payment release for Milestone 2: 50% KITE"
];

export function AIFeed() {
    const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const newLog: LogEntry = {
                id: Math.random().toString(),
                timestamp: new Date().toLocaleTimeString([], { hour12: false }),
                message: RANDOM_LOGS[Math.floor(Math.random() * RANDOM_LOGS.length)],
                type: Math.random() > 0.8 ? 'success' : 'process'
            };
            setLogs(prev => [...prev.slice(-15), newLog]);
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden flex flex-col h-[500px] shadow-2xl shadow-indigo-500/10">
            <div className="p-4 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Live AI Agent Feed</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/30" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed scrollbar-hide"
            >
                <AnimatePresence mode="popLayout">
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-3 items-start"
                        >
                            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                            <span className={cn(
                                "flex-1",
                                log.type === 'success' ? "text-emerald-400" :
                                    log.type === 'error' ? "text-red-400" :
                                        "text-slate-300"
                            )}>
                                {log.type === 'process' && <Loader2 className="inline w-3 h-3 mr-2 animate-spin-slow opacity-50" />}
                                {log.type === 'success' && <CheckCircle2 className="inline w-3 h-3 mr-2 text-emerald-500" />}
                                {log.message}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="p-4 bg-emerald-600/5 border-t border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-center">
                    Agent Performance: <span className="text-emerald-400">99.9% ACCURACY</span> • <span className="text-indigo-400">KITE AI PRIMARY</span>
                </p>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
