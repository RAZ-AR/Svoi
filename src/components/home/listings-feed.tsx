// Svoi — Listings feed: infinite scroll 2-column grid
"use client";

import { useEffect, useRef } from "react";
import { useHomeFeed } from "@/hooks/use-listings";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/listing-card";
import type { FeedFilters } from "@/actions/listings";

interface ListingsFeedProps {
  filters?: FeedFilters;
}

export function ListingsFeed({ filters = {} }: ListingsFeedProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useHomeFeed(filters);

  // ── Infinite scroll via IntersectionObserver ─────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" } // trigger 200px before hitting bottom
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Loading skeletons ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-400">Не удалось загрузить объявления</p>
      </div>
    );
  }

  const listings = data?.pages.flatMap((p) => p.listings) ?? [];

  // ── Empty state ───────────────────────────────────────────────────────────
  if (listings.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl">🏙️</p>
        <p className="mt-3 text-base font-medium text-gray-700">Пока пусто</p>
        <p className="mt-1 text-sm text-gray-400">
          Будьте первым — разместите объявление!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="grid grid-cols-2 gap-3 pt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* End of feed */}
      {!hasNextPage && listings.length > 10 && (
        <p className="py-8 text-center text-xs text-gray-300">
          Это все объявления
        </p>
      )}
    </div>
  );
}
