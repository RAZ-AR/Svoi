// Svoi — Sticky action bar on listing detail: Favorite + Write + Call
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Phone } from "lucide-react";
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
  isMine?: boolean;  // hide write/call if it's your own listing
}

export function ListingActions({
  listingId,
  sellerId,
  sellerPhone,
  isFavorite: initialFavorite = false,
  isMine = false,
}: ListingActionsProps) {
  const auth = useAuth();
  const router = useRouter();
  const { webApp } = useTelegram();
  const [fav, setFav] = useState(initialFavorite);
  const [favLoading, setFavLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // ── Write button → open chat ─────────────────────────────────────────────
  const handleWrite = useCallback(async () => {
    if (auth.status !== "authenticated") return router.push("/login");

    webApp?.HapticFeedback?.impactOccurred("medium");
    setChatLoading(true);

    const result = await startChat(listingId, sellerId);
    setChatLoading(false);

    if (result.ok) {
      router.push(`/chats/${result.chatId}`);
    }
  }, [auth, listingId, sellerId, router, webApp]);

  // ── Telegram MainButton wired to "Написать" ──────────────────────────────
  useTelegramMainButton({
    text:      isMine ? "Редактировать" : "Написать продавцу",
    onClick:   isMine ? () => router.push(`/listings/${listingId}/edit`) : handleWrite,
    isLoading: chatLoading,
    color:     "#3b6bff",
  });

  // ── Favorite toggle ───────────────────────────────────────────────────────
  async function handleFav() {
    if (auth.status !== "authenticated") return router.push("/login");

    webApp?.HapticFeedback?.impactOccurred("light");
    setFav((v) => !v); // optimistic
    setFavLoading(true);

    const result = await toggleFavorite(listingId, (auth as any).user.id);
    setFav(result.isFavorite);
    setFavLoading(false);
  }

  // ── Call button ───────────────────────────────────────────────────────────
  function handleCall() {
    if (!sellerPhone) return;
    webApp?.HapticFeedback?.impactOccurred("medium");
    window.open(`tel:${sellerPhone}`, "_self");
  }

  return (
    // Fixed bottom bar above the BottomNav (pb-20 in app layout handles the nav)
    <div
      className="
        sticky bottom-0 z-40
        flex items-center gap-3 bg-white/95 px-4 py-3
        backdrop-blur-md border-t border-gray-100
      "
    >
      {/* Favorite */}
      <button
        type="button"
        onClick={handleFav}
        disabled={favLoading}
        className="
          flex h-12 w-12 shrink-0 items-center justify-center
          rounded-2xl border border-gray-200 bg-white
          transition-colors active:bg-gray-50
        "
      >
        <Heart
          size={22}
          className={cn(
            "transition-all",
            fav ? "fill-red-500 stroke-red-500" : "stroke-gray-500",
            favLoading && "opacity-50"
          )}
        />
      </button>

      {/* Write — full width primary button */}
      {!isMine && (
        <button
          type="button"
          onClick={handleWrite}
          disabled={chatLoading}
          className="
            flex flex-1 items-center justify-center gap-2
            rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white
            shadow-md shadow-primary/25
            transition-all active:scale-[0.97] disabled:opacity-70
          "
        >
          <MessageCircle size={18} />
          {chatLoading ? "Открываем…" : "Написать"}
        </button>
      )}

      {/* Call — only if phone available */}
      {!isMine && sellerPhone && (
        <button
          type="button"
          onClick={handleCall}
          className="
            flex h-12 w-12 shrink-0 items-center justify-center
            rounded-2xl bg-green-50 border border-green-100
            transition-colors active:bg-green-100
          "
        >
          <Phone size={20} className="text-green-600" />
        </button>
      )}

      {/* Owner: edit button */}
      {isMine && (
        <button
          type="button"
          onClick={() => router.push(`/listings/${listingId}/edit`)}
          className="
            flex flex-1 items-center justify-center gap-2
            rounded-2xl border border-gray-200 bg-white py-3.5
            text-sm font-semibold text-gray-700
            transition-all active:scale-[0.97]
          "
        >
          Редактировать
        </button>
      )}
    </div>
  );
}
