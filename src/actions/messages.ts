// @ts-nocheck
// Svoi — Messages server actions
"use server";

import { createClient } from "@/lib/supabase/server";

export interface ChatWithPreview {
  id:         string;
  created_at: string;
  listing: {
    id:     string;
    title:  string;
    images: { url: string }[];
    status: string;
  };
  other_user: {
    id:                string;
    first_name:        string;
    telegram_username: string | null;
    avatar_url:        string | null;
  };
  last_message:  string | null;
  last_message_at: string | null;
  unread_count:  number;
}

export interface MessageRow {
  id:         string;
  chat_id:    string;
  sender_id:  string;
  text:       string | null;
  image_url:  string | null;
  read_at:    string | null;
  created_at: string;
}

// ─── Get my chats list ────────────────────────────────────────────────────────

export async function getMyChats(): Promise<ChatWithPreview[]> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return [];

  // Fetch chats with latest message via subquery
  const { data, error } = await supabase
    .from("chats")
    .select(`
      id, created_at,
      listing:listings!listing_id(id, title, images, status),
      user1:users!user1_id(id, first_name, telegram_username, avatar_url),
      user2:users!user2_id(id, first_name, telegram_username, avatar_url),
      messages(id, text, image_url, created_at, sender_id, read_at)
    `)
    .or(`user1_id.eq.${svoiUid},user2_id.eq.${svoiUid}`)
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });

  if (error) {
    console.error("[getMyChats]", error);
    return [];
  }

  return (data ?? []).map((chat: any) => {
    const isUser1   = chat.user1?.id === svoiUid;
    const otherUser = isUser1 ? chat.user2 : chat.user1;
    const msgs      = chat.messages ?? [];
    const last      = msgs[0];
    const unread    = msgs.filter(
      (m: any) => m.sender_id !== svoiUid && !m.read_at
    ).length;

    return {
      id:              chat.id,
      created_at:      chat.created_at,
      listing:         chat.listing,
      other_user:      otherUser,
      last_message:    last?.text ?? (last?.image_url ? "📷 Фото" : null),
      last_message_at: last?.created_at ?? null,
      unread_count:    unread,
    };
  }).sort((a, b) => {
    const at = a.last_message_at ?? a.created_at;
    const bt = b.last_message_at ?? b.created_at;
    return bt.localeCompare(at);
  });
}

// ─── Get messages in a chat ───────────────────────────────────────────────────

export async function getChatMessages(chatId: string): Promise<{
  messages: MessageRow[];
  myUserId: string;
  chat: {
    id: string;
    listing: { id: string; title: string; images: { url: string }[] };
    other_user: { id: string; first_name: string; avatar_url: string | null; telegram_username: string | null };
  } | null;
}> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return { messages: [], myUserId: "", chat: null };

  const [messagesRes, chatRes] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(100),

    supabase
      .from("chats")
      .select(`
        id,
        listing:listings!listing_id(id, title, images),
        user1:users!user1_id(id, first_name, avatar_url, telegram_username),
        user2:users!user2_id(id, first_name, avatar_url, telegram_username)
      `)
      .eq("id", chatId)
      .single(),
  ]);

  const chatData = chatRes.data as any;
  const isUser1  = chatData?.user1?.id === svoiUid;
  const otherUser = isUser1 ? chatData?.user2 : chatData?.user1;

  return {
    messages: (messagesRes.data as MessageRow[]) ?? [],
    myUserId: svoiUid,
    chat: chatData
      ? { id: chatData.id, listing: chatData.listing, other_user: otherUser }
      : null,
  };
}

// ─── Send message ─────────────────────────────────────────────────────────────

export async function sendMessage(
  chatId:   string,
  text?:    string,
  imageUrl?: string
): Promise<{ ok: boolean; message?: MessageRow; error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return { ok: false, error: "Не авторизован" };

  if (!text?.trim() && !imageUrl) return { ok: false, error: "Пустое сообщение" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id:   chatId,
      sender_id: svoiUid,
      text:      text?.trim() || null,
      image_url: imageUrl || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, message: data as MessageRow };
}

// ─── Mark messages as read ────────────────────────────────────────────────────

export async function markMessagesRead(chatId: string): Promise<void> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .neq("sender_id", svoiUid)
    .is("read_at", null);
}

// ─── Get total unread count ───────────────────────────────────────────────────

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return 0;

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .neq("sender_id", svoiUid)
    .is("read_at", null)
    .in("chat_id",
      supabase
        .from("chats")
        .select("id")
        .or(`user1_id.eq.${svoiUid},user2_id.eq.${svoiUid}`) as any
    );

  return count ?? 0;
}
