// Svoi — Embedded map for listing detail (Leaflet, SSR-safe)
"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

interface ListingMapProps {
  lat: number;
  lng: number;
  title: string;
  address?: string | null;
}

// Leaflet must be loaded client-side only
const MapInner = dynamic(() => import("./listing-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <MapPin size={24} />
        <span className="text-xs">Загрузка карты…</span>
      </div>
    </div>
  ),
});

export function ListingMap({ lat, lng, title, address }: ListingMapProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100">
      {/* Map tile */}
      <div className="h-44 w-full">
        <MapInner lat={lat} lng={lng} title={title} />
      </div>

      {/* Address row */}
      {address && (
        <div className="flex items-center gap-2 px-4 py-3">
          <MapPin size={14} className="shrink-0 text-gray-400" />
          <span className="text-sm text-gray-600">{address}</span>
        </div>
      )}
    </div>
  );
}
