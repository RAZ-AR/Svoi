// Svoi — Listing card for "My listings" page: horizontal, with status + actions
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, MoreHorizontal } from "lucide-react";
import { ListingStatusBadge, ListingStatusSheet } from "./listing-status-sheet";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import type { ListingWithUser } from "@/actions/listings";

interface MyListingCardProps {
  listing: ListingWithUser;
}

export function MyListingCard({ listing }: MyListingCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const images = listing.images as { url: string }[];
  const cover  = images?.[0]?.url;

  return (
    <>
      <div className="flex items-stretch gap-3 bg-white px-4 py-3.5 transition-colors active:bg-gray-50">
        {/* Thumbnail */}
        <Link href={`/listings/${listing.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
          {cover ? (
            <Image src={cover} alt={listing.title} fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              {listing.category?.emoji ?? "📦"}
            </div>
          )}
        </Link>

        {/* Info */}
        <Link href={`/listings/${listing.id}`} className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <ListingStatusBadge status={listing.status} />
            <span className="shrink-0 text-[10px] text-gray-400">
              {formatRelativeTime(listing.created_at)}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-gray-900">
            {listing.title}
          </p>

          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-sm font-bold text-primary">
              {formatPrice(listing.price, listing.currency)}
            </p>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye size={11} />
              {listing.views}
            </span>
          </div>
        </Link>

        {/* Actions menu */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full transition-colors active:bg-gray-100"
        >
          <MoreHorizontal size={18} className="text-gray-400" />
        </button>
      </div>

      <ListingStatusSheet
        listingId={listing.id}
        currentStatus={listing.status}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function MyListingCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="h-20 w-20 animate-pulse rounded-2xl bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-16 animate-pulse rounded-full bg-gray-100" />
        <div className="h-3.5 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
