// Svoi — Interactive Leaflet map for picking listing location (client-only)
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom draggable pin icon
const pinIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:32px;height:42px;
      display:flex;flex-direction:column;align-items:center;
    ">
      <div style="
        width:32px;height:32px;border-radius:50% 50% 50% 0;
        background:#3b6bff;border:3px solid white;
        transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.25);
      "></div>
    </div>
  `,
  iconSize:   [32, 42],
  iconAnchor: [16, 42],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom={false}
      zoomControl={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker lat={lat} lng={lng} onChange={onChange} />
      <MapSync lat={lat} lng={lng} />
    </MapContainer>
  );
}

// ─── Draggable marker — tap anywhere to reposition ────────────────────────────

function DraggableMarker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={[lat, lng]}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend(e) {
          const pos = (e.target as L.Marker).getLatLng();
          onChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

// ─── Sync map center when lat/lng prop changes ────────────────────────────────

function MapSync({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);
  return null;
}
