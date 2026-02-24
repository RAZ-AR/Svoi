// Svoi — Wizard success screen shown after listing is published
"use client";

import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { Button } from "@/components/ui/button";

interface WizardSuccessProps {
  listingId: string;
  title: string;
}

export function WizardSuccess({ listingId, title }: WizardSuccessProps) {
  const router = useRouter();
  const { webApp } = useTelegram();

  // Celebrate with haptic
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.notificationOccurred("success");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Animated checkmark */}
      <div className="animate-bounce-once mb-6">
        <CheckCircle size={72} className="text-green-500" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Объявление опубликовано!</h1>
      <p className="mt-2 max-w-xs text-sm text-gray-500">
        «{title}» уже видят все — удачных продаж!
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        {/* View listing */}
        <Button
          size="lg"
          className="w-full rounded-2xl"
          onClick={() => router.push(`/listings/${listingId}`)}
        >
          Смотреть объявление
        </Button>

        {/* Back to home */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full rounded-2xl"
          onClick={() => router.replace("/home")}
        >
          На главную
        </Button>
      </div>
    </div>
  );
}
