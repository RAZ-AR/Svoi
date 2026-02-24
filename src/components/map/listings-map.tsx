// Svoi — Full map page shell: SSR-safe dynamic import + all overlays
"use client";

import { useState, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMapListings } from "@/hooks/use-map-listings";
import { getListingsInBounds, type MapBounds, type MapListing } from "@/actions/map";
import { MapCategoryFilter } from "./map-category-filter";
import { MapListingPreview } from "./map-listing-preview";
import { MapControls } from "./map-controls";
import { useCategories } from "@/hooks/use-listings";
import { BELGRADE_CENTER } from "@/lib/utils";

// Leaflet must be client-only
const MapInner = dynamic(() => import("./listings-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <p className="text-2xl">🗺️</p>
        <p className="mt-2 text-sm text-gray-500">Загружаем карту…</p>
      </div>
    </div>
  ),
});

export function ListingsMap() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();

  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [bounds, setBounds]           = useState<MapBounds | null>(null);
  const [selectedListing, setSelected] = useState<MapListing | null>(null);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const [centerLat, setCenterLat]     = useState(BELGRADE_CENTER.lat);
  const [centerLng, setCenterLng]     = useState(BELGRADE_CENTER.lng);
  const [isLocating, setIsLocating]   = useState(false);
  const [isPending, startTransition]  = useTransition();

  // TanStack Query for current bounds
  const { data: listings = [], isFetching } = useMapListings(bounds, activeCategorySlug ?? undefined);

  // ── "Search this area" after pan ─────────────────────────────────────────
  const handleUserMoved = useCallback(() => {
    setShowSearchHere(true);
  }, []);

  const handleSearchHere = useCallback(() => {
    setShowSearchHere(false);
    // bounds already updated by MapEventHandler → query refetches automatically
  }, []);

  const handleBoundsChange = useCallback((b: MapBounds) => {
    setBounds(b);
    setShowSearchHere(false); // reset on first load
  }, []);

  // ── Locate me ─────────────────────────────────────────────────────────────
  function handleLocateMe() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenterLat(pos.coords.latitude);
        setCenterLng(pos.coords.longitude);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    );
  }

  // ── Category filter ───────────────────────────────────────────────────────
  function handleCategorySelect(slug: string | null) {
    setActiveCategorySlug(slug);
    setShowSearchHere(false);
  }

  return (
    <div className="relative h-full w-full">
      {/* ── Fullscreen map ────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <MapInner
          listings={listings}
          selectedId={selectedListing?.id ?? null}
          onSelectListing={(l) => { setSelected(l); }}
          onBoundsChange={handleBoundsChange}
          onUserMoved={handleUserMoved}
          centerLat={centerLat}
          centerLng={centerLng}
        />
      </div>

      {/* ── Top overlay: back button + category chips ──────────────────────── */}
      <div className="absolute left-0 right-0 top-0 z-20 flex flex-col gap-2 px-4 pt-safe-top pb-2 pt-4">
        {/* Back row */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-full bg-white shadow-md shadow-black/15
              transition-all active:scale-90
            "
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>

          <div className="flex-1 overflow-hidden">
            <div className="rounded-2xl bg-white/90 px-3 py-2 shadow-md shadow-black/10 backdrop-blur-sm">
              <p className="text-sm font-semibold text-gray-900">
                Карта объявлений
              </p>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <MapCategoryFilter
          categories={categories}
          activeSlug={activeCategorySlug}
          onSelect={handleCategorySelect}
        />
      </div>

      {/* ── Map controls ──────────────────────────────────────────────────── */}
      <MapControls
        listingCount={listings.length}
        isLocating={isLocating}
        onLocateMe={handleLocateMe}
        showSearchHere={showSearchHere}
        onSearchHere={handleSearchHere}
        isLoadingArea={isFetching}
      />

      {/* ── Listing preview card ──────────────────────────────────────────── */}
      <MapListingPreview
        listing={selectedListing}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
