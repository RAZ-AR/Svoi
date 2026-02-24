// Svoi — Bottom navigation bar (5 tabs, fixed at bottom)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useMyChats } from "@/hooks/use-chat";
import { useT } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const { webApp } = useTelegram();
  const { data: chats } = useMyChats();
  const totalUnread = chats?.reduce((s, c) => s + c.unread_count, 0) ?? 0;
  const t = useT();

  const tabs = [
    { href: "/home",         icon: Home,          label: t("nav.home")    },
    { href: "/search",       icon: Search,        label: t("nav.search")  },
    { href: "/listings/new", icon: Plus,          label: null             },
    { href: "/chats",        icon: MessageCircle, label: t("nav.chats")   },
    { href: "/profile",      icon: User,          label: t("nav.profile") },
  ];

  function handleNewListing() {
    // Haptic feedback when tapping the + button
    webApp?.HapticFeedback?.impactOccurred("medium");
  }

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        border-t border-gray-100 bg-white/95 backdrop-blur-md
        pb-safe-bottom
      "
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href) && tab.href !== "/listings/new";
          const Icon = tab.icon;

          // Center "+ New" button — always prominent
          if (!tab.label) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={handleNewListing}
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-2xl bg-primary shadow-lg shadow-primary/30
                  transition-transform active:scale-90
                "
              >
                <Plus size={22} className="text-white" strokeWidth={2.5} />
              </Link>
            );
          }

          const showBadge = tab.href === "/chats" && totalUnread > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 py-2"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-gray-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
