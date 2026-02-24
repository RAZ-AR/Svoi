// Svoi — Category filter chips floating over the map
"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/lib/supabase/database.types";

interface MapCategoryFilterProps {
  categories:    Category[];
  activeSlug:    string | null;
  onSelect:      (slug: string | null) => void;
}

export function MapCategoryFilter({
  categories,
  activeSlug,
  onSelect,
}: MapCategoryFilterProps) {
  return (
    <div
      className="
        flex gap-2 overflow-x-auto py-1
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
      "
    >
      {/* "All" chip */}
      <CategoryChip
        emoji="🗺️"
        label="Все"
        isActive={activeSlug === null}
        onClick={() => onSelect(null)}
      />
      {categories.map((cat) => (
        <CategoryChip
          key={cat.slug}
          emoji={cat.emoji ?? ""}
          label={cat.name}
          isActive={activeSlug === cat.slug}
          onClick={() => onSelect(activeSlug === cat.slug ? null : cat.slug)}
        />
      ))}
    </div>
  );
}

function CategoryChip({
  emoji, label, isActive, onClick,
}: {
  emoji: string; label: string; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5",
        "text-xs font-medium shadow-md transition-all duration-150 active:scale-95",
        isActive
          ? "bg-primary text-white shadow-primary/30"
          : "bg-white text-gray-700 shadow-black/10"
      )}
    >
      <span className="text-sm leading-none">{emoji}</span>
      {label}
    </button>
  );
}
