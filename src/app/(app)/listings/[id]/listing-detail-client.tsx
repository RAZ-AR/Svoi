// Svoi — Listing detail: client shell (needs router + Telegram hooks)
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, Calendar } from "lucide-react";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { useAuth } from "@/components/auth/auth-provider";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingMap } from "@/components/listings/listing-map";
import { ListingActions } from "@/components/listings/listing-actions";
import { SellerCard } from "@/components/listings/seller-card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import type { ListingWithUser } from "@/actions/listings";

interface ListingDetailClientProps {
  listing: ListingWithUser;
}

export function ListingDetailClient({ listing }: ListingDetailClientProps) {
  const router = useRouter();
  const auth = useAuth();

  // Wire Telegram back button → browser back
  const handleBack = useCallback(() => router.back(), [router]);
  useTelegramBack(handleBack);

  const images = (listing.images as { url: string }[]) ?? [];
  const isMine =
    auth.status === "authenticated" &&
    auth.user.id === listing.user_id;

  return (
    // No extra bottom padding here — ListingActions is sticky
    <div className="flex flex-col bg-white">
      {/* ── Gallery ────────────────────────────────────────────────────────── */}
      <ListingGallery
        images={images}
        title={listing.title}
        emoji={listing.category?.emoji}
      />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 px-4 pb-4 pt-4">

        {/* Category + meta row */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {listing.category?.emoji} {listing.category?.name}
          </Badge>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {listing.views}
            </span>
            <span>{formatRelativeTime(listing.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold leading-tight text-gray-900">
            {listing.title}
          </h1>

          {/* Price */}
          <p className="mt-2 text-2xl font-bold text-primary">
            {formatPrice(listing.price, listing.currency)}
          </p>
        </div>

        {/* Event date — shown only for meetups category */}
        {listing.event_date && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3">
            <Calendar size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-800">
              {new Date(listing.event_date).toLocaleDateString("ru-RU", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <ExpandableDescription text={listing.description} />
        )}

        {/* Map */}
        {listing.lat && listing.lng && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Расположение
            </h2>
            <ListingMap
              lat={listing.lat}
              lng={listing.lng}
              title={listing.title}
              address={listing.address}
            />
          </section>
        )}

        {/* Seller */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Продавец
          </h2>
          <SellerCard seller={listing.user} />
        </section>

        {/* Bottom padding so sticky actions don't overlap last content */}
        <div className="h-4" />
      </div>

      {/* ── Sticky action bar ──────────────────────────────────────────────── */}
      <ListingActions
        listingId={listing.id}
        sellerId={listing.user_id}
        sellerPhone={listing.user?.phone ?? null}
        isMine={isMine}
      />
    </div>
  );
}

// ─── Expandable description ────────────────────────────────────────────────────

function ExpandableDescription({ text }: { text: string }) {
  const MAX = 200;
  const isLong = text.length > MAX;

  // We use a checkbox trick for expand/collapse — no JS state needed
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Описание
      </h2>

      {isLong ? (
        <div className="group">
          <input type="checkbox" id="desc-toggle" className="peer hidden" />
          {/* Collapsed */}
          <p className="text-sm leading-relaxed text-gray-700 peer-checked:hidden">
            {text.slice(0, MAX)}…{" "}
            <label
              htmlFor="desc-toggle"
              className="cursor-pointer font-medium text-primary"
            >
              Читать полностью
            </label>
          </p>
          {/* Expanded */}
          <p className="hidden text-sm leading-relaxed text-gray-700 peer-checked:block">
            {text}{" "}
            <label
              htmlFor="desc-toggle"
              className="cursor-pointer font-medium text-primary"
            >
              Свернуть
            </label>
          </p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-gray-700">{text}</p>
      )}
    </section>
  );
}
