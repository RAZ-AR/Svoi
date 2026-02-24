// Svoi — Search server action: Meilisearch primary, Supabase fallback
"use server";

import type { ListingWithUser } from "@/actions/listings";
import type { SearchFilters } from "@/store/search.store";

export interface SearchResult {
  listings:    ListingWithUser[];
  total:       number;
  source:      "meilisearch" | "supabase";
  processingMs?: number;
}

export async function searchListings(
  query:   string,
  filters: SearchFilters,
  limit  = 30,
  offset = 0
): Promise<SearchResult> {
  // Try Meilisearch first — instant typo-tolerant search
  const meiliHost = process.env.NEXT_PUBLIC_MEILISEARCH_HOST;
  const meiliKey  = process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY;

  if (meiliHost && meiliKey && query.trim()) {
    try {
      return await searchWithMeilisearch(query, filters, limit, offset, meiliHost, meiliKey);
    } catch (err) {
      console.warn("[search] Meilisearch unavailable, falling back to Supabase:", err);
    }
  }

  // Fallback: Supabase full-text / ilike search
  return await searchWithSupabase(query, filters, limit, offset);
}

// ─── Meilisearch ──────────────────────────────────────────────────────────────

async function searchWithMeilisearch(
  query:   string,
  filters: SearchFilters,
  limit:   number,
  offset:  number,
  host:    string,
  apiKey:  string
): Promise<SearchResult> {
  // Build Meilisearch filter string
  const filterParts: string[] = ['status = "active"'];

  if (filters.categoryId !== null) {
    filterParts.push(`category_id = ${filters.categoryId}`);
  }
  if (filters.minPrice) {
    filterParts.push(`price >= ${parseFloat(filters.minPrice)}`);
  }
  if (filters.maxPrice) {
    filterParts.push(`price <= ${parseFloat(filters.maxPrice)}`);
  }
  if (filters.currency) {
    filterParts.push(`currency = "${filters.currency}"`);
  }
  if (filters.district) {
    filterParts.push(`address = "${filters.district}"`);
  }

  // Sort mapping
  const sortMap: Record<string, string[]> = {
    newest:     ["created_at:desc"],
    price_asc:  ["price:asc"],
    price_desc: ["price:desc"],
    popular:    ["views:desc"],
  };

  const body = {
    q:      query,
    filter: filterParts.join(" AND "),
    sort:   sortMap[filters.sort] ?? ["created_at:desc"],
    limit,
    offset,
    attributesToRetrieve: [
      "id", "user_id", "category_id", "title", "description",
      "price", "currency", "address", "lat", "lng",
      "images", "status", "views", "created_at",
      // Embedded joins (indexed as flat fields)
      "user_first_name", "user_username", "user_avatar",
      "category_name", "category_slug", "category_emoji",
    ],
  };

  const res = await fetch(`${host}/indexes/listings/search`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Meilisearch ${res.status}`);

  const data = await res.json();

  // Reshape flat Meilisearch hits into ListingWithUser shape
  const listings: ListingWithUser[] = (data.hits ?? []).map((hit: any) => ({
    ...hit,
    user: {
      id:                hit.user_id,
      first_name:        hit.user_first_name ?? "",
      telegram_username: hit.user_username ?? null,
      avatar_url:        hit.user_avatar ?? null,
      phone:             null,
    },
    category: {
      id:    hit.category_id,
      name:  hit.category_name ?? "",
      slug:  hit.category_slug ?? "",
      emoji: hit.category_emoji ?? null,
    },
  }));

  return {
    listings,
    total:        data.estimatedTotalHits ?? listings.length,
    source:       "meilisearch",
    processingMs: data.processingTimeMs,
  };
}

// ─── Supabase fallback ────────────────────────────────────────────────────────

async function searchWithSupabase(
  query:   string,
  filters: SearchFilters,
  limit:   number,
  offset:  number
): Promise<SearchResult> {
  // Dynamic import to keep this server-only
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  let q = supabase
    .from("listings")
    .select(
      `*, user:users!user_id(id, first_name, telegram_username, avatar_url, phone),
          category:categories!category_id(id, name, slug, emoji)`,
      { count: "exact" }
    )
    .eq("status", "active")
    .range(offset, offset + limit - 1);

  // Full-text search using ilike (pg_trgm index picks this up)
  if (query.trim()) {
    q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (filters.categoryId !== null) q = q.eq("category_id", filters.categoryId);
  if (filters.minPrice)            q = q.gte("price", parseFloat(filters.minPrice));
  if (filters.maxPrice)            q = q.lte("price", parseFloat(filters.maxPrice));
  if (filters.currency)            q = q.eq("currency", filters.currency);
  if (filters.district)            q = q.ilike("address", `%${filters.district}%`);

  // Sort
  switch (filters.sort) {
    case "price_asc":  q = q.order("price", { ascending: true,  nullsFirst: false }); break;
    case "price_desc": q = q.order("price", { ascending: false, nullsFirst: false }); break;
    case "popular":    q = q.order("views", { ascending: false });                    break;
    default:           q = q.order("created_at", { ascending: false });
  }

  const { data, count, error } = await q;

  if (error) {
    console.error("[searchWithSupabase]", error);
    return { listings: [], total: 0, source: "supabase" };
  }

  return {
    listings: (data as unknown as ListingWithUser[]) ?? [],
    total:    count ?? 0,
    source:   "supabase",
  };
}
