// Svoi — TanStack Query hooks for listings and categories
"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getHomeFeed, getCategories, getListing, toggleFavorite } from "@/actions/listings";
import type { FeedFilters } from "@/actions/listings";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  feed:       (filters: FeedFilters) => ["feed", filters] as const,
  categories: ()                     => ["categories"]     as const,
  listing:    (id: string)           => ["listing", id]    as const,
  myListings: ()                     => ["my-listings"]    as const,
};

// ─── Home feed (paginated) ─────────────────────────────────────────────────────

export function useHomeFeed(filters: Omit<FeedFilters, "offset"> = {}) {
  const limit = filters.limit ?? 20;

  return useInfiniteQuery({
    queryKey: queryKeys.feed(filters),
    queryFn: ({ pageParam = 0 }) =>
      getHomeFeed({ ...filters, limit, offset: pageParam as number }),
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.flatMap((p) => p.listings).length;
      return fetched < lastPage.total ? fetched : undefined;
    },
    initialPageParam: 0,
    staleTime: 30_000, // 30s — feed feels fresh
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn:  getCategories,
    staleTime: Infinity, // categories rarely change
  });
}

// ─── Single listing ───────────────────────────────────────────────────────────

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listing(id),
    queryFn:  () => getListing(id),
    enabled:  !!id,
  });
}

// ─── Toggle favorite ──────────────────────────────────────────────────────────

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, userId }: { listingId: string; userId: string }) =>
      toggleFavorite(listingId, userId),
    onSuccess: () => {
      // Invalidate all feed queries so favorite icons refresh
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
