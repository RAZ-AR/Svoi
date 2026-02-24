// Svoi — Promo banner: hero card on home screen (teal gradient)
"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export function PromoBanner() {
  const t = useT();

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#5CC8D0] to-[#3AA5AD] px-5 py-6 text-white shadow-lg shadow-[#45B8C0]/20">
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/70">
        {t("home.promo_tag")}
      </p>
      <h2 className="mb-1 whitespace-pre-line text-2xl font-extrabold leading-tight">
        {t("home.promo_title")}
      </h2>
      <p className="mb-5 text-sm text-white/80">
        {t("home.promo_subtitle")}
      </p>
      <div className="flex gap-3">
        <Link
          href="/search"
          className="rounded-full bg-[#1A1E22] px-5 py-2 text-sm font-semibold text-white active:scale-95 transition-transform"
        >
          {t("home.promo_browse")}
        </Link>
        <Link
          href="/listings/new"
          className="rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-semibold text-white active:scale-95 transition-transform"
        >
          {t("home.promo_post")}
        </Link>
      </div>
    </div>
  );
}

// ─── Info strip ───────────────────────────────────────────────────────────────

export function PromoStrip() {
  const t = useT();

  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#1A1E22] px-4 py-2.5 text-center text-xs text-white">
      <span className="text-base">🎉</span>
      <span>
        {t("home.promo_strip")}{" "}
        <span className="font-semibold text-[#5CC8D0]">{t("home.promo_strip_free")}</span>
      </span>
    </div>
  );
}
