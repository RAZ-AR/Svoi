// Svoi — Wizard Step 3: title, description, price, event date (meetups)
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNewListingStore } from "@/store/new-listing.store";
import { useT } from "@/lib/i18n";
import { WizardNextButton } from "@/components/wizard/wizard-next-button";

const CURRENCIES = ["EUR", "RSD", "USD"] as const;

interface StepDetailsProps {
  onNext: () => void;
}

export function StepDetails({ onNext }: StepDetailsProps) {
  const { draft, updateDraft } = useNewListingStore();
  const isMeetup = draft.categoryEmoji === "☕";
  const t = useT();
  const [isFree, setIsFree] = useState(draft.price === "0");

  const hasTitle = draft.title.trim().length >= 3;
  const hasPrice = isFree || draft.price.trim() !== "";
  const canProceed = hasTitle && hasPrice;

  function toggleFree() {
    const next = !isFree;
    setIsFree(next);
    updateDraft({ price: next ? "0" : "" });
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t("wizard.step_details")}</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {draft.categoryEmoji} {draft.categoryName}
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {t("wizard.title_label")} <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => updateDraft({ title: e.target.value })}
          placeholder={t("wizard.title_placeholder")}
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
            <p className="text-xs text-red-400">{t("wizard.title_min")}</p>
          )}
          <p className="ml-auto text-xs text-gray-400">
            {draft.title.length}/120
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {t("wizard.description_label")}
        </label>
        <textarea
          value={draft.description}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder={t("wizard.description_placeholder")}
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
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {t("wizard.price_label")} <span className="text-red-400">*</span>
          </label>
          {/* "Бесплатно" toggle */}
          <button
            type="button"
            onClick={toggleFree}
            className="flex items-center gap-2"
          >
            <span className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
              isFree ? "border-primary bg-primary" : "border-gray-300 bg-white"
            )}>
              {isFree && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            <span className={cn(
              "text-sm font-medium transition-colors",
              isFree ? "text-primary" : "text-gray-500"
            )}>
              Бесплатно
            </span>
          </button>
        </div>

        {!isFree && (
          <div className="flex gap-2">
            <input
              type="number"
              value={draft.price}
              onChange={(e) => updateDraft({ price: e.target.value })}
              placeholder={t("wizard.price_placeholder")}
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
        )}

        {isFree && (
          <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3.5">
            <span className="text-base font-semibold text-green-700">Бесплатно</span>
          </div>
        )}

        <p className="mt-1 text-xs text-gray-400">{t("wizard.price_hint")}</p>
      </div>

      {isMeetup && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t("wizard.event_date")}
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

      {/* Pill navigation button */}
      <WizardNextButton
        label={t("common.next")}
        onClick={onNext}
        disabled={!canProceed}
      />
    </div>
  );
}
