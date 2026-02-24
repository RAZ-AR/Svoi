// Svoi — i18n: LocaleProvider + useLocale + useT hook
// Supports: ru (default), en, sr
// Auto-detects: Telegram language → navigator.language → localStorage → ru
"use client";

import {
  createContext, useCallback, useContext, useEffect, useState,
} from "react";
import type { ReactNode } from "react";

import ru from "@/messages/ru.json";
import en from "@/messages/en.json";
import sr from "@/messages/sr.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Locale = "ru" | "en" | "sr";

type Messages = typeof ru; // ru is the canonical shape

const MESSAGES: Record<Locale, Messages> = { ru, en: en as Messages, sr: sr as Messages };

const LOCALE_LABELS: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  sr: "Srpski",
};

const LOCALE_FLAGS: Record<Locale, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  sr: "🇷🇸",
};

const STORAGE_KEY = "svoi_locale";

// ─── Auto-detect ──────────────────────────────────────────────────────────────

function detectLocale(): Locale {
  if (typeof window === "undefined") return "ru";

  // 1. User preference saved in localStorage
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && stored in MESSAGES) return stored;

  // 2. Telegram Mini App language
  const tgLang = (window as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } } })
    ?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLang) {
    if (tgLang.startsWith("ru")) return "ru";
    if (tgLang.startsWith("sr")) return "sr";
    if (tgLang.startsWith("en")) return "en";
  }

  // 3. Browser language
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("sr")) return "sr";
  if (nav.startsWith("en")) return "en";

  return "ru";
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface LocaleContextValue {
  locale:   Locale;
  messages: Messages;
  setLocale: (l: Locale) => void;
  locales:   Locale[];
  label:    (l: Locale) => string;
  flag:     (l: Locale) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  // Detect on mount (client-only)
  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    // Update <html lang> attribute
    document.documentElement.lang = l;
  }, []);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        messages: MESSAGES[locale],
        setLocale,
        locales: ["ru", "en", "sr"],
        label: (l) => LOCALE_LABELS[l],
        flag:  (l) => LOCALE_FLAGS[l],
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be inside LocaleProvider");
  return ctx;
}

/**
 * Returns a translation function t("nav.home") → "Главная" / "Home" / "Početna"
 * Supports {var} placeholders: t("profile.active_count", { n: 5 }) → "5 активных"
 */
export function useT() {
  const { messages } = useLocale();

  return useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const parts = key.split(".");
      let node: unknown = messages;
      for (const part of parts) {
        if (typeof node !== "object" || node === null) return key;
        node = (node as Record<string, unknown>)[part];
      }
      if (typeof node !== "string") return key;
      if (!vars) return node;
      return node.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
    },
    [messages]
  );
}
