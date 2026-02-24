// Svoi — App entry point: handles auth redirect logic
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useTelegram } from "@/components/telegram/telegram-provider";

export default function RootPage() {
  const auth = useAuth();
  const { isTelegram } = useTelegram();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "loading") return;

    if (auth.status === "authenticated") {
      if (!auth.user.completed_profile || auth.isNewUser) {
        // First-time user → complete profile screen
        router.replace("/onboarding");
      } else {
        // Returning user → straight to home feed
        router.replace("/home");
      }
      return;
    }

    if (auth.status === "unauthenticated") {
      // PWA/web fallback — show login options
      router.replace("/login");
    }
  }, [auth, isTelegram, router]);

  // Minimal loading state — Telegram hides this with its own splash
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-2xl font-semibold tracking-tight text-gray-900">Svoi</p>
        <p className="mt-1 text-sm text-gray-400">Свой базар</p>
      </div>
    </div>
  );
}
