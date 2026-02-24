// Svoi — Active filter chips shown below search input
"use client";

import { X } from "lucide-react";
import { useSearchStore } from "@/store/search.store";
import { useCategories } from "@/hooks/use-listings";
import { cn } from "@/lib/utils";

interface ActiveFiltersProps {
  onOpenFilters: () => void;
}

export function ActiveFilters({ onOpenFilters }: ActiveFiltersProps) {
  const { appliedFilters, setFilter, applyFilters, resetFilters, activeFilterCount } =
    useSearchStore();
  const { data: categories = [] } = useCategories();
  const count = activeFilterCount();

  // Build chip list from active filters
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (appliedFilters.categoryId !== null) {
    const cat = categories.find((c) => c.id === appliedFilters.categoryId);
    chips.push({
      key:      "category",
      label:    `${cat?.emoji ?? ""} ${cat?.name ?? "Категория"}`,
      onRemove: () => { setFilter("categoryId", null); applyFilters(); },
    });
  }

  if (appliedFilters.minPrice || appliedFilters.maxPrice) {
    const from = appliedFilters.minPrice ? `от ${appliedFilters.minPrice}` : "";
    const to   = appliedFilters.maxPrice ? `до ${appliedFilters.maxPrice}` : "";
    const cur  = appliedFilters.currency || "€";
    chips.push({
      key:      "price",
      label:    [from, to].filter(Boolean).join(" ") + ` ${cur}`,
      onRemove: () => {
        setFilter("minPrice", "");
        setFilter("maxPrice", "");
        setFilter("currency", "");
        applyFilters();
      },
    });
  }

  if (appliedFilters.district) {
    chips.push({
      key:      "district",
      label:    `📍 ${appliedFilters.district}`,
      onRemove: () => { setFilter("district", ""); applyFilters(); },
    });
  }

  if (appliedFilters.sort !== "newest") {
    const labels: Record<string, string> = {
      price_asc:  "Дешевле",
      price_desc: "Дороже",
      popular:    "Популярные",
    };
    chips.push({
      key:      "sort",
      label:    labels[appliedFilters.sort] ?? "",
      onRemove: () => { setFilter("sort", "newest"); applyFilters(); },
    });
  }

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="
            flex shrink-0 items-center gap-1.5 rounded-full
            bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary
          "
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </span>
      ))}

      {/* Clear all */}
      <button
        type="button"
        onClick={resetFilters}
        className="shrink-0 text-xs text-gray-400 underline-offset-2 hover:underline"
      >
        Сбросить все
      </button>
    </div>
  );
}
