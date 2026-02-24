// Svoi — Search results: grid + empty states
"use client";

import { ListingCard, ListingCardSkeleton } from "@/components/listings/listing-card";
import { useSearch } from "@/hooks/use-search";
import { useSearchStore } from "@/store/search.store";

export function SearchResults() {
  const { query } = useSearchStore();
  const { data, isLoading, isEmpty, isSearching } = useSearch();

  const listings = data?.listings ?? [];
  const total    = data?.total ?? 0;

  // ── Loading skeletons ─────────────────────────────────────────────────────
  if (isLoading && listings.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-3 text-base font-medium text-gray-700">Ничего не найдено</p>
        <p className="mt-1 text-sm text-gray-400">
          Попробуйте другой запрос или{" "}
          <span className="text-primary">сбросьте фильтры</span>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Result count */}
      {total > 0 && (
        <p className="mb-3 text-xs text-gray-400">
          {isSearching ? "Ищем…" : `${total} ${pluralize(total, "объявление", "объявления", "объявлений")}`}
          {data?.source === "meilisearch" && data.processingMs !== undefined && (
            <span className="ml-1 text-gray-300">· {data.processingMs} мс</span>
          )}
        </p>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

// ─── Russian pluralization ─────────────────────────────────────────────────────
function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1)                  return one;
  if (mod10 >= 2 && mod10 <= 4)    return few;
  return many;
}
