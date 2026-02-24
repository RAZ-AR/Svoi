// Svoi — My listings management server actions
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ListingStatus } from "@/lib/supabase/database.types";
import type { ListingWithUser } from "@/actions/listings";

// ─── Fetch my listings ────────────────────────────────────────────────────────

export async function getMyListings(): Promise<ListingWithUser[]> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return [];

  const { data, error } = await supabase
    .from("listings")
    .select(`
      *,
      user:users!user_id(id, first_name, telegram_username, avatar_url, phone),
      category:categories!category_id(id, name, slug, emoji)
    `)
    .eq("user_id", svoiUid)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as unknown as ListingWithUser[]) ?? [];
}

// ─── Change listing status ────────────────────────────────────────────────────

export async function changeListingStatus(
  listingId: string,
  status:    ListingStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return { ok: false, error: "Не авторизован" };

  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId)
    .eq("user_id", svoiUid); // ownership check

  if (error) return { ok: false, error: error.message };

  // Remove from Meilisearch if not active
  if (status !== "active") {
    try {
      const { deindexListing } = await import("@/lib/meilisearch/sync");
      await deindexListing(listingId);
    } catch {}
  }

  revalidatePath("/listings/my");
  return { ok: true };
}

// ─── Delete listing (soft) ────────────────────────────────────────────────────

export async function deleteListing(
  listingId: string
): Promise<{ ok: boolean; error?: string }> {
  return changeListingStatus(listingId, "deleted");
}

// ─── Update listing ───────────────────────────────────────────────────────────

export type ListingUpdate = {
  title?:       string;
  description?: string;
  price?:       number | null;
  currency?:    string;
  address?:     string;
  lat?:         number | null;
  lng?:         number | null;
  images?:      { url: string }[];
  category_id?: number;
  event_date?:  string | null;
};

export async function updateListing(
  listingId: string,
  data:      ListingUpdate
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return { ok: false, error: "Не авторизован" };

  const { error } = await supabase
    .from("listings")
    .update(data)
    .eq("id", listingId)
    .eq("user_id", svoiUid);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/listings/my");
  return { ok: true };
}

// ─── Get my profile stats ─────────────────────────────────────────────────────

export async function getMyStats(): Promise<{
  listingsCount: number;
  totalViews:    number;
  activeCount:   number;
}> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const svoiUid = auth.user?.user_metadata?.svoi_user_id as string | undefined;
  if (!svoiUid) return { listingsCount: 0, totalViews: 0, activeCount: 0 };

  const { data } = await supabase
    .from("listings")
    .select("status, views")
    .eq("user_id", svoiUid)
    .neq("status", "deleted");

  const rows = data ?? [];
  return {
    listingsCount: rows.length,
    totalViews:    rows.reduce((s, r) => s + (r.views ?? 0), 0),
    activeCount:   rows.filter((r) => r.status === "active").length,
  };
}
