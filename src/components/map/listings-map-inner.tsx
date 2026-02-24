// Svoi — Leaflet map with clustered listing pins (client-only)
"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapListing, MapBounds } from "@/actions/map";

// Category color palette — one color per category slug
const CATEGORY_COLORS: Record<string, string> = {
  rent:      "#3b6bff",
  jobs:      "#8b5cf6",
  stuff:     "#f59e0b",
  services:  "#10b981",
  transport: "#ef4444",
  education: "#6366f1",
  meetups:   "#ec4899",
  misc:      "#6b7280",
};

function makePinIcon(emoji: string, slug: string, isSelected: boolean) {
  const color = CATEGORY_COLORS[slug] ?? "#3b6bff";
  const size  = isSelected ? 44 : 36;
  const ring  = isSelected ? `ring:3px solid white;box-shadow:0 0 0 3px ${color};` : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50% 50% 50% 0;
        background:${color};
        border:2.5px solid white;
        transform:rotate(-45deg);
        box-shadow:0 2px 10px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        ${ring}
        transition:all 0.15s ease;
      ">
        <span style="transform:rotate(45deg);font-size:${isSelected ? 18 : 15}px;line-height:1">
          ${emoji}
        </span>
      </div>
    `,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size],
  });
}

function makeClusterIcon(count: number) {
  const size = count > 50 ? 48 : count > 10 ? 42 : 36;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:#3b6bff;
        border:3px solid white;
        box-shadow:0 2px 10px rgba(59,107,255,0.4);
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:13px;font-weight:700;
      ">${count}</div>
    `,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface ListingsMapInnerProps {
  listings:         MapListing[];
  selectedId:       string | null;
  onSelectListing:  (listing: MapListing) => void;
  onBoundsChange:   (bounds: MapBounds) => void;
  onUserMoved:      () => void;
  centerLat:        number;
  centerLng:        number;
}

export default function ListingsMapInner({
  listings,
  selectedId,
  onSelectListing,
  onBoundsChange,
  onUserMoved,
  centerLat,
  centerLng,
}: ListingsMapInnerProps) {
  // Use manual clustering (no extra package dependency)
  const clusters = clusterListings(listings, 0.008);

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={13}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Markers */}
      {clusters.map((cluster) => {
        if (cluster.listings.length === 1) {
          const l = cluster.listings[0];
          return (
            <Marker
              key={l.id}
              position={[l.lat, l.lng]}
              icon={makePinIcon(
                l.category?.emoji ?? "📌",
                l.category?.slug ?? "misc",
                l.id === selectedId
              )}
              eventHandlers={{ click: () => onSelectListing(l) }}
            />
          );
        }
        // Cluster marker
        return (
          <Marker
            key={`cluster-${cluster.lat}-${cluster.lng}`}
            position={[cluster.lat, cluster.lng]}
            icon={makeClusterIcon(cluster.listings.length)}
            eventHandlers={{
              click: () => onSelectListing(cluster.listings[0]),
            }}
          />
        );
      })}

      {/* Map event handlers */}
      <MapEventHandler
        onBoundsChange={onBoundsChange}
        onUserMoved={onUserMoved}
      />
      <MapCenter lat={centerLat} lng={centerLng} />
    </MapContainer>
  );
}

// ─── Map event handler ────────────────────────────────────────────────────────

function MapEventHandler({
  onBoundsChange,
  onUserMoved,
}: {
  onBoundsChange: (b: MapBounds) => void;
  onUserMoved:    () => void;
}) {
  const hasMoved = useRef(false);

  useMapEvents({
    moveend(e) {
      const bounds = e.target.getBounds();
      onBoundsChange({
        swLat: bounds.getSouth(),
        swLng: bounds.getWest(),
        neLat: bounds.getNorth(),
        neLng: bounds.getEast(),
      });
      if (hasMoved.current) onUserMoved();
      hasMoved.current = true;
    },
    load(e) {
      const bounds = e.target.getBounds();
      onBoundsChange({
        swLat: bounds.getSouth(),
        swLng: bounds.getWest(),
        neLat: bounds.getNorth(),
        neLng: bounds.getEast(),
      });
    },
  });

  return null;
}

// ─── MapCenter ────────────────────────────────────────────────────────────────

function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef({ lat, lng });

  useEffect(() => {
    if (prev.current.lat === lat && prev.current.lng === lng) return;
    map.setView([lat, lng], 14, { animate: true });
    prev.current = { lat, lng };
  }, [map, lat, lng]);

  return null;
}

// ─── Simple grid-based clustering (no external dep) ──────────────────────────

interface Cluster {
  lat:      number;
  lng:      number;
  listings: MapListing[];
}

function clusterListings(listings: MapListing[], gridSize: number): Cluster[] {
  const cells = new Map<string, MapListing[]>();

  for (const l of listings) {
    const cellLat = Math.floor(l.lat / gridSize) * gridSize;
    const cellLng = Math.floor(l.lng / gridSize) * gridSize;
    const key = `${cellLat},${cellLng}`;
    const cell = cells.get(key) ?? [];
    cell.push(l);
    cells.set(key, cell);
  }

  return Array.from(cells.values()).map((group) => {
    const lat = group.reduce((s, l) => s + l.lat, 0) / group.length;
    const lng = group.reduce((s, l) => s + l.lng, 0) / group.length;
    return { lat, lng, listings: group };
  });
}
