// Svoi — Listings server actions
"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Listing, Category } from "@/lib/supabase/database.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListingWithUser = Listing & {
  user: {
    id: string;
    first_name: string;
    telegram_username: string | null;
    avatar_url: string | null;
    phone: string | null;
  };
  category: Pick<Category, "id" | "name" | "slug" | "emoji">;
};

export interface FeedFilters {
  categorySlug?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  limit?: number;
  offset?: number;
}

// ─── Fetch homepage feed ───────────────────────────────────────────────────────

export async function getHomeFeed(
  filters: FeedFilters = {}
): Promise<{ listings: ListingWithUser[]; total: number }> {
  const supabase = await createClient();
  const { limit = 20, offset = 0, categorySlug, minPrice, maxPrice, currency } = filters;

  let query = supabase
    .from("listings")
    .select(
      `
      *,
      user:users!user_id(id, first_name, telegram_username, avatar_url),
      category:categories!category_id(id, name, slug, emoji)
    `,
      { count: "exact" }
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categorySlug) {
    // join through category
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (minPrice !== undefined) query = query.gte("price", minPrice);
  if (maxPrice !== undefined) query = query.lte("price", maxPrice);
  if (currency) query = query.eq("currency", currency);

  const { data, error, count } = await query;

  if (error) {
    console.error("[getHomeFeed]", error);
    return { listings: [], total: 0 };
  }

  return {
    listings: (data as unknown as ListingWithUser[]) ?? [],
    total: count ?? 0,
  };
}

// ─── Fetch all categories ──────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null) // top-level only
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getCategories]", error);
    return [];
  }

  return data ?? [];
}

// ─── Fetch single listing ──────────────────────────────────────────────────────

export async function getListing(id: string): Promise<ListingWithUser | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      user:users!user_id(id, first_name, telegram_username, avatar_url, phone),
      category:categories!category_id(id, name, slug, emoji)
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;

  // Increment views in background (fire-and-forget)
  supabase.rpc("increment_listing_views", { p_listing_id: id }).then(() => {});

  return data as unknown as ListingWithUser;
}

// ─── Fetch user's own listings ─────────────────────────────────────────────────

export async function getMyListings(): Promise<ListingWithUser[]> {
  const supabase = await createClient();

  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return [];

  // Get svoi user id from auth metadata
  const svoiUserId = session.user.user_metadata?.svoi_user_id as string;
  if (!svoiUserId) return [];

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      user:users!user_id(id, first_name, telegram_username, avatar_url),
      category:categories!category_id(id, name, slug, emoji)
    `
    )
    .eq("user_id", svoiUserId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as unknown as ListingWithUser[]) ?? [];
}

// ─── Toggle favorite ───────────────────────────────────────────────────────────

export async function toggleFavorite(
  listingId: string,
  userId: string
): Promise<{ isFavorite: boolean }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);
    return { isFavorite: false };
  }

  await supabase.from("favorites").insert({ user_id: userId, listing_id: listingId });
  return { isFavorite: true };
}
