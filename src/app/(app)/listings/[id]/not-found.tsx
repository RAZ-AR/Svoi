// Svoi — Listing not found screen
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ListingNotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🏚️</p>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Объявление не найдено</h1>
      <p className="mt-2 text-sm text-gray-500">
        Возможно, его уже удалили или продали
      </p>
      <Button
        className="mt-8 rounded-2xl"
        onClick={() => router.replace("/home")}
      >
        На главную
      </Button>
    </div>
  );
}
