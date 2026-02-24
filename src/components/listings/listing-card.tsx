// Svoi — Listing card: shown in 2-column feed grid
"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn, formatPrice, formatRelativeTime } from "@/lib/utils";
import type { ListingWithUser } from "@/actions/listings";

interface ListingCardProps {
  listing: ListingWithUser;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  className?: string;
}

export function ListingCard({
  listing,
  isFavorite = false,
  onFavoriteToggle,
  className,
}: ListingCardProps) {
  const images = listing.images as { url: string }[];
  const coverImage = images?.[0]?.url;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white",
        "border border-gray-100 shadow-sm",
        "transition-transform duration-150 active:scale-[0.97]",
        className
      )}
    >
      {/* ── Cover image ───────────────────────────────────────────────────── */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Placeholder when no image
          <div className="flex h-full items-center justify-center text-3xl">
            {listing.category?.emoji ?? "📦"}
          </div>
        )}

        {/* Favorite button */}
        {onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle(listing.id);
            }}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors active:bg-white"
          >
            <Heart
              size={16}
              className={cn(
                "transition-colors",
                isFavorite ? "fill-red-500 stroke-red-500" : "stroke-gray-500"
              )}
            />
          </button>
        )}

        {/* Category badge — top left */}
        <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 backdrop-blur-sm">
          {listing.category?.emoji} {listing.category?.name}
        </span>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        {/* Price */}
        <p className="text-sm font-semibold text-gray-900">
          {formatPrice(listing.price, listing.currency)}
        </p>

        {/* Title */}
        <p className="line-clamp-2 text-sm leading-snug text-gray-700">
          {listing.title}
        </p>

        {/* Location + time */}
        <div className="mt-auto flex items-center justify-between pt-1">
          {listing.address ? (
            <span className="truncate text-xs text-gray-400">
              📍 {listing.address}
            </span>
          ) : (
            <span />
          )}
          <span className="shrink-0 text-xs text-gray-400">
            {formatRelativeTime(listing.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton placeholder ──────────────────────────────────────────────────────

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-white border border-gray-100", className)}>
      <div className="aspect-square w-full animate-pulse bg-gray-100" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
