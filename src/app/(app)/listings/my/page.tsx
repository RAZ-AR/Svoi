// Svoi — My listings page with status tabs
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { MyListingCard, MyListingCardSkeleton } from "@/components/listings/my-listing-card";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { useMyListings } from "@/hooks/use-my-listings";
import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/lib/supabase/database.types";

type TabStatus = "active" | "paused" | "sold";

const TABS: { value: TabStatus; label: string }[] = [
  { value: "active", label: "Активные" },
  { value: "paused", label: "Скрытые"  },
  { value: "sold",   label: "Проданные"},
];

export default function MyListingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabStatus>("active");
  const { data: listings, isLoading } = useMyListings();

  useTelegramBack(useCallback(() => router.back(), [router]));

  const filtered = listings?.filter((l) => l.status === tab) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader
        title="Мои объявления"
        showLogo={false}
        rightSlot={
          <button
            type="button"
            onClick={() => router.push("/listings/new")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        }
      />

      {/* Status tabs */}
      <div className="flex border-b border-gray-100 px-4">
        {TABS.map((t) => {
          const count = listings?.filter((l) => l.status === t.value).length ?? 0;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                tab === t.value
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-400"
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  tab === t.value ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 divide-y divide-gray-50">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <MyListingCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyTab status={tab} />
        ) : (
          filtered.map((listing) => (
            <MyListingCard key={listing.id} listing={listing} />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyTab({ status }: { status: TabStatus }) {
  const router = useRouter();
  const cfg = {
    active: { emoji: "📋", text: "Нет активных объявлений", cta: true  },
    paused: { emoji: "⏸️", text: "Нет приостановленных",    cta: false },
    sold:   { emoji: "✅", text: "Нет проданных",            cta: false },
  }[status];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <p className="text-5xl">{cfg.emoji}</p>
      <p className="mt-4 text-base font-semibold text-gray-700">{cfg.text}</p>
      {cfg.cta && (
        <button
          type="button"
          onClick={() => router.push("/listings/new")}
          className="mt-6 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25"
        >
          Разместить объявление
        </button>
      )}
    </div>
  );
}
