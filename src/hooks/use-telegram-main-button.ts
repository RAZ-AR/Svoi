// Svoi — Telegram MainButton hook
// Controls the native Telegram bottom action button
"use client";

import { useEffect } from "react";
import { useTelegram } from "@/components/telegram/telegram-provider";

interface MainButtonOptions {
  text: string;
  onClick: () => void;
  isLoading?: boolean;
  isActive?: boolean;   // false = visually disabled
  color?: string;       // hex, e.g. "#3b6bff"
  textColor?: string;
}

/**
 * Shows and configures the Telegram MainButton while component is mounted.
 * Auto-hides on unmount. No-op in browser.
 */
export function useTelegramMainButton({
  text,
  onClick,
  isLoading = false,
  isActive = true,
  color,
  textColor,
}: MainButtonOptions) {
  const { webApp } = useTelegram();

  useEffect(() => {
    const btn = webApp?.MainButton;
    if (!btn) return;

    btn.setText(text);
    btn.onClick(onClick);

    if (color)     btn.setParams({ color });
    if (textColor) btn.setParams({ text_color: textColor });

    if (isLoading) {
      btn.showProgress(false);
    } else {
      btn.hideProgress();
    }

    if (isActive) {
      btn.enable();
    } else {
      btn.disable();
    }

    btn.show();

    return () => {
      btn.offClick(onClick);
      btn.hide();
    };
  }, [webApp, text, onClick, isLoading, isActive, color, textColor]);
}
