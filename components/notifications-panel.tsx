"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet-context";
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    subscribeToNotifications,
    type Notification,
    type NotifType,
} from "../lib/chat-notif-store";
import { X, Bell, CheckCheck, Loader2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const NOTIF_ICON: Record<NotifType, string> = {
    proposal_received: "📋",
    proposal_accepted: "🎉",
    proposal_rejected: "❌",
    work_submitted: "📦",
    payment_released: "💰",
    deadline_soon: "⏰",
    project_cancelled: "🚫",
    general: "🔔",
};

const NOTIF_COLOR: Record<NotifType, string> = {
    proposal_received: "bg-blue-50 border-blue-100",
    proposal_accepted: "bg-emerald-50 border-emerald-100",
    proposal_rejected: "bg-red-50 border-red-100",
    work_submitted: "bg-amber-50 border-amber-100",
    payment_released: "bg-emerald-50 border-emerald-100",
    deadline_soon: "bg-orange-50 border-orange-100",
    project_cancelled: "bg-slate-50 border-slate-100",
    general: "bg-slate-50 border-slate-100",
};

// ─── Notification Item ────────────────────────────────────────────────────────

function NotifItem({
    notif,
    onRead,
}: {
    notif: Notification;
    onRead: (id: string) => void;
}) {
    return (
        <button
            onClick={() => !notif.isRead && onRead(notif.id)}
            className={`w-full text-left flex gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${notif.isRead
                    ? "bg-white border-slate-100 opacity-60"
                    : NOTIF_COLOR[notif.type as NotifType] ?? "bg-slate-50 border-slate-100"
                }`}
        >
            <div className="text-xl flex-shrink-0 mt-0.5">
                {NOTIF_ICON[notif.type as NotifType] ?? "🔔"}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 leading-snug">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{timeAgo(notif.createdAt)}</p>
            </div>
            {!notif.isRead && (
                <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
            )}
        </button>
    );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
    const { address, isConnected } = useWallet();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    useEffect(() => {
        if (!address) { setLoading(false); return; }
        // Load + subscribe dalam satu effect
        fetchNotifications(address).then((notifs: Notification[]) => {
            setNotifications(notifs);
            setLoading(false);
        });
        const unsub = subscribeToNotifications(address, (notif: Notification) => {
            setNotifications((prev: Notification[]) => {
                if (prev.find((n) => n.id === notif.id)) return prev;
                return [notif, ...prev];
            });
        });
        return () => { unsub?.(); };
    }, [address]);

    const handleRead = async (id: string) => {
        await markNotificationRead(id);
        setNotifications((prev: Notification[]) =>
            prev.map((n: Notification) => (n.id === id ? { ...n, isRead: true } : n))
        );
    };

    const handleMarkAll = async () => {
        if (!address || unreadCount === 0) return;
        setMarkingAll(true);
        await markAllNotificationsRead(address);
        setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, isRead: true })));
        setMarkingAll(false);
    };

    return (
        <div className="absolute top-12 right-0 z-[9998] flex flex-col w-[360px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.12))" }}>
            {/* Arrow pointer */}
            <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45 z-10" />
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                <Bell className="h-4 w-4 text-slate-600" />
                <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black">
                                {unreadCount}
                            </span>
                        )}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAll}
                        disabled={markingAll}
                        className="flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest disabled:opacity-50"
                    >
                        {markingAll ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <CheckCheck className="h-3 w-3" />
                        )}
                        Mark all read
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                        <Bell className="h-8 w-8 opacity-30" />
                        <p className="text-xs font-medium">Connect wallet to see notifications</p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                        <Bell className="h-8 w-8 opacity-30" />
                        <p className="text-xs font-medium">No notifications yet</p>
                        <p className="text-[10px] text-slate-300">We'll let you know when something happens</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <NotifItem key={notif.id} notif={notif} onRead={handleRead} />
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Exported hook untuk unread count di Navbar ───────────────────────────────

export function useUnreadCount(address: string | null): number {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!address) { setCount(0); return; }
        // Load once
        fetchNotifications(address).then((notifs: Notification[]) => {
            setCount(notifs.filter((n) => !n.isRead).length);
        });
        // Subscribe realtime — satu channel saja
        const unsub = subscribeToNotifications(address, () => {
            setCount((c) => c + 1);
        });
        return () => { unsub?.(); };
    }, [address]); // hanya re-run kalau address berubah

    return count;
}