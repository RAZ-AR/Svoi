// Svoi — Utility functions
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind + clsx class merger (shadcn/ui standard) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price: null → "Договорная", 0 → "Бесплатно", else "1 500 €" */
export function formatPrice(price: number | null, currency = "EUR"): string {
  if (price === null || price === undefined) return "Договорная";
  if (price === 0) return "Бесплатно";

  const symbols: Record<string, string> = {
    EUR: "€",
    RSD: "RSD",
    USD: "$",
  };

  const formatted = new Intl.NumberFormat("ru-RU").format(price);
  const symbol = symbols[currency] ?? currency;

  // EUR and USD: symbol after number (European style)
  return currency === "USD"
    ? `$${formatted}`
    : `${formatted} ${symbol}`;
}

/** Relative time: "5 минут назад", "вчера", "23 янв" */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1)  return "только что";
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffH < 24)   return `${diffH} ч. назад`;
  if (diffD === 1)  return "вчера";
  if (diffD < 7)    return `${diffD} дн. назад`;

  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/** Truncate text to max chars with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

/** Belgrade center coordinates — default map center */
export const BELGRADE_CENTER = { lat: 44.8176, lng: 20.4569 } as const;

/** Novi Beograd default bounds */
export const NOVI_BEOGRAD_BOUNDS = {
  sw: { lat: 44.776, lng: 20.372 },
  ne: { lat: 44.857, lng: 20.475 },
} as const;


/** Parse images field that may come from DB as JSON string or array */
export function parseImages(raw: unknown): { url: string }[] {
  if (Array.isArray(raw)) return raw as { url: string }[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}
