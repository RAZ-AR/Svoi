// Svoi — Zustand store: search query + active filters
import { create } from "zustand";

export type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

export interface SearchFilters {
  categoryId:  number | null;
  minPrice:    string;
  maxPrice:    string;
  currency:    "EUR" | "RSD" | "USD" | "";
  district:    string;
  sort:        SortOption;
}

const DEFAULT_FILTERS: SearchFilters = {
  categoryId: null,
  minPrice:   "",
  maxPrice:   "",
  currency:   "",
  district:   "",
  sort:       "newest",
};

interface SearchStore {
  query:      string;
  filters:    SearchFilters;
  // Committed filters (applied on sheet close)
  appliedFilters: SearchFilters;

  setQuery:         (q: string) => void;
  setFilter:        <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  applyFilters:     () => void;
  resetFilters:     () => void;
  activeFilterCount: () => number;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query:          "",
  filters:        { ...DEFAULT_FILTERS },
  appliedFilters: { ...DEFAULT_FILTERS },

  setQuery: (q) => set({ query: q }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  applyFilters: () =>
    set((s) => ({ appliedFilters: { ...s.filters } })),

  resetFilters: () =>
    set({
      filters:        { ...DEFAULT_FILTERS },
      appliedFilters: { ...DEFAULT_FILTERS },
    }),

  activeFilterCount: () => {
    const f = get().appliedFilters;
    let count = 0;
    if (f.categoryId !== null)   count++;
    if (f.minPrice || f.maxPrice) count++;
    if (f.district)              count++;
    if (f.sort !== "newest")     count++;
    return count;
  },
}));
