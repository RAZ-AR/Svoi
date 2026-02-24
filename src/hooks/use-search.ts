// Svoi — TanStack Query hook for search with debounce
"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchStore } from "@/store/search.store";
import { searchListings } from "@/actions/search";
import { useDebounce } from "./use-debounce";

export function useSearch() {
  const { query, appliedFilters } = useSearchStore();

  // Debounce query — avoids hammering the server on every keystroke
  const debouncedQuery = useDebounce(query, 300);

  const result = useQuery({
    queryKey: ["search", debouncedQuery, appliedFilters],
    queryFn:  () => searchListings(debouncedQuery, appliedFilters),
    // Keep previous results while new ones load (no jarring empty flash)
    placeholderData: (prev) => prev,
    // Don't search on empty query with no filters
    enabled: debouncedQuery.trim().length > 0 || hasActiveFilters(appliedFilters),
    staleTime: 20_000,
  });

  return {
    ...result,
    isSearching: result.isFetching,
    isEmpty: result.data?.listings.length === 0 && !result.isFetching,
  };
}

function hasActiveFilters(f: ReturnType<typeof useSearchStore>["appliedFilters"]) {
  return (
    f.categoryId !== null ||
    !!f.minPrice ||
    !!f.maxPrice ||
    !!f.district ||
    f.sort !== "newest"
  );
}
