// Svoi — Map button: pill that opens the full-screen map
"use client";

import Link from "next/link";
import { Map } from "lucide-react";
import { useTelegram } from "@/components/telegram/telegram-provider";

export function MapButton() {
  const { webApp } = useTelegram();

  function handleClick() {
    webApp?.HapticFeedback?.impactOccurred("light");
  }

  return (
    <Link
      href="/map"
      onClick={handleClick}
      className="
        flex items-center gap-1.5 rounded-full
        border border-gray-200 bg-white
        px-3 py-1.5
        text-xs font-medium text-gray-700
        shadow-sm transition-colors active:bg-gray-50
      "
    >
      <Map size={14} />
      Карта
    </Link>
  );
}
