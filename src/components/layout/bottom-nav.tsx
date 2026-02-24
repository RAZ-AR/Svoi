// Svoi — Bottom navigation: dark floating pill (warm minimal style)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useMyChats } from "@/hooks/use-chat";

export function BottomNav() {
  const pathname = usePathname();
  const { webApp } = useTelegram();
  const { data: chats } = useMyChats();
  const totalUnread = chats?.reduce((s, c) => s + c.unread_count, 0) ?? 0;

  const tabs = [
    { href: "/home",         icon: Home,          isCenter: false },
    { href: "/search",       icon: Search,        isCenter: false },
    { href: "/listings/new", icon: Plus,          isCenter: true  },
    { href: "/chats",        icon: MessageCircle, isCenter: false },
    { href: "/profile",      icon: User,          isCenter: false },
  ];

  function handleNewListing() {
    webApp?.HapticFeedback?.impactOccurred("medium");
  }

  return (
    /* Floating dark pill — centered, above safe area */
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 pb-safe-bottom">
      <div className="flex items-center gap-1 rounded-full bg-[#1A1A1A] px-4 py-3 shadow-2xl shadow-black/30">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href) && tab.href !== "/listings/new";
          const Icon = tab.icon;
          const showBadge = tab.href === "/chats" && totalUnread > 0;

          /* ── Centre "+" button ── */
          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={handleNewListing}
                className="
                  mx-1 flex h-11 w-11 items-center justify-center
                  rounded-full bg-white/10 border border-white/20
                  transition-transform active:scale-90
                "
              >
                <Plus size={20} className="text-white" strokeWidth={2.5} />
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative mx-0.5 flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90"
            >
              {/* Active: sand/gold circle background */}
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-[#C9B99A]" />
              )}

              <Icon
                size={20}
                className={cn(
                  "relative z-10 transition-colors",
                  isActive ? "text-[#1A1A1A]" : "text-white/60"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />

              {/* Unread badge */}
              {showBadge && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white z-20">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
