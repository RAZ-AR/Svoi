// Svoi — Home search bar: pill shape, filter icon on right
"use client";

import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { useT } from "@/lib/i18n";

export function SearchBar() {
  const router = useRouter();
  const t = useT();

  return (
    <button
      type="button"
      onClick={() => router.push("/search")}
      className="
        flex w-full items-center gap-3
        rounded-full bg-white px-5 py-3.5
        shadow-sm
        text-left
        transition-all active:scale-[0.98]
      "
    >
      <Search size={18} className="shrink-0 text-[#A89070]" />
      <span className="flex-1 text-sm text-[#A89070]">
        {t("home.search_placeholder")}
      </span>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F0EB]">
        <SlidersHorizontal size={13} className="text-[#1A1A1A]" />
      </span>
    </button>
  );
}
