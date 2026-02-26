// Svoi — Login page: Telegram-only entry point
"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTelegram } from "@/components/telegram/telegram-provider";

const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME ?? "svoi_belgrade_bot";

export default function LoginPage() {
  const { isTelegram, initData } = useTelegram();
  const router = useRouter();

  // If opened inside Telegram, go back to root to auto-auth
  useEffect(() => {
    if (isTelegram && initData) {
      router.replace("/");
    }
  }, [isTelegram, initData, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EBEBEB] px-6">

      {/* Logo */}
      <div className="mb-10 text-center flex flex-col items-center">
        <Image src="/svoi.svg" alt="Svoi" width={140} height={48} priority />
        <p className="mt-3 text-gray-400">Свой базар в Белграде</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="rounded-3xl bg-gray-50 px-6 py-8 text-center">
          <div className="mb-4 text-5xl">✈️</div>
          <p className="mb-2 text-lg font-semibold text-gray-900">
            Открой через Telegram
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Svoi — мини-приложение внутри Telegram.
            Открой бот и нажми «Запустить».
          </p>
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#2AABEE] px-6 py-4 text-sm font-semibold text-white transition-all active:scale-[0.97]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
            </svg>
            Открыть @{BOT_USERNAME}
          </a>
        </div>

        {process.env.NODE_ENV === "development" && (
          <Link
            href="/home"
            className="mt-4 block text-center text-xs text-gray-400 underline underline-offset-2"
          >
            🛠 Dev: открыть без входа
          </Link>
        )}
      </div>
    </div>
  );
}
