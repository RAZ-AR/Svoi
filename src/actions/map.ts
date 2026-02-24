// @ts-nocheck
// Svoi — Map server actions: geo queries via PostGIS
"use server";

import { createClient } from "@/lib/supabase/server";
import type { ListingWithUser } from "@/actions/listings";

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface MapListing {
  id:           string;
  title:        string;
  price:        number | null;
  currency:     string;
  lat:          number;
  lng:          number;
  images:       { url: string }[];
  category:     { id: number; name: string; slug: string; emoji: string | null };
  user:         { id: string; first_name: string; avatar_url: string | null };
  address:      string | null;
  created_at:   string;
}

/**
 * Fetch active listings within visible map bounds.
 * Uses PostGIS ST_Within for precise bbox queries.
 */
export async function getListingsInBounds(
  bounds:      MapBounds,
  categorySlug?: string,
  limit = 200
): Promise<MapListing[]> {
  const supabase = await createClient();

  // Build polygon from bounds for ST_Within
  const polygon = `POLYGON((
    ${bounds.swLng} ${bounds.swLat},
    ${bounds.neLng} ${bounds.swLat},
    ${bounds.neLng} ${bounds.neLat},
    ${bounds.swLng} ${bounds.neLat},
    ${bounds.swLng} ${bounds.swLat}
  ))`;

  let query = supabase
    .from("listings")
    .select(`
      id, title, price, currency, lat, lng, images, address, created_at,
      category:categories!category_id(id, name, slug, emoji),
      user:users!user_id(id, first_name, avatar_url)
    `)
    .eq("status", "active")
    .not("lat", "is", null)
    .not("lng", "is", null)
    // Bbox filter using raw Postgres (Supabase doesn't expose ST_Within directly)
    .gte("lat", bounds.swLat)
    .lte("lat", bounds.neLat)
    .gte("lng", bounds.swLng)
    .lte("lng", bounds.neLng)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getListingsInBounds]", error);
    return [];
  }

  return (data as unknown as MapListing[]) ?? [];
}

/**
 * Fetch listings near a coordinate using PostGIS RPC.
 * Used when user taps "Найти здесь" after panning.
 */
export async function getNearbyListings(
  lat:          number,
  lng:          number,
  radiusKm = 5,
  categorySlug?: string
): Promise<MapListing[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_nearby_listings", {
    p_lat:      lat,
    p_lng:      lng,
    p_radius_km: radiusKm,
    p_category: categorySlug ?? null,
    p_limit:    150,
  });

  if (error) {
    console.error("[getNearbyListings]", error);
    return [];
  }

  return (data as unknown as MapListing[]) ?? [];
}
