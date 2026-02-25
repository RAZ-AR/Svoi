// @ts-nocheck
// Svoi — Create listing server action + Supabase Storage upload helper
"use server";

import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

export interface CreateListingPayload {
  categoryId:  number;
  title:       string;
  description: string;
  price:       number | null;
  currency:    string;
  address:     string;
  lat:         number | null;
  lng:         number | null;
  images:      { url: string }[];
  eventDate:   string | null;
}

export type CreateListingResult =
  | {
      ok: true;
      listingId: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function createListing(
  payload: CreateListingPayload
): Promise<CreateListingResult> {
  try {
    const supabase = await createClient();

    // Get current svoi user id from auth session
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { ok: false, error: "Не авторизован" };

    // Telegram auth sets svoi_user_id in metadata directly
    let svoiUserId = authData.user.user_metadata?.svoi_user_id as string | undefined;

    // Fallback for Google OAuth users: look up by auth_id in users table
    if (!svoiUserId) {
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authData.user.id)
        .single();
      svoiUserId = userRow?.id;
    }

    if (!svoiUserId) return { ok: false, error: "Не авторизован" };

    const { data, error } = await supabase
      .from("listings")
      .insert({
        user_id:     svoiUserId,
        category_id: payload.categoryId,
        title:       payload.title.trim(),
        description: payload.description.trim() || null,
        price:       payload.price,
        currency:    payload.currency,
        address:     payload.address.trim() || null,
        lat:         payload.lat,
        lng:         payload.lng,
        images:      payload.images,
        status:      "active",
        event_date:  payload.eventDate || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Sync to Meilisearch in background (non-blocking)
    supabase
      .rpc("listing_to_search_doc", { p_listing_id: data.id })
      .then(async ({ data: doc }) => {
        if (doc) {
          const { indexListing } = await import("@/lib/meilisearch/sync");
          await indexListing(doc as Record<string, unknown>);
        }
      })
      .catch((e) => console.warn("[createListing] meili sync:", e));

    return { ok: true, listingId: data.id };
  } catch (err) {
    console.error("[createListing]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка создания объявления",
    };
  }
}

/**
 * Generates a pre-signed upload URL for Supabase Storage.
 * Images are uploaded directly from the browser — server only signs the URL.
 */
export async function getImageUploadUrl(
  mimeType: string
): Promise<{ ok: true; uploadUrl: string; publicUrl: string } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const ext = mimeType.split("/")[1] ?? "jpg";
    const path = `listings/${nanoid(12)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("images")
      .createSignedUploadUrl(path);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(path);

    return { ok: true, uploadUrl: data.signedUrl, publicUrl };
  } catch (err) {
    console.error("[getImageUploadUrl]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка загрузки",
    };
  }
}
