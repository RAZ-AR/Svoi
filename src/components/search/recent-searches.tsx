// Svoi — Recent searches shown when query is empty (localStorage)
"use client";

import { useEffect, useState } from "react";
import { Clock, X, TrendingUp } from "lucide-react";
import { useSearchStore } from "@/store/search.store";

const STORAGE_KEY = "svoi:recent_searches";
const MAX_RECENT  = 8;

// Trending searches (static for now — later from analytics)
const TRENDING = ["Диван", "Аренда комната", "iPhone", "Работа", "Преподаватель русского"];

export function saveRecentSearch(query: string) {
  if (!query.trim() || typeof window === "undefined") return;
  try {
    const raw     = localStorage.getItem(STORAGE_KEY);
    const recents = raw ? (JSON.parse(raw) as string[]) : [];
    const updated = [query, ...recents.filter((q) => q !== query)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function RecentSearches() {
  const { setQuery } = useSearchStore();
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);

  function removeRecent(term: string) {
    setRecents((prev) => {
      const updated = prev.filter((q) => q !== term);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Recent */}
      {recents.length > 0 && (
        <section>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Clock size={13} />
            Недавние
          </p>
          <div className="flex flex-col">
            {recents.map((term) => (
              <div
                key={term}
                className="flex items-center justify-between py-2"
              >
                <button
                  type="button"
                  onClick={() => setQuery(term)}
                  className="flex-1 text-left text-sm text-gray-700"
                >
                  {term}
                </button>
                <button
                  type="button"
                  onClick={() => removeRecent(term)}
                  className="ml-3 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <TrendingUp size={13} />
          Популярно сейчас
        </p>
        <div className="flex flex-wrap gap-2">
          {TRENDING.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors active:bg-gray-50"
            >
              {term}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
