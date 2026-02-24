// Svoi — Edit listing page: pre-filled form (simplified, not full wizard)
"use client";

import { useState, useCallback, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { useTelegramMainButton } from "@/hooks/use-telegram-main-button";
import { useListing } from "@/hooks/use-listings";
import { updateListing } from "@/actions/my-listings";
import { cn } from "@/lib/utils";

const CURRENCIES = ["EUR", "RSD", "USD"] as const;

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: EditListingPageProps) {
  const { id } = use(params);
  const router  = useRouter();
  const { data: listing, isLoading } = useListing(id);

  useTelegramBack(useCallback(() => router.back(), [router]));

  // Form state — populated from listing
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [price,       setPrice]       = useState("");
  const [currency,    setCurrency]    = useState<"EUR"|"RSD"|"USD">("EUR");
  const [address,     setAddress]     = useState("");
  const [initialized, setInitialized] = useState(false);
  const [isPending,   startTransition] = useTransition();

  // Populate form once listing loads
  if (listing && !initialized) {
    setTitle(listing.title ?? "");
    setDescription(listing.description ?? "");
    setPrice(listing.price?.toString() ?? "");
    setCurrency((listing.currency as any) ?? "EUR");
    setAddress(listing.address ?? "");
    setInitialized(true);
  }

  const canSave = title.trim().length >= 3 && !isPending;

  function handleSave() {
    if (!canSave) return;

    startTransition(async () => {
      const result = await updateListing(id, {
        title:       title.trim(),
        description: description.trim() || "",
        price:       price ? parseFloat(price) : null,
        currency,
        address:     address.trim(),
      });

      if (result.ok) router.back();
      else alert(`Ошибка: ${result.error}`);
    });
  }

  useTelegramMainButton({
    text:      isPending ? "Сохраняем…" : "Сохранить",
    onClick:   handleSave,
    isActive:  canSave,
    isLoading: isPending,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader title="Редактировать" showLogo={false} />

      <div className="flex flex-col gap-5 px-4 pb-8 pt-2">

        {/* Category badge (read-only) */}
        {listing?.category && (
          <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-3">
            <span className="text-xl">{listing.category.emoji}</span>
            <span className="text-sm font-medium text-gray-700">{listing.category.name}</span>
            <span className="ml-auto text-xs text-gray-400">категория не меняется</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Заголовок <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Price + currency */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Цена</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Договорная"
              min={0}
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base placeholder:text-sm placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex overflow-hidden rounded-2xl border border-gray-200">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "px-3.5 py-3.5 text-sm font-medium transition-colors",
                    currency === c ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Адрес</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Нови Београд, Блок 45"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {isPending ? "Сохраняем…" : "Сохранить изменения"}
        </button>
      </div>
    </div>
  );
}
