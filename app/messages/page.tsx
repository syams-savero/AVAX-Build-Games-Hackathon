// app/messages/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import {
    getMessages, sendMessage, subscribeToMessages,
    getDmConversations, getDmMessages, sendDmMessage, subscribeToDm, getDmRoomId, deleteConversation, hideDmConversation,
    editMessage, deleteMessage, hardDeleteMessage, subscribeToAllRooms, supabaseDeleteListener,
    getNotifications,
    type ChatMessage,
} from "@/lib/chat-notif-store";
import { getEscrows, reloadEscrows } from "@/lib/escrow-store";
import type { EscrowContract } from "@/lib/kite-config";
import {
    Globe, Briefcase, MessageSquare, Send, Loader2,
    Plus, ArrowLeft, Trash2, ChevronDown, ChevronUp,
    Pencil, Copy, Check, MoreHorizontal, X, ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { WalletAvatar } from "@/components/navbar";
import { toast } from "sonner";
import { getProfile } from "@/lib/profile-store";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChatRoom =
    | { type: "global" }
    | { type: "project"; escrow: EscrowContract }
    | { type: "dm"; otherAddress: string; roomId: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

function shortenAddr(addr: string) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}



// ─── Profile name cache ──────────────────────────────────────────────────────
const nameCache = new Map<string, string>();
async function resolveDisplayName(address: string): Promise<string> {
    if (nameCache.has(address)) return nameCache.get(address)!;
    const prof = await getProfile(address);
    const name = prof?.name || shortenAddr(address);
    nameCache.set(address, name);
    return name;
}

// Admin address — set NEXT_PUBLIC_ADMIN_ADDRESS in .env
const ADMIN_ADDRESS = (process.env.NEXT_PUBLIC_ADMIN_ADDRESS ?? "").toLowerCase();

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface ContextMenuProps {
    x: number; y: number;
    isMe: boolean;
    isAdmin: boolean;
    isDeleted: boolean;
    onCopy: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onSelect: () => void;
    onClose: () => void;
}

function ContextMenu({ x, y, isMe, isAdmin, isDeleted, onCopy, onEdit, onDelete, onSelect, onClose }: ContextMenuProps) {
    useEffect(() => {
        const close = () => onClose();
        window.addEventListener("click", close);
        window.addEventListener("keydown", (e) => e.key === "Escape" && onClose());
        return () => window.removeEventListener("click", close);
    }, [onClose]);

    return (
        <div
            className="fixed z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 py-1.5 min-w-[150px] overflow-hidden"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            {!isDeleted && (
                <button onClick={onCopy}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left">
                    <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy
                </button>
            )}
            {isMe && !isDeleted && (
                <button onClick={onEdit}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left">
                    <Pencil className="h-3.5 w-3.5 text-slate-400" /> Edit
                </button>
            )}
            <button onClick={onSelect}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left">
                <Check className="h-3.5 w-3.5 text-slate-400" /> Select
            </button>
            {(isMe || isAdmin) && (
                <button onClick={onDelete}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors text-left">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
            )}
        </div>
    );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({
    msg, isMe, currentAddress,
    onEdit, onDelete, onOpenMenu, isSelected, onSelect, selectMode, onDismiss,
}: {
    msg: ChatMessage;
    isMe: boolean;
    currentAddress: string;
    onEdit: (msg: ChatMessage) => void;
    onDelete: (msgId: string) => void;
    onOpenMenu: (e: React.MouseEvent | React.TouchEvent, msg: ChatMessage) => void;
    isSelected: boolean;
    onSelect: (msgId: string) => void;
    selectMode: boolean;
    onDismiss?: () => void;
}) {
    const [displayName, setDisplayName] = useState(shortenAddr(msg.sender));
    const [copied, setCopied] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isMe) resolveDisplayName(msg.sender).then(setDisplayName);
    }, [msg.sender, isMe]);

    const handleTouchStart = (e: React.TouchEvent) => {
        longPressTimer.current = setTimeout(() => onOpenMenu(e, msg), 500);
    };
    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    return (
        <div
            className={`flex gap-2.5 group transition-colors rounded-xl px-2 py-0.5 -mx-2 ${isSelected ? "bg-emerald-50 border border-emerald-200" : "border border-transparent"
                } ${isMe ? "flex-row-reverse" : "flex-row"}`}
            onContextMenu={(e) => { e.preventDefault(); onOpenMenu(e, msg); }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Select checkbox — only visible in selectMode */}
            {selectMode && (
                <div className={`self-center ${isMe ? "order-last ml-1" : "order-first mr-1"}`}>
                    <button
                        onClick={() => onSelect(msg.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"
                            }`}
                    >
                        {isSelected && <Check className="h-3 w-3" />}
                    </button>
                </div>
            )}

            {!isMe && <WalletAvatar address={msg.sender} />}
            <div className={`max-w-[70%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && (
                    <Link href={`/profile/${msg.sender.toLowerCase()}`}
                        className="text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">
                        {displayName}
                    </Link>
                )}
                <div className="relative">
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed select-text ${msg.deleted
                            ? "bg-slate-100 border border-dashed border-slate-300 text-slate-400 italic"
                            : isMe
                                ? "bg-slate-900 text-white rounded-tr-sm"
                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                        }`}>
                        {msg.content}
                        {msg.deleted && onDismiss && (
                            <button onClick={onDismiss}
                                className="ml-2 text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center"
                                title="Hide for me">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                    {copied && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap">
                            Copied!
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">{timeAgo(msg.createdAt)}</span>
                    {msg.edited && !msg.deleted && <span className="text-[9px] text-slate-400 italic">(edited)</span>}
                </div>
            </div>
        </div>
    );
}

// ─── Chat Area ────────────────────────────────────────────────────────────────
function ChatArea({ room, address }: { room: ChatRoom; address: string }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
    const [editContent, setEditContent] = useState("");
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; msg: ChatMessage } | null>(null);
    const [selectedMsgs, setSelectedMsgs] = useState<Set<string>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [otherDisplayName, setOtherDisplayName] = useState<string | null>(null);
    // Track dismissed "deleted" placeholders — stored in localStorage per user
    const [dismissed, setDismissed] = useState<Set<string>>(() => {
        try {
            const raw = localStorage.getItem(`dismissed_msgs_${address}`);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch { return new Set(); }
    });

    const dismissPlaceholder = (msgId: string) => {
        setDismissed(prev => {
            const next = new Set(prev);
            next.add(msgId);
            try { localStorage.setItem(`dismissed_msgs_${address}`, JSON.stringify([...next])); } catch { }
            return next;
        });
    };
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isAdmin = address.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_ADDRESS ?? "").toLowerCase();

    const escrowId = room.type === "global" ? null
        : room.type === "project" ? room.escrow.id
            : room.roomId;

    const loadMessages = useCallback(async () => {
        setLoading(true);
        let msgs: ChatMessage[] = [];
        if (room.type === "global") msgs = await getMessages(null);
        else if (room.type === "project") msgs = await getMessages(room.escrow.id);
        else {
            msgs = await getDmMessages(room.roomId);
            // Load display name for DM recipient
            resolveDisplayName(room.otherAddress).then(setOtherDisplayName);
        }
        setMessages(msgs);
        setLoading(false);
    }, [room]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // Resolve DM recipient display name whenever room changes
    useEffect(() => {
        if (room.type === "dm") {
            setOtherDisplayName(null); // reset first
            resolveDisplayName(room.otherAddress).then(setOtherDisplayName);
        }
    }, [room]);

    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        let unsub: (() => void) | undefined;
        if (room.type === "dm") {
            unsub = subscribeToDm(room.roomId, (msg) => {
                setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
            });
        } else {
            unsub = subscribeToMessages(escrowId, (msg) => {
                setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
            });
        }

        // Listen for hard deletes → show placeholder
        const deleteSub = supabaseDeleteListener(escrowId, (deletedId) => {
            setMessages(prev => prev.map(m =>
                m.id === deletedId ? { ...m, deleted: true, content: "This message was deleted." } : m
            ));
        });
        const origUnsub = unsub;
        unsub = () => { origUnsub?.(); deleteSub?.(); };
        return () => unsub?.();
    }, [room, escrowId]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        setSending(true);
        const text = input.trim();
        setInput("");
        let result;
        if (room.type === "dm") {
            result = await sendDmMessage(address, room.otherAddress, text);
        } else {
            result = await sendMessage(address, text, escrowId);
        }
        if (!result.success) {
            console.error("[ChatArea] send failed:", result.error);
            toast.error(`Send failed: ${result.error ?? "Unknown error"}`);
        }
        setSending(false);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // Open context menu — single instance, closes others
    const handleOpenMenu = (e: React.MouseEvent | React.TouchEvent, msg: ChatMessage) => {
        e.preventDefault();
        const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const menuW = 160, menuH = 130;
        const x = Math.min(clientX, window.innerWidth - menuW - 8);
        const y = Math.min(clientY, window.innerHeight - menuH - 8);
        setCtxMenu({ x, y, msg });
    };

    const toggleSelect = (msgId: string) => {
        setSelectedMsgs(prev => {
            const next = new Set(prev);
            next.has(msgId) ? next.delete(msgId) : next.add(msgId);
            if (next.size === 0) setSelectMode(false);
            return next;
        });
    };

    const deleteSelected = async () => {
        for (const id of selectedMsgs) {
            await hardDeleteMessage(id);
        }
        setMessages(prev => prev.filter(m => !selectedMsgs.has(m.id)));
        setSelectedMsgs(new Set());
        setSelectMode(false);
    };

    const copySelected = () => {
        const texts = messages.filter(m => selectedMsgs.has(m.id)).map(m => m.content).join("\n");
        navigator.clipboard.writeText(texts);
        toast.success(`Copied ${selectedMsgs.size} message${selectedMsgs.size > 1 ? "s" : ""}`);
        setSelectedMsgs(new Set());
        setSelectMode(false);
    };

    // Header info
    const headerTitle = room.type === "global" ? "Global Chat"
        : room.type === "project" ? room.escrow.title
            : (otherDisplayName && otherDisplayName !== shortenAddr(room.otherAddress) ? otherDisplayName : shortenAddr(room.otherAddress));

    const headerSub = room.type === "global" ? "Open to everyone on ChainLancer"
        : room.type === "project" ? `Project · ${room.escrow.status}`
            : `${room.otherAddress.slice(0, 10)}...${room.otherAddress.slice(-6)}`; // shortened address

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                {room.type === "dm" && <WalletAvatar address={room.otherAddress} size="md" />}
                {room.type === "global" && <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center"><Globe className="h-5 w-5 text-emerald-600" /></div>}
                {room.type === "project" && <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center"><Briefcase className="h-5 w-5 text-blue-600" /></div>}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{headerTitle}</p>
                    <p className="text-[10px] text-slate-400 truncate">{headerSub}</p>
                </div>
                {room.type === "dm" && (
                    <Link href={`/profile/${room.otherAddress.toLowerCase()}`}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all shrink-0">
                        <ExternalLink className="h-3 w-3" /> Profile
                    </Link>
                )}
            </div>

            {/* Messages */}
            <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                        <MessageSquare className="h-12 w-12 opacity-20" />
                        <p className="text-sm font-bold">No messages yet</p>
                        <p className="text-xs">Be the first to say something!</p>
                    </div>
                ) : (
                    messages.filter(msg => !(msg.deleted && dismissed.has(msg.id))).map((msg) => (
                        <Bubble
                            key={msg.id}
                            msg={msg}
                            isMe={msg.sender.toLowerCase() === address.toLowerCase()}
                            currentAddress={address}
                            onEdit={(m) => { setEditingMsg(m); setEditContent(m.content); }}
                            onDelete={async (id) => {
                                await hardDeleteMessage(id);
                                setMessages(prev => prev.filter(m => m.id !== id));
                            }}
                            onOpenMenu={handleOpenMenu}
                            isSelected={selectedMsgs.has(msg.id)}
                            onSelect={toggleSelect}
                            selectMode={selectMode}
                            onDismiss={msg.deleted ? () => dismissPlaceholder(msg.id) : undefined}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Single context menu — only one at a time */}
            {ctxMenu && (
                <ContextMenu
                    x={ctxMenu.x} y={ctxMenu.y}
                    isMe={ctxMenu.msg.sender.toLowerCase() === address.toLowerCase()}
                    isAdmin={isAdmin}
                    isDeleted={!!ctxMenu.msg.deleted}
                    onCopy={() => {
                        navigator.clipboard.writeText(ctxMenu.msg.content);
                        toast.success("Copied!");
                        setCtxMenu(null);
                    }}
                    onEdit={() => { setEditingMsg(ctxMenu.msg); setEditContent(ctxMenu.msg.content); setCtxMenu(null); }}
                    onDelete={async () => {
                        await hardDeleteMessage(ctxMenu.msg.id);
                        setMessages(prev => prev.filter(m => m.id !== ctxMenu.msg.id));
                        setCtxMenu(null);
                    }}
                    onSelect={() => {
                        setSelectMode(true);
                        toggleSelect(ctxMenu.msg.id);
                        setCtxMenu(null);
                    }}
                    onClose={() => setCtxMenu(null)}
                />
            )}

            {/* Selection toolbar */}
            {selectedMsgs.size > 0 && (
                <div className="px-6 py-3 bg-slate-900 flex items-center justify-between shrink-0">
                    <span className="text-white text-xs font-black">{selectedMsgs.size} selected</span>
                    <div className="flex gap-2">
                        <button onClick={copySelected}
                            className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-1.5 transition-all">
                            <Copy className="h-3.5 w-3.5" /> Copy
                        </button>
                        {(isAdmin || [...selectedMsgs].every(id => messages.find(m => m.id === id)?.sender.toLowerCase() === address.toLowerCase())) && (
                            <button onClick={deleteSelected}
                                className="h-8 px-3 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5 transition-all">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                        )}
                        <button onClick={() => { setSelectedMsgs(new Set()); setSelectMode(false); }}
                            className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editingMsg && (
                <div className="px-6 py-3 bg-amber-50 border-t border-amber-200 shrink-0 flex items-center gap-3">
                    <Pencil className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (!editContent.trim()) return;
                                await editMessage(editingMsg.id, editContent.trim());
                                setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content: editContent.trim(), edited: true } : m));
                                setEditingMsg(null); setEditContent("");
                            }
                            if (e.key === "Escape") { setEditingMsg(null); setEditContent(""); }
                        }}
                        className="flex-1 h-9 rounded-xl border-amber-200 bg-white text-sm"
                        autoFocus
                    />
                    <button onClick={async () => {
                        if (!editContent.trim()) return;
                        await editMessage(editingMsg.id, editContent.trim());
                        setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content: editContent.trim(), edited: true } : m));
                        setEditingMsg(null); setEditContent("");
                    }} className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shrink-0">
                        Save
                    </button>
                    <button onClick={() => { setEditingMsg(null); setEditContent(""); }}
                        className="h-9 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-black transition-all shrink-0">
                        Cancel
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0">
                <div className="flex gap-3 items-center">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder={`Message ${room.type === "global" ? "everyone" : room.type === "project" ? room.escrow.title : shortenAddr(room.otherAddress)}...`}
                        ref={inputRef}
                        className="flex-1 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white h-11 text-sm"
                        disabled={sending}
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="h-11 w-11 rounded-2xl bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shrink-0"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── DM Name resolver ────────────────────────────────────────────────────────
function DmName({ address, active }: { address: string; active: boolean }) {
    const [name, setName] = useState(shortenAddr(address));
    useEffect(() => { resolveDisplayName(address).then(setName); }, [address]);
    return <p className={`text-xs font-black truncate ${active ? "text-white" : "text-slate-700"}`}>{name}</p>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
    address,
    escrows,
    dmConvos,
    activeRoom,
    onSelect,
    onNewDm,
    onDeleteDm,
    unreadCounts,
}: {
    address: string;
    escrows: EscrowContract[];
    dmConvos: { roomId: string; otherAddress: string; lastMessage: ChatMessage | null }[];
    activeRoom: ChatRoom | null;
    onSelect: (room: ChatRoom) => void;
    onNewDm: () => void;
    onDeleteDm: (roomId: string) => void;
    unreadCounts: Record<string, number>;
}) {
    const [projectsOpen, setProjectsOpen] = useState(true);
    const [dmsOpen, setDmsOpen] = useState(true);

    const myEscrows = escrows.filter((e) =>
        e.worker?.toLowerCase() === address.toLowerCase() ||
        e.employer?.toLowerCase() === address.toLowerCase()
    ).filter((e) => e.status !== "cancelled");

    const badge = (key: string) => {
        const n = unreadCounts[key] ?? 0;
        if (n === 0) return null;
        return (
            <span className="ml-auto shrink-0 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center px-1">
                {n > 99 ? "99+" : n}
            </span>
        );
    };

    const isActive = (room: ChatRoom) => {
        if (!activeRoom) return false;
        if (room.type !== activeRoom.type) return false;
        if (room.type === "project" && activeRoom.type === "project") return room.escrow.id === activeRoom.escrow.id;
        if (room.type === "dm" && activeRoom.type === "dm") return room.roomId === activeRoom.roomId;
        return true;
    };

    return (
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Link href="/dashboard" className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Link>
                <p className="text-sm font-black text-slate-900 ml-auto">Messages</p>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1">
                {/* Global Chat */}
                <div className="px-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1.5">General</p>
                    <button
                        onClick={() => onSelect({ type: "global" })}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${isActive({ type: "global" }) ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700"}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive({ type: "global" }) ? "bg-white/10" : "bg-emerald-50 border border-emerald-200"}`}>
                            <Globe className={`h-4 w-4 ${isActive({ type: "global" }) ? "text-white" : "text-emerald-600"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate">Global Chat</p>
                            <p className={`text-[10px] truncate ${isActive({ type: "global" }) ? "text-white/60" : "text-slate-400"}`}>Open to everyone</p>
                        </div>
                        {badge("global")}
                    </button>
                </div>

                {/* Project Chats — collapsible */}
                {myEscrows.length > 0 && (
                    <div className="px-3 pt-2">
                        <button
                            onClick={() => setProjectsOpen(v => !v)}
                            className="w-full flex items-center justify-between px-2 mb-1.5 group"
                        >
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projects ({myEscrows.length})</p>
                            {projectsOpen
                                ? <ChevronUp className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                                : <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />}
                        </button>
                        {projectsOpen && myEscrows.map((escrow) => {
                            const room: ChatRoom = { type: "project", escrow };
                            const active = isActive(room);
                            return (
                                <button key={escrow.id}
                                    onClick={() => onSelect(room)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${active ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700"}`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-white/10" : "bg-blue-50 border border-blue-200"}`}>
                                        <Briefcase className={`h-4 w-4 ${active ? "text-white" : "text-blue-600"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black truncate">{escrow.title}</p>
                                        <p className={`text-[10px] truncate capitalize ${active ? "text-white/60" : "text-slate-400"}`}>{escrow.status}</p>
                                    </div>
                                    {badge(escrow.id)}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Direct Messages — collapsible + deletable */}
                <div className="px-3 pt-2">
                    <div className="flex items-center justify-between px-2 mb-1.5">
                        <button onClick={() => setDmsOpen(v => !v)} className="flex items-center gap-1.5 group">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Direct Messages {dmConvos.length > 0 && `(${dmConvos.length})`}
                            </p>
                            {dmsOpen
                                ? <ChevronUp className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                                : <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />}
                        </button>
                        <button onClick={onNewDm} className="h-5 w-5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all text-slate-500">
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>

                    {dmsOpen && (
                        dmConvos.length === 0 ? (
                            <p className="text-[10px] text-slate-400 px-2 py-2">No DMs yet. Click + to start one.</p>
                        ) : (
                            dmConvos.map((convo) => {
                                const room: ChatRoom = { type: "dm", otherAddress: convo.otherAddress, roomId: convo.roomId };
                                const active = isActive(room);
                                return (
                                    <div key={convo.roomId} className="relative group/dm">
                                        <button
                                            onClick={() => onSelect(room)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left pr-9 ${active ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700"}`}
                                        >
                                            <WalletAvatar address={convo.otherAddress} />
                                            <div className="flex-1 min-w-0">
                                                <DmName address={convo.otherAddress} active={active} />
                                                {convo.lastMessage && (
                                                    <p className={`text-[10px] truncate ${active ? "text-white/60" : "text-slate-400"}`}>
                                                        {convo.lastMessage.content}
                                                    </p>
                                                )}
                                            </div>
                                            {convo.lastMessage && (
                                                <span className={`text-[9px] shrink-0 ${active ? "text-white/50" : "text-slate-400"}`}>
                                                    {timeAgo(convo.lastMessage.createdAt)}
                                                </span>
                                            )}
                                        </button>
                                        {/* Delete button — hover only */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteDm(convo.roomId); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg bg-red-50 border border-red-100 text-red-400 hover:text-red-600 hover:bg-red-100 items-center justify-center transition-all hidden group-hover/dm:flex"
                                            title="Delete conversation"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── New DM Modal ─────────────────────────────────────────────────────────────
function NewDmModal({ onStart, onClose }: { onStart: (addr: string) => void; onClose: () => void }) {
    const [input, setInput] = useState("");
    const valid = input.startsWith("0x") && input.length === 42;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
                <h3 className="text-base font-black text-slate-900">New Direct Message</h3>
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="0x... wallet address"
                    className="rounded-xl border-slate-200 text-sm font-mono"
                    autoFocus
                />
                {input && !valid && <p className="text-xs text-red-500">Enter a valid 42-char wallet address</p>}
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                    <button
                        onClick={() => valid && onStart(input.toLowerCase())}
                        disabled={!valid}
                        className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Start Chat
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Messages Page ────────────────────────────────────────────────────────────
function MessagesPageInner() {
    const { address, isConnected } = useWallet();
    const searchParams = useSearchParams();

    const [escrows, setEscrows] = useState<EscrowContract[]>([]);
    const [dmConvos, setDmConvos] = useState<{ roomId: string; otherAddress: string; lastMessage: ChatMessage | null }[]>([]);
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
    const [showNewDm, setShowNewDm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const activeRoomRef = useRef<ChatRoom | null>(null);

    useEffect(() => {
        if (!address) return;
        Promise.all([
            reloadEscrows().then(() => getEscrows()),
            getDmConversations(address),
        ]).then(([allEscrows, convos]) => {
            setEscrows(allEscrows);
            setDmConvos(convos);
            setLoading(false);

            // ── Subscribe to all rooms for unread + toast notifications ──
            const myEscrows = allEscrows.filter((e) =>
                e.worker?.toLowerCase() === address?.toLowerCase() ||
                e.employer?.toLowerCase() === address?.toLowerCase()
            ).filter((e) => e.status !== "cancelled");

            const roomIds: (string | null)[] = [
                null, // global
                ...myEscrows.map((e) => e.id),
            ];

            subscribeToAllRooms(roomIds, (msg, roomId) => {
                // Don't notify own messages
                if (msg.sender.toLowerCase() === address?.toLowerCase()) return;

                const active = activeRoomRef.current;
                const isActiveRoom =
                    (roomId === null && active?.type === "global") ||
                    (roomId !== null && active?.type === "project" && active.escrow.id === roomId);

                const isMention =
                    msg.content.toLowerCase().includes(address?.toLowerCase() ?? "__") ||
                    msg.content.toLowerCase().includes(address?.slice(0, 6).toLowerCase() ?? "__");

                const roomKey = roomId ?? "global";

                // Increment unread if not in that room
                if (!isActiveRoom) {
                    setUnreadCounts(prev => ({ ...prev, [roomKey]: (prev[roomKey] ?? 0) + 1 }));
                }

                // Toast for DM, project chat, or mention
                if (!isActiveRoom) {
                    const isProject = roomId !== null;
                    const escrow = myEscrows.find((e) => e.id === roomId);
                    const label = isProject && escrow ? escrow.title : "Global Chat";

                    if (isProject || isMention) {
                        toast(isMention ? "💬 You were mentioned!" : `💬 New message in ${label}`, {
                            description: msg.content.slice(0, 60) + (msg.content.length > 60 ? "…" : ""),
                            action: {
                                label: "View",
                                onClick: () => {
                                    if (isProject && escrow) {
                                        handleSetActiveRoom({ type: "project", escrow });
                                    } else {
                                        handleSetActiveRoom({ type: "global" });
                                    }
                                }
                            },
                            duration: 5000,
                        });
                    }
                }
            });

            // Handle URL params — ?dm=0x... or ?project=escrowId
            const dmParam = searchParams.get("dm");
            const projectParam = searchParams.get("project");
            if (dmParam) {
                const normalized = dmParam.toLowerCase();
                const roomId = getDmRoomId(address, normalized);
                setActiveRoom({ type: "dm", otherAddress: normalized, roomId });
                setDmConvos((prev) => prev.find((c) => c.roomId === roomId) ? prev : [{ roomId, otherAddress: normalized, lastMessage: null }, ...prev]);
            } else if (projectParam) {
                const escrow = allEscrows.find((e) => e.id === projectParam);
                if (escrow) setActiveRoom({ type: "project", escrow });
            } else {
                setActiveRoom({ type: "global" });
            }
        });
    }, [address, searchParams]);

    // Keep ref in sync for use inside subscriptions
    const handleSetActiveRoom = (room: ChatRoom) => {
        setActiveRoom(room);
        activeRoomRef.current = room;
        // Clear unread for this room
        const key = room.type === "global" ? "global"
            : room.type === "project" ? room.escrow.id
                : room.roomId;
        setUnreadCounts(prev => ({ ...prev, [key]: 0 }));
    };

    const handleNewDm = (toAddress: string) => {
        const normalized = toAddress.toLowerCase();
        const roomId = getDmRoomId(address!, normalized);
        const room: ChatRoom = { type: "dm", otherAddress: normalized, roomId };
        setActiveRoom(room);
        setShowNewDm(false);
        setDmConvos((prev) => prev.find((c) => c.roomId === roomId) ? prev : [{ roomId, otherAddress: normalized, lastMessage: null }, ...prev]);
    };

    const handleDeleteDm = async (roomId: string) => {
        // Remove from local list immediately
        setDmConvos((prev) => prev.filter((c) => c.roomId !== roomId));
        // If this was the active room, go to global
        if (activeRoom?.type === "dm" && activeRoom.roomId === roomId) {
            setActiveRoom({ type: "global" });
        }
        // Hide + delete messages permanently
        await hideDmConversation(address!, roomId);
    };

    if (!isConnected) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-3">
                <MessageSquare className="h-12 w-12 text-slate-200 mx-auto" />
                <p className="text-slate-500 font-bold">Connect your wallet to access messages.</p>
                <Link href="/" className="text-emerald-600 text-sm font-black hover:underline">← Go Home</Link>
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-65px)] bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                address={address!}
                escrows={escrows}
                dmConvos={dmConvos}
                activeRoom={activeRoom}
                onSelect={handleSetActiveRoom}
                onNewDm={() => setShowNewDm(true)}
                onDeleteDm={handleDeleteDm}
                unreadCounts={unreadCounts}
            />

            {/* Main Chat */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                ) : activeRoom ? (
                    <ChatArea room={activeRoom} address={address!} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <MessageSquare className="h-16 w-16 opacity-20" />
                        <p className="text-sm font-bold">Select a conversation</p>
                    </div>
                )}
            </div>

            {/* New DM Modal */}
            {showNewDm && (
                <NewDmModal
                    onStart={handleNewDm}
                    onClose={() => setShowNewDm(false)}
                />
            )}
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100vh-65px)] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            </div>
        }>
            <MessagesPageInner />
        </Suspense>
    );
}