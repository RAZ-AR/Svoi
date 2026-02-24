// Svoi — Profile page
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, LayoutList, LogOut,
  Settings, Star, MessageCircle,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/components/auth/auth-provider";
import { useMyStats } from "@/hooks/use-my-listings";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/store/user.store";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const auth    = useAuth();
  const router  = useRouter();
  const { data: stats } = useMyStats();

  if (auth.status !== "authenticated") return null;
  const user = auth.user;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    useUserStore.getState().clearUser();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AppHeader title="Профиль" showLogo={false} />

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div className="mx-4 mt-2 overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="flex items-center gap-4 p-5">
          {/* Avatar */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.first_name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                {user.first_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + username */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </p>
            {user.telegram_username && (
              <p className="text-sm text-gray-400">@{user.telegram_username}</p>
            )}
            {user.location && (
              <p className="mt-0.5 text-xs text-gray-400">📍 {user.location}</p>
            )}
          </div>

          {/* Edit button */}
          <Link
            href="/profile/edit"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 transition-colors active:bg-gray-100"
          >
            <Settings size={18} className="text-gray-500" />
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex divide-x divide-gray-100 border-t border-gray-100">
          <StatCell label="Объявлений" value={stats?.listingsCount ?? 0} />
          <StatCell label="Активных"   value={stats?.activeCount   ?? 0} />
          <StatCell label="Просмотров" value={formatViews(stats?.totalViews ?? 0)} />
        </div>
      </div>

      {/* ── Menu ──────────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <MenuRow
          icon={<LayoutList size={18} />}
          label="Мои объявления"
          hint={stats?.activeCount ? `${stats.activeCount} активных` : undefined}
          href="/listings/my"
          iconBg="bg-blue-50 text-blue-500"
        />
        <div className="h-px bg-gray-50" />
        <MenuRow
          icon={<MessageCircle size={18} />}
          label="Мои чаты"
          href="/chats"
          iconBg="bg-green-50 text-green-500"
        />
        <div className="h-px bg-gray-50" />
        <MenuRow
          icon={<Star size={18} />}
          label="Избранное"
          href="/favorites"
          iconBg="bg-amber-50 text-amber-500"
        />
      </div>

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <MenuRow
          icon={<Settings size={18} />}
          label="Редактировать профиль"
          href="/profile/edit"
          iconBg="bg-gray-100 text-gray-500"
        />
      </div>

      {/* ── Logout ────────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-4 transition-colors active:bg-gray-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
            <LogOut size={18} />
          </span>
          <span className="text-sm font-medium text-red-500">Выйти</span>
        </button>
      </div>

      {/* App version */}
      <p className="py-8 text-center text-xs text-gray-300">
        Svoi v0.1.0 · Свой базар в Белграде
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
      className="flex items-center gap-3 px-4 py-4 transition-colors active:bg-gray-50"
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
