// Svoi — Home search bar: big tap target, routes to /search
"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/search")}
      className="
        flex w-full items-center gap-3
        rounded-2xl bg-white px-4 py-3.5
        shadow-sm shadow-black/5
        text-left
        transition-all active:scale-[0.98] active:shadow-none
      "
    >
      <Search size={18} className="shrink-0 text-[#45B8C0]" />
      <span className="flex-1 text-sm text-gray-400">
        Что ищем?
      </span>
    </button>
  );
}
