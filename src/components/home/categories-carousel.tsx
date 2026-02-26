// Svoi — Category carousel: pill filter chips (outlined / active=sand)
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
      router.push("/home");
    } else {
      router.push(`/home?category=${slug}`);
    }
  }

  return (
    <div className="relative">
      <div
        className="
          flex gap-2 overflow-x-auto py-1
          scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            category={cat}
            isActive={activeSlug === cat.slug}
            onClick={() => handleClick(cat.slug)}
          />
        ))}
      </div>

      {/* Fade hint — matches warm cream background */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#EBEBEB]" />
    </div>
  );
}

// ─── Single chip ──────────────────────────────────────────────────────────────

function CategoryChip({
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
        "flex shrink-0 items-center gap-2 rounded-full px-4 py-2",
        "border text-sm font-medium transition-all duration-150 active:scale-95",
        isActive
          ? "border-[#C9B99A] bg-[#C9B99A] text-[#1A1A1A]"
          : "border-[#D9D9D9] bg-white text-[#555555]"
      )}
    >
      <span className="text-base leading-none">{category.emoji ?? "📌"}</span>
      <span className="whitespace-nowrap">{category.name}</span>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function CategoriesCarouselSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden py-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-[#E0E0E0]"
        />
      ))}
    </div>
  );
}
