// Svoi — Wizard pill button: fixed above bottom nav, navigator-style
"use client";

import { Loader2, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardNextButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Use "green" for the final publish action */
  variant?: "primary" | "green";
}

export function WizardNextButton({
  label,
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
}: WizardNextButtonProps) {
  const isGreen = variant === "green";

  return (
    /* Overlay container — full width, pointer-events passthrough except button */
    <div className="fixed bottom-[108px] left-0 right-0 z-40 flex justify-center px-8 pointer-events-none">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "pointer-events-auto",
          // pill shape
          "flex items-center justify-center gap-2.5 rounded-full",
          // sizing — navigator style: wide but not full-width
          "w-full max-w-[280px] py-4 px-6",
          // typography
          "text-[15px] font-semibold text-white tracking-wide",
          // elevation
          "shadow-2xl",
          // transitions
          "transition-all duration-200 active:scale-[0.96]",
          // disabled
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          // color
          isGreen
            ? "bg-green-500 shadow-green-500/40"
            : "bg-primary shadow-primary/40"
        )}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin shrink-0" />
        ) : isGreen ? (
          <Check size={16} className="shrink-0" />
        ) : null}

        <span>{label}</span>

        {!loading && !isGreen && (
          <ArrowRight size={16} className="shrink-0 opacity-80" />
        )}
      </button>
    </div>
  );
}
