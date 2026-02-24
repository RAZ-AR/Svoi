// Svoi — Wizard Step 3: title, description, price, event date (meetups)
"use client";

import { cn } from "@/lib/utils";
import { useNewListingStore } from "@/store/new-listing.store";
import { useTelegramMainButton } from "@/hooks/use-telegram-main-button";

const CURRENCIES = ["EUR", "RSD", "USD"] as const;

interface StepDetailsProps {
  onNext: () => void;
}

export function StepDetails({ onNext }: StepDetailsProps) {
  const { draft, updateDraft } = useNewListingStore();
  const isMeetup = draft.categoryEmoji === "☕"; // meetups category

  const canProceed = draft.title.trim().length >= 3;

  useTelegramMainButton({
    text:     "Далее →",
    onClick:  onNext,
    isActive: canProceed,
  });

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Детали</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {draft.categoryEmoji} {draft.categoryName}
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Заголовок <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => updateDraft({ title: e.target.value })}
          placeholder="Напр.: Диван IKEA в отличном состоянии"
          maxLength={120}
          className={cn(
            "w-full rounded-2xl border bg-gray-50 px-4 py-3.5 text-base text-gray-900",
            "placeholder:text-gray-400",
            "focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20",
            draft.title.length > 0 && draft.title.trim().length < 3
              ? "border-red-300"
              : "border-gray-200"
          )}
        />
        <div className="mt-1 flex justify-between">
          {draft.title.trim().length < 3 && draft.title.length > 0 && (
            <p className="text-xs text-red-400">Минимум 3 символа</p>
          )}
          <p className="ml-auto text-xs text-gray-400">
            {draft.title.length}/120
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Описание
        </label>
        <textarea
          value={draft.description}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Расскажите подробнее: состояние, размеры, история вещи…"
          rows={4}
          maxLength={2000}
          className="
            w-full resize-none rounded-2xl border border-gray-200 bg-gray-50
            px-4 py-3.5 text-base text-gray-900
            placeholder:text-gray-400
            focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
          "
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {draft.description.length}/2000
        </p>
      </div>

      {/* Price + currency */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Цена
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={draft.price}
            onChange={(e) => updateDraft({ price: e.target.value })}
            placeholder="0 — бесплатно, пусто — договорная"
            min={0}
            className="
              flex-1 rounded-2xl border border-gray-200 bg-gray-50
              px-4 py-3.5 text-base text-gray-900
              placeholder:text-sm placeholder:text-gray-400
              focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
            "
          />
          {/* Currency picker */}
          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateDraft({ currency: c })}
                className={cn(
                  "px-4 py-3.5 text-sm font-medium transition-colors",
                  draft.currency === c
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Оставьте пустым — покупатель увидит «Договорная»
        </p>
      </div>

      {/* Event date — only for meetups */}
      {isMeetup && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            📅 Дата и время встречи
          </label>
          <input
            type="datetime-local"
            value={draft.eventDate}
            onChange={(e) => updateDraft({ eventDate: e.target.value })}
            className="
              w-full rounded-2xl border border-gray-200 bg-gray-50
              px-4 py-3.5 text-base text-gray-900
              focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
            "
          />
        </div>
      )}

      {/* Fallback button */}
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className={cn(
          "mt-2 w-full rounded-2xl py-3.5 text-sm font-semibold transition-all",
          canProceed
            ? "bg-primary text-white shadow-md shadow-primary/25 active:scale-[0.97]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
      >
        Далее →
      </button>
    </div>
  );
}
