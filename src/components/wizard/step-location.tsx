// Svoi — Wizard Step 4: address + optional map pin
"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useNewListingStore } from "@/store/new-listing.store";
import { useTelegramMainButton } from "@/hooks/use-telegram-main-button";
import { BELGRADE_CENTER } from "@/lib/utils";

// Belgrade districts for quick pick
const DISTRICTS = [
  "Нови Београд",
  "Земун",
  "Вождовац",
  "Врачар",
  "Звездара",
  "Палилула",
  "Чукарица",
  "Стари град",
];

// Leaflet picker — SSR-safe
const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-44 items-center justify-center rounded-2xl bg-gray-50">
      <MapPin size={20} className="text-gray-400" />
    </div>
  ),
});

interface StepLocationProps {
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepLocation({ onSubmit, isSubmitting }: StepLocationProps) {
  const { draft, updateDraft } = useNewListingStore();

  useTelegramMainButton({
    text:      isSubmitting ? "Публикуем…" : "Опубликовать ✓",
    onClick:   onSubmit,
    isLoading: isSubmitting,
    isActive:  !isSubmitting,
    color:     "#22c55e", // green — final action
  });

  function selectDistrict(d: string) {
    updateDraft({ address: d });
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Где находится?</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Адрес поможет покупателям найти вас
        </p>
      </div>

      {/* Quick district picker */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Район</p>
        <div className="flex flex-wrap gap-2">
          {DISTRICTS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => selectDistrict(d)}
              className={`
                rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95
                ${
                  draft.address === d
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 bg-white text-gray-600"
                }
              `}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Free text address */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Или точный адрес
        </label>
        <input
          type="text"
          value={draft.address}
          onChange={(e) => updateDraft({ address: e.target.value })}
          placeholder="Напр.: Нови Београд, Блок 45, ул. Народних хероjа"
          className="
            w-full rounded-2xl border border-gray-200 bg-gray-50
            px-4 py-3.5 text-base text-gray-900
            placeholder:text-gray-400
            focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
          "
        />
      </div>

      {/* Map pin picker */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">
          Точка на карте{" "}
          <span className="font-normal text-gray-400">(необязательно)</span>
        </p>
        <div className="h-44 overflow-hidden rounded-2xl border border-gray-100">
          <LocationPicker
            lat={draft.lat ?? BELGRADE_CENTER.lat}
            lng={draft.lng ?? BELGRADE_CENTER.lng}
            onChange={(lat, lng) => updateDraft({ lat, lng })}
          />
        </div>
        {draft.lat && (
          <p className="mt-1 text-xs text-gray-400">
            📍 {draft.lat.toFixed(5)}, {draft.lng?.toFixed(5)}
          </p>
        )}
      </div>

      {/* Submit button (fallback) */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="
          w-full rounded-2xl bg-green-500 py-4 text-sm font-bold text-white
          shadow-lg shadow-green-500/25
          transition-all active:scale-[0.97] disabled:opacity-60
        "
      >
        {isSubmitting ? "Публикуем…" : "Опубликовать ✓"}
      </button>
    </div>
  );
}
