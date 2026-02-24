// Svoi — Feed section header (client for i18n)
"use client";

import { MapButton } from "@/components/home/map-button";
import { useT } from "@/lib/i18n";

export function FeedHeader({ hasCategory }: { hasCategory: boolean }) {
  const t = useT();
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-gray-900">
        {hasCategory ? t("home.section_listings") : t("home.section_now")}
      </h2>
      <MapButton />
    </div>
  );
}
