// Svoi — Edit profile page
"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2, MapPin, Cake } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { useTelegramMainButton } from "@/hooks/use-telegram-main-button";
import { useAuth } from "@/components/auth/auth-provider";
import { updateProfile } from "@/actions/user";
import { getImageUploadUrl } from "@/actions/create-listing";
import { useUserStore } from "@/store/user.store";
import { cn } from "@/lib/utils";

const DISTRICTS = [
  "Нови Београд", "Земун",    "Вождовац", "Врачар",
  "Звездара",     "Палилула", "Чукарица", "Стари град",
];

export default function EditProfilePage() {
  const auth   = useAuth();
  const router = useRouter();

  useTelegramBack(useCallback(() => router.back(), [router]));

  if (auth.status !== "authenticated") return null;
  const user = auth.user;

  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName,  setLastName]  = useState(user.last_name  ?? "");
  const [location,  setLocation]  = useState(user.location   ?? "");
  const [birthday,  setBirthday]  = useState(user.birthday   ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const isSaving = isPending || uploading;
  const canSave  = firstName.trim().length > 0;

  function handleSave() {
    if (!canSave || isSaving) return;

    startTransition(async () => {
      const result = await updateProfile(user.id, {
        first_name:        firstName.trim(),
        last_name:         lastName.trim() || undefined,
        location:          location.trim() || undefined,
        birthday:          birthday        || undefined,
        avatar_url:        avatarUrl       || undefined,
        completed_profile: true,
      });

      if (result.ok) {
        useUserStore.getState().updateUser({
          first_name: firstName,
          last_name:  lastName,
          avatar_url: avatarUrl,
        });
        router.back();
      }
    });
  }

  useTelegramMainButton({
    text:      isSaving ? "Сохраняем…" : "Сохранить",
    onClick:   handleSave,
    isActive:  canSave && !isSaving,
    isLoading: isSaving,
  });

  async function handleAvatarPick(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const result = await getImageUploadUrl(file.type);
      if (!result.ok) throw new Error(result.error);

      await fetch(result.uploadUrl, {
        method: "PUT", body: file,
        headers: { "Content-Type": file.type },
      });
      setAvatarUrl(result.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader title="Редактировать профиль" showLogo={false} />

      <div className="flex flex-col gap-6 px-4 pb-8 pt-4">

        {/* Avatar picker */}
        <div className="flex justify-center">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative h-24 w-24">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-100">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Аватар" fill sizes="96px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-300">
                  {firstName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#03B2FF] shadow-md">
              {uploading
                ? <Loader2 size={14} className="animate-spin text-white" />
                : <Camera size={14} className="text-white" />
              }
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleAvatarPick(e.target.files)} />
        </div>

        {/* Name row */}
        <div className="flex gap-3">
          <Field label="Имя" value={firstName} onChange={setFirstName} placeholder="Иван" required />
          <Field label="Фамилия" value={lastName} onChange={setLastName} placeholder="Иванов" />
        </div>

        {/* District */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <MapPin size={14} className="text-gray-400" />
            Район
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {DISTRICTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setLocation(location === d ? "" : d)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  location === d
                    ? "border-[#03B2FF] bg-[#03B2FF] text-white"
                    : "border-gray-200 text-gray-600"
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Или напиши: «Нови Београд, Блок 45»"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#03B2FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#03B2FF]/20"
          />
        </div>

        {/* Birthday */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Cake size={14} className="text-gray-400" />
            День рождения
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 focus:border-[#03B2FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#03B2FF]/20"
          />
        </div>

        {/* Save button fallback */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className="w-full rounded-2xl bg-[#1A1A1A] py-4 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {isSaving ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex-1">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#03B2FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#03B2FF]/20"
      />
    </div>
  );
}
