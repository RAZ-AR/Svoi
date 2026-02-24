// Svoi — Profile page
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, LayoutList, LogOut,
  Settings, Star, MessageCircle, Globe,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/components/auth/auth-provider";
import { useMyStats } from "@/hooks/use-my-listings";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/user.store";
import { cn } from "@/lib/utils";
import { useLocale, useT, type Locale } from "@/lib/i18n";

export default function ProfilePage() {
  const auth    = useAuth();
  const router  = useRouter();
  const { data: stats } = useMyStats();
  const t = useT();
  const { locale, setLocale, locales, label, flag } = useLocale();

  if (auth.status !== "authenticated") return null;
  const user = auth.user;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    useUserStore.getState().clearUser();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F0EB]">
      <AppHeader title={t("profile.title")} showLogo={false} />

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div className="mx-4 mt-2 overflow-hidden rounded-3xl bg-white">
        <div className="flex items-center gap-4 p-5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#EDE8E2]">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.first_name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#A89070]">
                {user.first_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-[#1A1A1A]">
              {user.first_name} {user.last_name}
            </p>
            {user.telegram_username && (
              <p className="text-sm text-[#A89070]">@{user.telegram_username}</p>
            )}
            {user.location && (
              <p className="mt-0.5 text-xs text-[#A89070]">📍 {user.location}</p>
            )}
          </div>

          <Link
            href="/profile/edit"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F0EB] transition-colors active:bg-[#EDE8E2]"
          >
            <Settings size={18} className="text-[#6B5E50]" />
          </Link>
        </div>

        <div className="flex divide-x divide-[#EDE8E2] border-t border-[#EDE8E2]">
          <StatCell label={t("profile.listings")} value={stats?.listingsCount ?? 0} />
          <StatCell label={t("profile.active")}   value={stats?.activeCount   ?? 0} />
          <StatCell label={t("profile.views")}    value={formatViews(stats?.totalViews ?? 0)} />
        </div>
      </div>

      {/* ── Menu ──────────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <MenuRow
          icon={<LayoutList size={18} />}
          label={t("profile.my_listings")}
          hint={stats?.activeCount ? t("profile.active_count", { n: stats.activeCount }) : undefined}
          href="/listings/my"
          iconBg="bg-[#EDE8E2] text-[#1A1A1A]"
        />
        <div className="h-px bg-[#F5F0EB]" />
        <MenuRow
          icon={<MessageCircle size={18} />}
          label={t("profile.my_chats")}
          href="/chats"
          iconBg="bg-[#EDE8E2] text-[#1A1A1A]"
        />
        <div className="h-px bg-[#F5F0EB]" />
        <MenuRow
          icon={<Star size={18} />}
          label={t("profile.favorites")}
          href="/favorites"
          iconBg="bg-[#EDE8E2] text-[#8A7255]"
        />
      </div>

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <MenuRow
          icon={<Settings size={18} />}
          label={t("profile.edit_profile")}
          href="/profile/edit"
          iconBg="bg-[#EDE8E2] text-[#6B5E50]"
        />
      </div>

      {/* ── Language switcher ─────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDE8E2] text-[#6B5E50]">
            <Globe size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{t("profile.language_title")}</p>
          </div>
          <div className="flex gap-1.5">
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l as Locale)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95",
                  locale === l
                    ? "bg-[#1A1A1A] text-white shadow-sm"
                    : "bg-[#EDE8E2] text-[#6B5E50]"
                )}
              >
                {flag(l as Locale)} {label(l as Locale)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Logout ────────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-4 transition-colors active:bg-[#F5F0EB]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
            <LogOut size={18} />
          </span>
          <span className="text-sm font-medium text-red-500">{t("profile.logout")}</span>
        </button>
      </div>

      <p className="py-8 text-center text-xs text-gray-300">
        {t("profile.version")}
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-1 flex-col items-center py-3.5">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function MenuRow({
  icon, label, hint, href, iconBg,
}: {
  icon:    React.ReactNode;
  label:   string;
  hint?:   string;
  href:    string;
  iconBg:  string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 transition-colors active:bg-[#F5F0EB]"
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", iconBg)}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </Link>
  );
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
