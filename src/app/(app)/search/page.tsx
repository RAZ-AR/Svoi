// Svoi — Search page: instant search + filters bottom sheet
"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useSearchStore } from "@/store/search.store";
import { useSearch } from "@/hooks/use-search";
import { SearchInput } from "@/components/search/search-input";
import { ActiveFilters } from "@/components/search/active-filters";
import { SearchResults } from "@/components/search/search-results";
import { RecentSearches, saveRecentSearch } from "@/components/search/recent-searches";
import { FiltersSheet } from "@/components/search/filters-sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { query, activeFilterCount } = useSearchStore();
  const { isSearching } = useSearch();
  const filterCount = activeFilterCount();

  // Save to recent searches when user stops typing and has results
  const debouncedQuery = useDebounce(query, 1200);
  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      saveRecentSearch(debouncedQuery.trim());
    }
  }, [debouncedQuery]);

  const showResults = query.trim().length > 0 || filterCount > 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Sticky top bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex flex-col gap-2.5 bg-white/95 px-4 pb-3 pt-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Search input — takes all available width */}
          <div className="flex-1">
            <SearchInput isSearching={isSearching} />
          </div>

          {/* Filters button */}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              "relative flex h-12 w-12 shrink-0 items-center justify-center",
              "rounded-2xl border transition-colors",
              filterCount > 0
                ? "border-primary bg-primary/8 text-primary"
                : "border-gray-200 bg-white text-gray-600"
            )}
          >
            <SlidersHorizontal size={18} />
            {/* Active filter badge */}
            {filterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        <ActiveFilters onOpenFilters={() => setFiltersOpen(true)} />
      </div>

      {/* ── Content area ────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-6">
        {showResults ? (
          <SearchResults />
        ) : (
          <RecentSearches />
        )}
      </div>

      {/* ── Filters bottom sheet ─────────────────────────────────────────── */}
      <FiltersSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}
