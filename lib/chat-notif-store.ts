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
    edited?: boolean;
    deleted?: boolean;
    originalContent?: string | null;
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
        edited: row.edited ?? false,
        deleted: row.deleted ?? false,
        originalContent: row.original_content ?? null,
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

// ─── Message Actions ──────────────────────────────────────────────────────────

export async function editMessage(
    messageId: string,
    newContent: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("messages")
        .update({ content: newContent, edited: true })
        .eq("id", messageId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteMessage(
    messageId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("messages")
        .update({ deleted: true, content: "This message was deleted." })
        .eq("id", messageId);
    if (error) return { success: false, error: error.message };
    return { success: true };
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

    // Get hidden rooms for this user
    const hiddenRooms = await getHiddenDmRooms(address);
    const hiddenSet = new Set(hiddenRooms);

    // Group by roomId — only keep DM rooms, exclude hidden
    const rooms = new Map<string, ChatMessage>();
    for (const row of data) {
        const roomId = row.escrow_id as string;
        if (!roomId?.startsWith("dm_")) continue;
        if (!roomId.includes(stripped)) continue;
        if (hiddenSet.has(roomId)) continue;
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

// Hide a DM conversation for a specific user (persists across refresh)
export async function hideDmConversation(
    address: string,
    roomId: string
): Promise<{ success: boolean; error?: string }> {
    // 1. Delete all messages in the room
    const { error: delError } = await supabase
        .from("messages")
        .delete()
        .eq("escrow_id", roomId);
    if (delError) console.warn("[hideDm] delete messages error:", delError.message);

    // 2. Mark as hidden for this user so it doesn't reappear
    const { error: hideError } = await supabase
        .from("dm_hidden")
        .upsert({ address: address.toLowerCase(), room_id: roomId }, { onConflict: "address,room_id" });
    if (hideError) return { success: false, error: hideError.message };

    return { success: true };
}

// Get list of hidden room IDs for an address
export async function getHiddenDmRooms(address: string): Promise<string[]> {
    const { data, error } = await supabase
        .from("dm_hidden")
        .select("room_id")
        .eq("address", address.toLowerCase());
    if (error || !data) return [];
    return data.map((r) => r.room_id);
}

// Legacy alias
export async function deleteConversation(escrowId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from("messages").delete().eq("escrow_id", escrowId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ─── Unread / Chat Notifications ─────────────────────────────────────────────

export interface UnreadCount {
    roomId: string | null; // null = global
    count: number;
}

// Get messages after a timestamp (for unread detection)
export async function getUnreadMessages(
    roomId: string | null,
    since: string // ISO timestamp
): Promise<ChatMessage[]> {
    let query = supabase
        .from("messages")
        .select("*")
        .gt("created_at", since)
        .eq("deleted", false)
        .order("created_at", { ascending: false })
        .limit(50);

    if (roomId === null) {
        query = query.is("escrow_id", null);
    } else {
        query = query.eq("escrow_id", roomId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapMessage);
}

// Subscribe to ALL messages for a user's rooms and fire callback with room info
export function subscribeToAllRooms(
    rooms: (string | null)[], // null = global
    onMessage: (msg: ChatMessage, roomId: string | null) => void
): () => void {
    const channels = rooms.map((roomId) => {
        const channelName = `allrooms:${roomId ?? "global"}:${Date.now()}`;
        const channel = supabase
            .channel(channelName)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                ...(roomId !== null ? { filter: `escrow_id=eq.${roomId}` } : {}),
            }, (payload) => {
                const msg = mapMessage(payload.new);
                // For global, filter client-side
                if (roomId === null && msg.escrowId !== null) return;
                onMessage(msg, roomId);
            })
            .subscribe();
        return channel;
    });

    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
}

// Permanently remove message from database (no trace)
export async function hardDeleteMessage(
    messageId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

// Listen for hard-deleted messages to show placeholder in UI
export function supabaseDeleteListener(
    escrowId: string | null,
    onDeleted: (msgId: string) => void
): () => void {
    const channelName = `del:${escrowId ?? "global"}:${Date.now()}`;
    const channel = supabase
        .channel(channelName)
        .on("postgres_changes", {
            event: "DELETE",
            schema: "public",
            table: "messages",
            ...(escrowId !== null ? { filter: `escrow_id=eq.${escrowId}` } : {}),
        }, (payload) => {
            if (payload.old?.id) onDeleted(payload.old.id);
        })
        .subscribe();
    return () => { supabase.removeChannel(channel); };
}