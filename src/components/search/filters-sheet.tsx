// Svoi — Filters bottom sheet: category, price range, district, sort
"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useSearchStore, type SortOption } from "@/store/search.store";
import { useCategories } from "@/hooks/use-listings";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const DISTRICTS = [
  "Нови Београд", "Земун", "Вождовац", "Врачар",
  "Звездара",     "Палилула", "Чукарица", "Стари град",
];

const CURRENCIES = ["", "EUR", "RSD", "USD"] as const;

interface FiltersSheetProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function FiltersSheet({ isOpen, onClose }: FiltersSheetProps) {
  const { filters, setFilter, applyFilters, resetFilters } = useSearchStore();
  const { data: categories = [] } = useCategories();
  const t = useT();

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest",     label: t("search.sort_newest")    },
    { value: "price_asc",  label: t("search.sort_price_asc") },
    { value: "price_desc", label: t("search.sort_price_desc")},
    { value: "popular",    label: t("search.sort_popular")   },
  ];

  function handleApply() {
    applyFilters();
    onClose();
  }

  function handleReset() {
    resetFilters();
    onClose();
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => { applyFilters(); onClose(); }}
      title={t("search.filters")}
      maxHeight={92}
      footer={
        <div className="flex gap-3 py-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-2xl border border-gray-200 py-3.5 text-sm font-medium text-gray-600 active:bg-gray-50"
          >
            {t("common.reset")}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-[2] rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/25 active:scale-[0.97]"
          >
            {t("common.apply")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 py-2">

        {/* ── Category ───────────────────────────────────────────────────── */}
        <section>
          <p className="mb-2.5 text-sm font-semibold text-gray-700">{t("search.category")}</p>
          <div className="grid grid-cols-2 gap-2">
            <FilterChip
              label={t("common.all_categories")}
              emoji="🏙️"
              isActive={filters.categoryId === null}
              onClick={() => setFilter("categoryId", null)}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.name}
                emoji={cat.emoji ?? ""}
                isActive={filters.categoryId === cat.id}
                onClick={() =>
                  setFilter("categoryId", filters.categoryId === cat.id ? null : cat.id)
                }
              />
            ))}
          </div>
        </section>

        {/* ── Price range ─────────────────────────────────────────────────── */}
        <section>
          <p className="mb-2.5 text-sm font-semibold text-gray-700">{t("search.price")}</p>
          <div className="flex items-center gap-3">
            <PriceInput
              placeholder={t("common.from")}
              value={filters.minPrice}
              onChange={(v) => setFilter("minPrice", v)}
            />
            <span className="text-gray-400">—</span>
            <PriceInput
              placeholder={t("common.to")}
              value={filters.maxPrice}
              onChange={(v) => setFilter("maxPrice", v)}
            />
          </div>

          {/* Currency */}
          <div className="mt-3 flex gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter("currency", c)}
                className={cn(
                  "flex-1 rounded-xl border py-2 text-xs font-medium transition-colors",
                  filters.currency === c
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 bg-white text-gray-600"
                )}
              >
                {c === "" ? t("common.any") : c}
              </button>
            ))}
          </div>
        </section>

        {/* ── District ────────────────────────────────────────────────────── */}
        <section>
          <p className="mb-2.5 text-sm font-semibold text-gray-700">{t("search.district")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("district", "")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                filters.district === ""
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-gray-600"
              )}
            >
              {t("common.all_belgrade")}
            </button>
            {DISTRICTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setFilter("district", filters.district === d ? "" : d)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                  filters.district === d
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 bg-white text-gray-600"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        {/* ── Sort ────────────────────────────────────────────────────────── */}
        <section>
          <p className="mb-2.5 text-sm font-semibold text-gray-700">{t("search.sort")}</p>
          <div className="flex flex-col gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter("sort", opt.value)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors",
                  filters.sort === opt.value
                    ? "bg-primary/8 font-semibold text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {opt.label}
                {filters.sort === opt.value && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Bottom padding for safe area */}
        <div className="h-2" />
      </div>
    </BottomSheet>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({
  label, emoji, isActive, onClick,
}: {
  label: string; emoji: string; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all active:scale-[0.97]",
        isActive
          ? "border-primary bg-primary/8 text-primary"
          : "border-gray-200 bg-white text-gray-700"
      )}
    >
      <span className="text-base leading-none">{emoji}</span>
      <span className="truncate">{label}</span>
      {isActive && <span className="ml-auto text-primary">✓</span>}
    </button>
  );
}

function PriceInput({
  placeholder, value, onChange,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={0}
      className="
        flex-1 rounded-xl border border-gray-200 bg-gray-50
        px-3 py-2.5 text-sm text-gray-900
        placeholder:text-gray-400
        focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
      "
    />
  );
}
