// Svoi — Wizard Step 1: choose category
"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNewListingStore } from "@/store/new-listing.store";
import { useTelegramMainButton } from "@/hooks/use-telegram-main-button";
import { WizardNextButton } from "@/components/wizard/wizard-next-button";
import type { Category } from "@/lib/supabase/database.types";

interface StepCategoryProps {
  categories: Category[];
  onNext: () => void;
}

export function StepCategory({ categories, onNext }: StepCategoryProps) {
  const { draft, updateDraft } = useNewListingStore();
  const selected = draft.categoryId;

  function handleSelect(cat: Category) {
    updateDraft({
      categoryId:    cat.id,
      categoryName:  cat.name,
      categoryEmoji: cat.emoji ?? "",
    });
  }

  // Telegram MainButton: активна только когда категория выбрана
  useTelegramMainButton({
    text:     "Далее →",
    onClick:  onNext,
    isActive: selected !== null,
  });

  // Auto-advance when user taps a category (feels instant)
  useEffect(() => {
    if (selected !== null) {
      const timer = setTimeout(onNext, 180); // small delay for visual feedback
      return () => clearTimeout(timer);
    }
  }, [selected, onNext]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Что продаёте?</h2>
        <p className="mt-0.5 text-sm text-gray-500">Выберите категорию объявления</p>
      </div>

      {/* Pill navigation button — appears once category is picked */}
      {selected !== null && (
        <WizardNextButton label="Далее" onClick={onNext} />
      )}

      {/* 2-column grid of category tiles */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelect(cat)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left",
              "transition-all duration-150 active:scale-[0.97]",
              selected === cat.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-gray-100 bg-white hover:border-gray-200"
            )}
          >
            <span className="text-3xl leading-none">{cat.emoji ?? "📌"}</span>
            <span className={cn(
              "text-sm font-medium leading-tight",
              selected === cat.id ? "text-primary" : "text-gray-800"
            )}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
