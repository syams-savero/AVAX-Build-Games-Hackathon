// lib/chat-notif-store.ts — Supabase version

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
    id: string;
    escrowId: string | null; // null = global chat
    sender: string;
    content: string;
    createdAt: string;
}

// Alias for backward compat
export type Message = ChatMessage;

export type NotifType =
    | "work_submitted"
    | "payment_released"
    | "proposal_received"
    | "proposal_accepted"
    | "proposal_rejected"
    | "project_cancelled"
    | "deadline_soon"
    | "general";

export interface Notification {
    id: string;
    recipient: string;
    escrowId: string | null;
    type: NotifType | string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

function mapMessage(row: any): ChatMessage {
    return {
        id: row.id,
        escrowId: row.escrow_id ?? null,
        sender: row.sender,
        content: row.content,
        createdAt: row.created_at,
    };
}

function mapNotification(row: any): Notification {
    return {
        id: row.id,
        recipient: row.recipient,
        escrowId: row.escrow_id ?? null,
        type: row.type,
        message: row.message,
        isRead: row.is_read,
        createdAt: row.created_at,
    };
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function getMessages(escrowId: string | null): Promise<ChatMessage[]> {
    const query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

    const { data, error } = escrowId
        ? await query.eq("escrow_id", escrowId)
        : await query.is("escrow_id", null);

    if (error) { console.error("getMessages error:", error.message); return []; }
    return (data ?? []).map(mapMessage);
}

export async function sendMessage(
    sender: string,
    content: string,
    escrowId: string | null = null
): Promise<{ success: boolean; error?: string }> {
    const payload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        escrow_id: escrowId,
        sender: sender.toLowerCase(),
        content,
        created_at: new Date().toISOString(),
    };
    console.log("[sendMessage] inserting:", payload);
    const { error } = await supabase.from("messages").insert(payload);
    if (error) {
        console.error("[sendMessage] error:", error.message, error.details, error.hint);
        return { success: false, error: error.message };
    }
    console.log("[sendMessage] success");
    return { success: true };
}

export function subscribeToMessages(
    escrowId: string | null,
    onNew: (msg: ChatMessage) => void
): () => void {
    // Note: filter `is.null` tidak support di postgres_changes
    // Gunakan filter hanya untuk escrowId, global chat difilter di client
    const channelName = `messages:${escrowId ?? "global"}:${Date.now()}`;

    const channel = supabase
        .channel(channelName)
        .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "messages",
            ...(escrowId ? { filter: `escrow_id=eq.${escrowId}` } : {}),
        }, (payload) => {
            const msg = mapMessage(payload.new);
            // Filter global chat di client side
            if (escrowId === null && msg.escrowId !== null) return;
            if (escrowId !== null && msg.escrowId !== escrowId) return;
            onNew(msg);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(recipient: string): Promise<Notification[]> {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient", recipient.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) { console.error("getNotifications error:", error.message); return []; }
    return (data ?? []).map(mapNotification);
}

// ─── Aliases (backward compat) ───────────────────────────────────────────────
export async function fetchMessages(escrowId: string | null): Promise<ChatMessage[]> {
    return getMessages(escrowId);
}

export async function fetchNotifications(recipient: string): Promise<Notification[]> {
    return getNotifications(recipient);
}

export async function createNotification(
    recipientOrObj: string | { recipient: string; type: string; message: string; escrowId?: string | null },
    type?: string,
    message?: string,
    escrowId: string | null = null
): Promise<void> {
    let recipient: string;
    let notifType: string;
    let notifMessage: string;
    let notifEscrowId: string | null = null;

    if (typeof recipientOrObj === "object") {
        recipient = recipientOrObj.recipient;
        notifType = recipientOrObj.type;
        notifMessage = recipientOrObj.message;
        notifEscrowId = recipientOrObj.escrowId ?? null;
    } else {
        recipient = recipientOrObj;
        notifType = type!;
        notifMessage = message!;
        notifEscrowId = escrowId;
    }

    await supabase.from("notifications").insert({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        recipient: recipient.toLowerCase(),
        escrow_id: notifEscrowId,
        type: notifType,
        message: notifMessage,
        is_read: false,
        created_at: new Date().toISOString(),
    });
}

export async function markNotificationRead(id: string): Promise<void> {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(recipient: string): Promise<void> {
    await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient", recipient.toLowerCase())
        .eq("is_read", false);
}

export function subscribeToNotifications(
    recipient: string,
    onNew: (notif: Notification) => void
): () => void {
    const channel = supabase
        .channel(`notifications:${recipient}`)
        .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient=eq.${recipient.toLowerCase()}`,
        }, (payload) => {
            onNew(mapNotification(payload.new));
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

// Strip 0x and lowercase for compact room IDs
function stripAddr(addr: string): string {
    return addr.toLowerCase().replace(/^0x/, "");
}

// Generate consistent DM room ID — format: dm_{shorter}_{longer} (sorted)
export function getDmRoomId(a: string, b: string): string {
    const sorted = [stripAddr(a), stripAddr(b)].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
}

// Reconstruct full address from stripped version
function restoreAddr(stripped: string): string {
    return stripped.startsWith("0x") ? stripped : "0x" + stripped;
}

// Get all DM conversations for an address
export async function getDmConversations(address: string): Promise<{
    roomId: string;
    otherAddress: string;
    lastMessage: ChatMessage | null;
}[]> {
    const stripped = stripAddr(address);

    // Fetch all DM messages involving this address using LIKE on escrow_id
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .like("escrow_id", `%${stripped}%`)
        .order("created_at", { ascending: false });

    if (error) { console.error("getDmConversations error:", error.message); return []; }
    if (!data) return [];

    // Group by roomId — only keep DM rooms
    const rooms = new Map<string, ChatMessage>();
    for (const row of data) {
        const roomId = row.escrow_id as string;
        if (!roomId?.startsWith("dm_")) continue;
        if (!roomId.includes(stripped)) continue;
        if (!rooms.has(roomId)) {
            rooms.set(roomId, mapMessage(row));
        }
    }

    return Array.from(rooms.entries()).map(([roomId, lastMessage]) => {
        // roomId format: dm_{addr1}_{addr2} where each addr is 40 hex chars (no 0x)
        const withoutPrefix = roomId.slice(3); // remove "dm_"
        // Each stripped address is exactly 40 hex chars
        const addrA = withoutPrefix.slice(0, 40);
        const addrB = withoutPrefix.slice(41); // skip the "_"
        const otherStripped = addrA === stripped ? addrB : addrA;
        return { roomId, otherAddress: restoreAddr(otherStripped), lastMessage };
    });
}

export async function getDmMessages(roomId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("escrow_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

    if (error) { console.error("getDmMessages error:", error.message); return []; }
    return (data ?? []).map(mapMessage);
}

export async function sendDmMessage(
    from: string,
    to: string,
    content: string
): Promise<{ success: boolean; error?: string }> {
    const roomId = getDmRoomId(from, to);
    return sendMessage(from, content, roomId);
}

export function subscribeToDm(
    roomId: string,
    onNew: (msg: ChatMessage) => void
): () => void {
    const channel = supabase
        .channel(`dm:${roomId}:${Date.now()}`)
        .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `escrow_id=eq.${roomId}`,
        }, (payload) => {
            onNew(mapMessage(payload.new));
        })
        .subscribe();
    return () => { supabase.removeChannel(channel); };
}

// Delete all messages in a conversation (DM or project)
export async function deleteConversation(escrowId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("messages")
        .delete()
        .eq("escrow_id", escrowId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}