// Svoi — Global error boundary
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">⚡</p>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Что-то пошло не так</h1>
      <p className="mt-2 text-sm text-gray-500">
        Попробуйте перезагрузить страницу
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-3 rounded-xl bg-gray-100 px-4 py-2 font-mono text-xs text-red-600">
          {error.message}
        </p>
      )}
      <Button className="mt-8 rounded-2xl" onClick={reset}>
        Попробовать снова
      </Button>
    </div>
  );
}
