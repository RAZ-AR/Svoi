// Svoi — Map overlay controls: locate-me + listing count badge
"use client";

import { Locate, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  listingCount:   number;
  isLocating:     boolean;
  onLocateMe:     () => void;
  showSearchHere: boolean;
  onSearchHere:   () => void;
  isLoadingArea:  boolean;
}

export function MapControls({
  listingCount,
  isLocating,
  onLocateMe,
  showSearchHere,
  onSearchHere,
  isLoadingArea,
}: MapControlsProps) {
  return (
    <>
      {/* ── "Search this area" pill — appears after panning ──────────────── */}
      <div
        className={cn(
          "absolute left-1/2 top-4 z-20 -translate-x-1/2 transition-all duration-300",
          showSearchHere
            ? "translate-y-0 opacity-100"
            : "-translate-y-3 opacity-0 pointer-events-none"
        )}
      >
        <button
          type="button"
          onClick={onSearchHere}
          disabled={isLoadingArea}
          className="
            flex items-center gap-2 rounded-full
            bg-white px-4 py-2.5
            text-sm font-semibold text-gray-800
            shadow-lg shadow-black/15
            transition-all active:scale-95 disabled:opacity-60
          "
        >
          {isLoadingArea ? (
            <Loader2 size={14} className="animate-spin text-primary" />
          ) : (
            <span className="text-primary">🔍</span>
          )}
          {isLoadingArea ? "Ищем…" : "Найти здесь"}
        </button>
      </div>

      {/* ── Listing count badge ───────────────────────────────────────────── */}
      {listingCount > 0 && (
        <div className="absolute bottom-28 left-4 z-20">
          <div className="rounded-full bg-white px-3 py-1.5 shadow-md shadow-black/10">
            <span className="text-xs font-semibold text-gray-700">
              {listingCount} объявл.
            </span>
          </div>
        </div>
      )}

      {/* ── Locate me button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onLocateMe}
        disabled={isLocating}
        className="
          absolute bottom-28 right-4 z-20
          flex h-10 w-10 items-center justify-center
          rounded-full bg-white shadow-md shadow-black/15
          transition-all active:scale-90 disabled:opacity-60
        "
      >
        {isLocating ? (
          <Loader2 size={18} className="animate-spin text-primary" />
        ) : (
          <Locate size={18} className="text-gray-600" />
        )}
      </button>
    </>
  );
}
