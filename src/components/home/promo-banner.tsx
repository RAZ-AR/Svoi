// Svoi — Promo banner: warm minimal style (muted purple, warm text)
"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export function PromoBanner() {
  const t = useT();

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#8E7F96] px-5 py-5">
      {/* Decorative circle in background */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#A393AB]/30" />
      <div className="pointer-events-none absolute -bottom-6 right-10 h-24 w-24 rounded-full bg-[#7A6B82]/40" />

      <div className="relative z-10 max-w-[60%]">
        <p className="mb-3 text-base font-bold leading-snug text-white">
          {t("home.promo_title")}
        </p>
        <p className="mb-4 text-xs text-white/70">
          {t("home.promo_subtitle")}
        </p>
        <Link
          href="/search"
          className="inline-flex items-center rounded-full bg-[#1A1A1A] px-5 py-2 text-xs font-semibold text-white transition-transform active:scale-95"
        >
          {t("home.promo_browse")}
        </Link>
      </div>
    </div>
  );
}

/* PromoStrip is no longer shown — replaced by inline promo banner */
export function PromoStrip() {
  const t = useT();
  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-[#E0E0E0] px-4 py-2.5 text-xs text-[#1A1A1A]">
      <span>🎉</span>
      <span>
        {t("home.promo_strip")}{" "}
        <span className="font-semibold">{t("home.promo_strip_free")}</span>
      </span>
    </div>
  );
}
