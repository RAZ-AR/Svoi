// Svoi — Listing detail: warm minimal style (product details screen)
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Eye, Calendar, MapPin } from "lucide-react";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { useAuth } from "@/components/auth/auth-provider";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingMap } from "@/components/listings/listing-map";
import { ListingActions } from "@/components/listings/listing-actions";
import { SellerCard } from "@/components/listings/seller-card";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import type { ListingWithUser } from "@/actions/listings";

interface ListingDetailClientProps {
  listing: ListingWithUser;
}

export function ListingDetailClient({ listing }: ListingDetailClientProps) {
  const router = useRouter();
  const auth = useAuth();

  const handleBack = useCallback(() => router.back(), [router]);
  useTelegramBack(handleBack);

  const images = (listing.images as { url: string }[]) ?? [];
  const isMine =
    auth.status === "authenticated" &&
    auth.user.id === listing.user_id;

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F0EB]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm active:bg-[#EDE8E2]"
        >
          <ArrowLeft size={18} className="text-[#1A1A1A]" />
        </button>

        <span className="text-sm font-semibold text-[#1A1A1A]">
          {listing.category?.name ?? "Объявление"}
        </span>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm active:bg-[#EDE8E2]"
        >
          <MoreHorizontal size={18} className="text-[#1A1A1A]" />
        </button>
      </div>

      {/* ── Product image area ─────────────────────────────────────────────── */}
      <div className="mx-5 mb-1 overflow-hidden rounded-[1.5rem] bg-[#EDE8E2]">
        <div className="relative flex aspect-square w-full items-center justify-center">
          <ListingGallery
            images={images}
            title={listing.title}
            emoji={listing.category?.emoji}
          />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 px-5 pb-4 pt-4">

        {/* Meta row: views + time */}
        <div className="flex items-center gap-3 text-xs text-[#A89070]">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {listing.views}
          </span>
          <span>·</span>
          <span>{formatRelativeTime(listing.created_at)}</span>
          {listing.address && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin size={10} />
                {listing.address}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black leading-tight text-[#1A1A1A]">
          {listing.title}
        </h1>

        {/* Description */}
        {listing.description && (
          <ExpandableDescription text={listing.description} />
        )}

        {/* Event date */}
        {listing.event_date && (
          <div className="flex items-center gap-2 rounded-2xl bg-[#EDE8E2] px-4 py-3">
            <Calendar size={15} className="text-[#8A7255]" />
            <span className="text-sm font-medium text-[#1A1A1A]">
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

        {/* Map */}
        {listing.lat && listing.lng && (
          <div className="overflow-hidden rounded-2xl">
            <ListingMap
              lat={listing.lat}
              lng={listing.lng}
              title={listing.title}
              address={listing.address}
            />
          </div>
        )}

        {/* Seller */}
        <SellerCard seller={listing.user} />

        <div className="h-4" />
      </div>

      {/* ── Sticky bottom: price + action ─────────────────────────────────── */}
      <ListingActions
        listingId={listing.id}
        sellerId={listing.user_id}
        sellerPhone={listing.user?.phone ?? null}
        isMine={isMine}
        price={formatPrice(listing.price, listing.currency)}
      />
    </div>
  );
}

// ─── Expandable description ────────────────────────────────────────────────────

function ExpandableDescription({ text }: { text: string }) {
  const MAX = 200;
  const isLong = text.length > MAX;

  return (
    <div>
      {isLong ? (
        <div>
          <input type="checkbox" id="desc-toggle" className="peer hidden" />
          <p className="text-sm leading-relaxed text-[#6B5E50] peer-checked:hidden">
            {text.slice(0, MAX)}…{" "}
            <label htmlFor="desc-toggle" className="cursor-pointer font-semibold text-[#1A1A1A]">
              Читать полностью
            </label>
          </p>
          <p className="hidden text-sm leading-relaxed text-[#6B5E50] peer-checked:block">
            {text}{" "}
            <label htmlFor="desc-toggle" className="cursor-pointer font-semibold text-[#1A1A1A]">
              Свернуть
            </label>
          </p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-[#6B5E50]">{text}</p>
      )}
    </div>
  );
}
