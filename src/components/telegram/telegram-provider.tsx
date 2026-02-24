// Svoi — Telegram Mini App provider
// Initializes WebApp, syncs theme, exposes useTelegram() hook
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { WebApp } from "@twa-dev/types";

interface TelegramContextValue {
  webApp: WebApp | null;
  /** True when running inside Telegram (not browser/PWA) */
  isTelegram: boolean;
  /** Telegram user from initData (not verified yet — server does that) */
  telegramUser: WebApp["initDataUnsafe"]["user"] | null;
  /** Raw initData string for server-side HMAC verification */
  initData: string;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  isTelegram: false,
  telegramUser: null,
  initData: "",
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<WebApp | null>(null);

  useEffect(() => {
    // window.Telegram is injected by the SDK script in layout.tsx
    const tg = (window as any).Telegram?.WebApp as WebApp | undefined;
    if (!tg) return;

    // Tell Telegram the app is ready — hides the loading screen
    tg.ready();

    // Expand to full height on mobile
    tg.expand();

    // Sync Telegram theme variables to CSS custom properties
    // so our UI automatically adapts when user is in dark mode in Telegram
    syncTelegramTheme(tg);

    setWebApp(tg);

    // Re-sync if user changes Telegram theme mid-session
    tg.onEvent("themeChanged", () => syncTelegramTheme(tg));

    return () => {
      tg.offEvent("themeChanged", () => syncTelegramTheme(tg));
    };
  }, []);

  const value: TelegramContextValue = {
    webApp,
    isTelegram: !!webApp,
    telegramUser: webApp?.initDataUnsafe?.user ?? null,
    initData: webApp?.initData ?? "",
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function syncTelegramTheme(tg: WebApp) {
  const p = tg.themeParams;
  if (!p) return;

  // Map Telegram theme tokens → our CSS variables
  // This allows the app to look native inside Telegram dark theme
  const root = document.documentElement.style;
  if (p.bg_color)           root.setProperty("--tg-bg-color",           p.bg_color);
  if (p.text_color)         root.setProperty("--tg-text-color",         p.text_color);
  if (p.hint_color)         root.setProperty("--tg-hint-color",         p.hint_color);
  if (p.link_color)         root.setProperty("--tg-link-color",         p.link_color);
  if (p.button_color)       root.setProperty("--tg-button-color",       p.button_color);
  if (p.button_text_color)  root.setProperty("--tg-button-text-color",  p.button_text_color);

  // Sync --tg-viewport-height for correct full-screen behavior
  const vh = tg.viewportStableHeight ?? tg.viewportHeight;
  if (vh) root.setProperty("--tg-viewport-height", `${vh}px`);
}
