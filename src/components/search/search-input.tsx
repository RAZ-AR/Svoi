// Svoi — Search input with clear button and loading indicator
"use client";

import { useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useSearchStore } from "@/store/search.store";

interface SearchInputProps {
  isSearching?: boolean;
  autoFocus?:   boolean;
}

export function SearchInput({ isSearching = false, autoFocus = true }: SearchInputProps) {
  const { query, setQuery } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when search page opens
  useEffect(() => {
    if (autoFocus) {
      // Small delay so the page transition completes first
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <div className="relative flex items-center">
      {/* Left icon: spinner while searching, magnifier otherwise */}
      <div className="pointer-events-none absolute left-4 flex items-center">
        {isSearching ? (
          <Loader2 size={18} className="animate-spin text-primary" />
        ) : (
          <Search size={18} className="text-gray-400" />
        )}
      </div>

      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по Svoi"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="
          w-full rounded-2xl border border-gray-100 bg-gray-50
          py-3.5 pl-11 pr-10 text-base text-gray-900
          placeholder:text-gray-400
          focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
          [&::-webkit-search-cancel-button]:hidden
        "
      />

      {/* Clear button */}
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500 transition-colors active:bg-gray-300"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
