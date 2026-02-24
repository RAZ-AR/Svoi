// Svoi — TanStack Query hook for map listings
"use client";

import { useQuery } from "@tanstack/react-query";
import { getListingsInBounds, type MapBounds } from "@/actions/map";

export function useMapListings(
  bounds:       MapBounds | null,
  categorySlug?: string
) {
  return useQuery({
    queryKey:  ["map-listings", bounds, categorySlug],
    queryFn:   () => getListingsInBounds(bounds!, categorySlug),
    enabled:   !!bounds,
    staleTime: 60_000,
    // Keep previous pins while new ones load — no flicker on pan
    placeholderData: (prev) => prev,
  });
}
