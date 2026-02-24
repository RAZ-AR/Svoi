// @ts-nocheck
// Svoi — Chat server actions
"use server";

import { createClient } from "@/lib/supabase/server";

export type StartChatResult =
  | {
      ok: true;
      chatId: string;
      isNew: boolean;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Creates or returns an existing chat between the current user and a seller.
 * One chat per (listing, buyer) — enforced by DB unique constraint.
 */
export async function startChat(
  listingId: string,
  sellerId: string
): Promise<StartChatResult> {
  try {
    const supabase = await createClient();

    // Get current svoi user id from auth metadata
    const { data: authData } = await supabase.auth.getUser();
    const svoiUserId = authData.user?.user_metadata?.svoi_user_id as string | undefined;

    if (!svoiUserId) {
      return { ok: false, error: "Не авторизован" };
    }

    if (svoiUserId === sellerId) {
      return { ok: false, error: "Нельзя написать самому себе" };
    }

    // Try to find existing chat first
    const { data: existing } = await supabase
      .from("chats")
      .select("id")
      .eq("listing_id", listingId)
      .eq("user2_id", svoiUserId)
      .single();

    if (existing) {
      return { ok: true, chatId: existing.id, isNew: false };
    }

    // Create new chat
    const { data: newChat, error } = await supabase
      .from("chats")
      .insert({
        listing_id: listingId,
        user1_id:   sellerId,   // listing owner
        user2_id:   svoiUserId, // buyer
      })
      .select("id")
      .single();

    if (error) throw error;

    return { ok: true, chatId: newChat.id, isNew: true };
  } catch (err) {
    console.error("[startChat]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка создания чата",
    };
  }
}

/** Fetch all chats for current user, with last message preview */
export async function getMyChats() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  const svoiUserId = authData.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUserId) return [];

  const { data, error } = await supabase
    .from("chats")
    .select(`
      id,
      created_at,
      listing:listings!listing_id(id, title, images),
      user1:users!user1_id(id, first_name, avatar_url, telegram_username),
      user2:users!user2_id(id, first_name, avatar_url, telegram_username),
      messages(text, image_url, created_at, sender_id)
    `)
    .or(`user1_id.eq.${svoiUserId},user2_id.eq.${svoiUserId}`)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
