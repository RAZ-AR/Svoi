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
        rounded-2xl bg-gray-50 px-4 py-3.5
        border border-gray-100
        text-left
        transition-colors active:bg-gray-100
      "
    >
      <Search size={20} className="shrink-0 text-gray-400" />
      <span className="text-base text-gray-400">
        Что ищем?
      </span>
    </button>
  );
}
