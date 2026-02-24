// Svoi — Telegram BackButton hook
// Shows the native Telegram back button and wires it to a callback
"use client";

import { useEffect } from "react";
import { useTelegram } from "@/components/telegram/telegram-provider";

/**
 * Shows the Telegram BackButton while the component is mounted.
 * Falls back gracefully when running in browser (no-op).
 *
 * @param onBack - callback fired when user taps the back button
 */
export function useTelegramBack(onBack: () => void) {
  const { webApp } = useTelegram();

  useEffect(() => {
    if (!webApp?.BackButton) return;

    webApp.BackButton.show();
    webApp.BackButton.onClick(onBack);

    return () => {
      webApp.BackButton.offClick(onBack);
      webApp.BackButton.hide();
    };
  }, [webApp, onBack]);
}
