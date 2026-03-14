"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@/lib/wallet-context";
import {
    fetchMessages,
    sendMessage,
    subscribeToMessages,
    type Message,
} from "../lib/chat-notif-store";
import { getEscrows } from "../lib/escrow-store";
import { shortenAddress } from "../lib/kite-config";
import type { EscrowContract } from "../lib/kite-config";
import {
    X,
    Send,
    Globe,
    FolderOpen,
    ChevronLeft,
    Loader2,
    MessageSquare,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatView = "tab-select" | "global" | "project-list" | "project-chat";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function formatDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
    msg,
    isMe,
}: {
    msg: Message;
    isMe: boolean;
}) {
    return (
        <div className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
            {!isMe && (
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {shortenAddress(msg.sender)}
                </span>
            )}
            <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    }`}
            >
                {msg.content}
            </div>
            <span className="text-[9px] text-slate-400 px-1">{formatTime(msg.createdAt)}</span>
        </div>
    );
}

// ─── Messages List ────────────────────────────────────────────────────────────

function MessagesList({
    messages,
    walletAddress,
    loading,
}: {
    messages: Message[];
    walletAddress: string;
    loading: boolean;
}) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
                <MessageSquare className="h-8 w-8 opacity-30" />
                <p className="text-xs font-medium">No messages yet. Say hi!</p>
            </div>
        );
    }

    // Group messages by date
    const grouped: { date: string; msgs: Message[] }[] = [];
    for (const msg of messages) {
        const date = formatDate(msg.createdAt);
        if (!grouped.length || grouped[grouped.length - 1].date !== date) {
            grouped.push({ date, msgs: [msg] });
        } else {
            grouped[grouped.length - 1].msgs.push(msg);
        }
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {grouped.map(({ date, msgs }) => (
                <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{date}</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    {msgs.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isMe={msg.sender.toLowerCase() === walletAddress.toLowerCase()}
                        />
                    ))}
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}

// ─── Chat Input ───────────────────────────────────────────────────────────────

function ChatInput({
    onSend,
    disabled,
}: {
    onSend: (text: string) => Promise<void>;
    disabled?: boolean;
}) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if (!text.trim() || sending || disabled) return;
        setSending(true);
        await onSend(text.trim());
        setText("");
        setSending(false);
        inputRef.current?.focus();
    };

    return (
        <div className="border-t border-slate-100 px-3 py-3 flex gap-2 items-center">
            <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={disabled ? "Connect wallet to chat..." : "Type a message..."}
                disabled={disabled || sending}
                maxLength={1000}
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50"
            />
            <button
                onClick={handleSend}
                disabled={!text.trim() || sending || disabled}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </button>
        </div>
    );
}

// ─── Main Chat Panel ──────────────────────────────────────────────────────────

export function ChatPanel({ onClose }: { onClose: () => void }) {
    const { address, isConnected } = useWallet();
    const [view, setView] = useState<ChatView>("tab-select");
    const [activeEscrowId, setActiveEscrowId] = useState<string | null>(null);
    const [activeEscrow, setActiveEscrow] = useState<EscrowContract | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [myProjects, setMyProjects] = useState<EscrowContract[]>([]);

    // Load projects user is involved in
    useEffect(() => {
        if (!address) return;
        const all = getEscrows();
        const involved = all.filter(
            (e) =>
                e.employer?.toLowerCase() === address.toLowerCase() ||
                e.worker?.toLowerCase() === address.toLowerCase()
        );
        setMyProjects(involved);
    }, [address]);

    // Load + subscribe dalam satu effect per view
    useEffect(() => {
        if (view !== "global" && view !== "project-chat") return;
        const escrowId = view === "global" ? null : activeEscrowId;
        if (view === "project-chat" && !escrowId) return;

        let cancelled = false;
        setLoadingMsgs(true);
        fetchMessages(escrowId).then((msgs) => {
            if (!cancelled) {
                setMessages(msgs);
                setLoadingMsgs(false);
            }
        });

        const unsub = subscribeToMessages(escrowId, (msg: Message) => {
            if (cancelled) return;
            setMessages((prev) => {
                if (prev.find((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        return () => {
            cancelled = true;
            unsub?.();
        };
    }, [view, activeEscrowId]);

    const handleSend = async (text: string) => {
        if (!address || !isConnected) return;
        const escrowId = view === "global" ? null : activeEscrowId;
        await sendMessage(address, text, escrowId);
    };

    const openProject = (escrow: EscrowContract) => {
        setActiveEscrowId(escrow.id);
        setActiveEscrow(escrow);
        setView("project-chat");
    };

    const chatTitle =
        view === "global"
            ? "Global Chat"
            : view === "project-chat" && activeEscrow
                ? activeEscrow.title
                : "Messages";

    const showChat = view === "global" || view === "project-chat";
    const showBack = view !== "tab-select";

    return (
        <div className="absolute top-12 right-0 z-[9998] flex flex-col w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.12))" }}>
            {/* Arrow pointer */}
            <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45 z-10" />
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
                {showBack && (
                    <button
                        onClick={() => {
                            if (view === "project-chat") setView("project-list");
                            else setView("tab-select");
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{chatTitle}</p>
                    {view === "project-chat" && activeEscrow && (
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Private Chat
                        </p>
                    )}
                    {view === "global" && (
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Public Room
                        </p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Tab Select */}
            {view === "tab-select" && (
                <div className="flex-1 flex flex-col gap-3 p-4 justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">
                        Where do you want to chat?
                    </p>
                    <button
                        onClick={() => setView("global")}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-all">
                            <Globe className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-slate-900">Global Chat</p>
                            <p className="text-xs text-slate-500">Open to everyone on ChainLancer</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setView("project-list")}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-all">
                            <FolderOpen className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-slate-900">Project Chats</p>
                            <p className="text-xs text-slate-500">Private chat with your employer / freelancer</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Project List */}
            {view === "project-list" && (
                <div className="flex-1 overflow-y-auto">
                    {myProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                            <FolderOpen className="h-8 w-8 opacity-30" />
                            <p className="text-xs font-medium">No active projects</p>
                            <p className="text-[10px] text-slate-300">Join or create a project to chat</p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 pb-1">
                                Your Projects ({myProjects.length})
                            </p>
                            {myProjects.map((escrow) => (
                                <button
                                    key={escrow.id}
                                    onClick={() => openProject(escrow)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left"
                                >
                                    <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-black text-emerald-700">
                                            {escrow.title.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{escrow.title}</p>
                                        <p className="text-[10px] text-slate-500">
                                            {escrow.worker
                                                ? `w/ ${shortenAddress(escrow.employer?.toLowerCase() === address?.toLowerCase() ? escrow.worker : escrow.employer)}`
                                                : "No freelancer yet"}
                                        </p>
                                    </div>
                                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${escrow.status === "completed" ? "bg-slate-300" :
                                        escrow.status === "funded" ? "bg-emerald-400" : "bg-amber-400"
                                        }`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Chat View */}
            {showChat && (
                <>
                    <MessagesList
                        messages={messages}
                        walletAddress={address ?? ""}
                        loading={loadingMsgs}
                    />
                    <ChatInput
                        onSend={handleSend}
                        disabled={!isConnected || !address}
                    />
                </>
            )}
        </div>
    );
}