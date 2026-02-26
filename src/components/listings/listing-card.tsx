// Svoi — Listing card: warm minimal style (cream bg, centered image)
"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn, formatPrice, formatRelativeTime, parseImages } from "@/lib/utils";
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
  const images = parseImages(listing.images);
  const coverImage = images?.[0]?.url;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.25rem] bg-[#E0E0E0]",
        "transition-transform duration-150 active:scale-[0.97]",
        className
      )}
    >
      {/* ── Image area ────────────────────────────────────────────────────── */}
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden p-4">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-5xl">{listing.category?.emoji ?? "📦"}</span>
        )}

        {/* Favorite button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onFavoriteToggle?.(listing.id);
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors active:bg-white"
        >
          <Heart
            size={15}
            className={cn(
              "transition-colors",
              isFavorite ? "fill-red-500 stroke-red-500" : "stroke-[#888888]"
            )}
          />
        </button>
      </div>

      {/* ── Info ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 px-3 pb-4 pt-1">
        <p className="line-clamp-1 text-sm font-semibold text-[#1A1A1A]">
          {listing.title}
        </p>
        <p className="text-base font-bold text-[#1A1A1A]">
          {formatPrice(listing.price, listing.currency)}
        </p>
        {listing.address && (
          <p className="truncate text-xs text-[#999999]">
            {listing.address}
          </p>
        )}
        {/* Attribution + verified badge for channel-imported listings */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(listing as any).tg_channel && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {/* Primary channel tag */}
            <a
              href={`https://t.me/${(listing as any).tg_channel}/${(listing as any).tg_message_id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 rounded-full bg-[#E0F4FF] px-2 py-0.5 text-[10px] font-medium text-[#0090CC] hover:bg-[#CCE8FF]"
            >
              📌 @{(listing as any).tg_channel}
            </a>
            {/* Additional channel tags (cross-posted) */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((): { channel: string; message_id: number }[] => { const r = (listing as any).tg_sources; return Array.isArray(r) ? r : (typeof r === "string" ? JSON.parse(r) : []); })().map((src) => (
              <a
                key={src.channel}
                href={`https://t.me/${src.channel}/${src.message_id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 rounded-full bg-[#E0F4FF] px-2 py-0.5 text-[10px] font-medium text-[#0090CC] hover:bg-[#CCE8FF]"
              >
                📌 @{src.channel}
              </a>
            ))}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(listing as any).tg_author_verified && (
              <span
                title="Активный автор"
                className="inline-flex items-center rounded-full bg-[#E8F5E9] px-1.5 py-0.5 text-[10px] font-semibold text-[#2E7D32]"
              >
                ✓ Активный
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[1.25rem] bg-[#E0E0E0]", className)}>
      <div className="aspect-square w-full animate-pulse bg-[#D9D9D9]" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-[#D9D9D9]" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#D9D9D9]" />
      </div>
    </div>
  );
}
