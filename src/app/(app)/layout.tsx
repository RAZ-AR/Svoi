// Svoi — Authenticated app shell: auth guard + bottom navigation
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuth } from "@/components/auth/auth-provider";

// Pages that use the full viewport and hide the bottom nav
const FULLSCREEN_ROUTES = ["/map"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  // Auth guard: redirect to root if not authenticated
  // In development, skip auth guard so listings can be previewed without login
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!isDev && (auth.status === "unauthenticated" || auth.status === "error")) {
      router.replace("/");
    }
  }, [auth.status, router, isDev]);

  if (!isDev && (auth.status === "loading" || auth.status !== "authenticated")) {
    return null;
  }

  if (isFullscreen) {
    // Map and other fullscreen pages: no padding, no nav
    return <div className="tg-viewport">{children}</div>;
  }

  return (
    <div className="tg-viewport flex flex-col bg-[#F5F0EB]">
      {/* Scrollable content — pb-28 leaves room for the floating nav pill */}
      <main className="flex-1 overflow-y-auto pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
