// Svoi — Category carousel: horizontal scroll, 8 big cards
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/supabase/database.types";

interface CategoriesCarouselProps {
  categories: Category[];
}

export function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category");

  function handleClick(slug: string) {
    if (activeSlug === slug) {
      // Tap active category → clear filter
      router.push("/home");
    } else {
      router.push(`/home?category=${slug}`);
    }
  }

  return (
    <div className="relative">
      {/* Horizontal scroll container — hide scrollbar */}
      <div
        className="
          flex gap-3 overflow-x-auto py-1
          scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            isActive={activeSlug === cat.slug}
            onClick={() => handleClick(cat.slug)}
          />
        ))}
      </div>

      {/* Fade on right edge to hint at more cards */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#BEC8C4]" />
    </div>
  );
}

// ─── Single category card ──────────────────────────────────────────────────────

function CategoryCard({
  category,
  isActive,
  onClick,
}: {
  category: Category;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base: pill shape, enough padding, shrink-0 so it doesn't collapse
        "flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3",
        "border transition-all duration-150 active:scale-95",
        // Active state
        isActive
          ? "border-[#45B8C0] bg-[#45B8C0] text-white shadow-md shadow-[#45B8C0]/30"
          : "border-transparent bg-white text-gray-700 shadow-sm shadow-black/6 hover:shadow-md"
      )}
    >
      <span className="text-2xl leading-none">{category.emoji ?? "📌"}</span>
      <span className="whitespace-nowrap text-xs font-medium leading-none">
        {category.name}
      </span>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function CategoriesCarouselSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden py-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex h-[76px] w-[76px] shrink-0 animate-pulse flex-col items-center gap-2 rounded-2xl bg-gray-100"
        />
      ))}
    </div>
  );
}
