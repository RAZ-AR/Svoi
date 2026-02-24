// Svoi — Sticky action bar: price left + dark "Написать" pill right
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, Phone } from "lucide-react";
import { useTelegramMainButton } from "@/hooks/use-telegram-main-button";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { toggleFavorite } from "@/actions/listings";
import { startChat } from "@/actions/chats";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

interface ListingActionsProps {
  listingId: string;
  sellerId: string;
  sellerPhone?: string | null;
  isFavorite?: boolean;
  isMine?: boolean;
  price?: string;
}

export function ListingActions({
  listingId,
  sellerId,
  sellerPhone,
  isFavorite: initialFavorite = false,
  isMine = false,
  price,
}: ListingActionsProps) {
  const auth = useAuth();
  const router = useRouter();
  const { webApp } = useTelegram();
  const [fav, setFav] = useState(initialFavorite);
  const [favLoading, setFavLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleWrite = useCallback(async () => {
    if (auth.status !== "authenticated") return router.push("/login");
    webApp?.HapticFeedback?.impactOccurred("medium");
    setChatLoading(true);
    const result = await startChat(listingId, sellerId);
    setChatLoading(false);
    if (result.ok) router.push(`/chats/${result.chatId}`);
  }, [auth, listingId, sellerId, router, webApp]);

  useTelegramMainButton({
    text:      isMine ? "Редактировать" : "Написать продавцу",
    onClick:   isMine ? () => router.push(`/listings/${listingId}/edit`) : handleWrite,
    isLoading: chatLoading,
    color:     "#1A1A1A",
  });

  async function handleFav() {
    if (auth.status !== "authenticated") return router.push("/login");
    webApp?.HapticFeedback?.impactOccurred("light");
    setFav((v) => !v);
    setFavLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await toggleFavorite(listingId, (auth as any).user.id);
    setFav(result.isFavorite);
    setFavLoading(false);
  }

  function handleCall() {
    if (!sellerPhone) return;
    webApp?.HapticFeedback?.impactOccurred("medium");
    window.open(`tel:${sellerPhone}`, "_self");
  }

  return (
    <div className="sticky bottom-0 z-40 bg-[#F5F0EB] px-5 py-4">
      <div className="flex items-center gap-3">

        {/* Price */}
        {price && (
          <div className="flex-1">
            <p className="text-2xl font-black text-[#1A1A1A]">{price}</p>
          </div>
        )}

        {/* Favorite circle button */}
        <button
          type="button"
          onClick={handleFav}
          disabled={favLoading}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E5DED6] bg-white transition-colors active:bg-[#EDE8E2]"
        >
          <Heart
            size={20}
            className={cn(
              "transition-all",
              fav ? "fill-red-500 stroke-red-500" : "stroke-[#8A7255]",
              favLoading && "opacity-50"
            )}
          />
        </button>

        {/* Call button */}
        {!isMine && sellerPhone && (
          <button
            type="button"
            onClick={handleCall}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E5DED6] bg-white transition-colors active:bg-[#EDE8E2]"
          >
            <Phone size={18} className="text-[#1A1A1A]" />
          </button>
        )}

        {/* Write / Edit CTA */}
        {!isMine ? (
          <button
            type="button"
            onClick={handleWrite}
            disabled={chatLoading}
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#1A1A1A] text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-70"
          >
            {chatLoading ? "Открываем…" : "Написать"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push(`/listings/${listingId}/edit`)}
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#1A1A1A] text-sm font-semibold text-white transition-all active:scale-[0.97]"
          >
            Редактировать
          </button>
        )}
      </div>
    </div>
  );
}
