// Svoi — Listing preview card that slides up when a map pin is tapped
"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle, ChevronRight } from "lucide-react";
import { cn, formatPrice, formatRelativeTime } from "@/lib/utils";
import type { MapListing } from "@/actions/map";

interface MapListingPreviewProps {
  listing:  MapListing | null;
  onClose:  () => void;
}

export function MapListingPreview({ listing, onClose }: MapListingPreviewProps) {
  const isVisible = !!listing;

  return (
    <>
      {/* Backdrop — tap to close */}
      <div
        className={cn(
          "fixed inset-0 z-30 transition-opacity duration-200",
          isVisible ? "pointer-events-auto opacity-0" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Preview card */}
      <div
        className={cn(
          "fixed bottom-20 left-4 right-4 z-40",
          "transition-all duration-300 ease-out",
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {listing && (
          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/15 border border-gray-100">
            <Link
              href={`/listings/${listing.id}`}
              className="flex items-stretch gap-0"
            >
              {/* Image */}
              <div className="relative w-28 shrink-0 bg-gray-100">
                {listing.images?.[0]?.url ? (
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">
                    {listing.category?.emoji ?? "📦"}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col justify-between p-3.5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                      {listing.title}
                    </p>
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); onClose(); }}
                      className="shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="mt-1 text-base font-bold text-primary">
                    {formatPrice(listing.price, listing.currency)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {listing.address && (
                      <>
                        <MapPin size={11} />
                        <span className="truncate max-w-[120px]">{listing.address}</span>
                      </>
                    )}
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-gray-300" />
                </div>
              </div>
            </Link>

            {/* Quick action bar */}
            <div className="flex border-t border-gray-100">
              <Link
                href={`/listings/${listing.id}`}
                className="flex-1 py-3 text-center text-xs font-medium text-gray-600 transition-colors active:bg-gray-50"
              >
                Подробнее
              </Link>
              <div className="w-px bg-gray-100" />
              <Link
                href={`/listings/${listing.id}#write`}
                className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-primary transition-colors active:bg-primary/5"
              >
                <MessageCircle size={13} />
                Написать
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
