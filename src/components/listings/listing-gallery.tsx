// Svoi — Listing image gallery: swipeable, with dot indicators
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url: string;
  width?: number;
  height?: number;
}

interface ListingGalleryProps {
  images: GalleryImage[];
  title: string;
  emoji?: string | null;
}

export function ListingGallery({ images, title, emoji }: ListingGalleryProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  // ── Touch swipe ───────────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left → next
        setCurrent((c) => Math.min(c + 1, images.length - 1));
      } else {
        // swipe right → prev
        setCurrent((c) => Math.max(c - 1, 0));
      }
    }
    touchStartX.current = null;
  }

  // ── No images fallback ────────────────────────────────────────────────────
  if (!images || images.length === 0) {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center bg-gray-50">
        <BackButton onClick={() => router.back()} />
        <span className="text-7xl">{emoji ?? "📦"}</span>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-square w-full overflow-hidden bg-gray-100 select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Images */}
      {images.map((img, i) => (
        <div
          key={img.url}
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <Image
            src={img.url}
            alt={`${title} — фото ${i + 1}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Back button overlay */}
      <BackButton onClick={() => router.back()} />

      {/* Image counter badge */}
      {images.length > 1 && (
        <span className="absolute right-4 top-4 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {current + 1} / {images.length}
        </span>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === current
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        absolute left-4 top-4 z-10
        flex h-9 w-9 items-center justify-center
        rounded-full bg-black/30 backdrop-blur-sm
        transition-colors active:bg-black/50
      "
    >
      <ChevronLeft size={20} className="text-white" />
    </button>
  );
}
