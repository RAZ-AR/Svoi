// Svoi — Global providers: QueryClient, Supabase, Telegram init
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LocaleProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient once (not on every render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,      // 1 min — fresh enough for a classifieds app
            gcTime:    10 * 60 * 1000, // 10 min cache
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <TelegramProvider>
          <AuthProvider>{children}</AuthProvider>
        </TelegramProvider>
      </LocaleProvider>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
