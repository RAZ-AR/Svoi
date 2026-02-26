// Svoi — Onboarding: fill profile after first Telegram login
"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, Cake, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { updateProfile } from "@/actions/user";
import { getImageUploadUrl } from "@/actions/create-listing";

const BELGRADE_DISTRICTS = [
  "Нови Београд", "Земун",        "Вождовац",    "Врачар",
  "Звездара",     "Палилула",     "Чукарица",    "Савски венац",
  "Стари град",   "Барајево",
];

export default function OnboardingPage() {
  const auth    = useAuth();
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading]    = useState(false);

  const tgFirst = auth.status === "authenticated" ? auth.user.first_name : "";
  const tgAvatar = auth.status === "authenticated" ? (auth.user.avatar_url ?? "") : "";

  const [name,      setName]      = useState(tgFirst);
  const [avatarUrl, setAvatarUrl] = useState(tgAvatar);
  const [location,  setLocation]  = useState("");
  const [birthday,  setBirthday]  = useState("");

  function handleSkip() {
    if (auth.status === "authenticated") {
      startTransition(async () => {
        await updateProfile(auth.user.id, { completed_profile: true });
        router.replace("/home");
      });
    } else {
      router.replace("/home");
    }
  }

  function handleSubmit() {
    if (auth.status !== "authenticated") return;

    startTransition(async () => {
      await updateProfile(auth.user.id, {
        first_name:        name.trim()     || undefined,
        avatar_url:        avatarUrl       || undefined,
        location:          location.trim() || undefined,
        birthday:          birthday        || undefined,
        completed_profile: true,
      });
      router.replace("/home");
    });
  }

  async function handleAvatarPick(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const result = await getImageUploadUrl(file.type);
      if (!result.ok) return;
      await fetch(result.uploadUrl, {
        method: "PUT", body: file,
        headers: { "Content-Type": file.type },
      });
      setAvatarUrl(result.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  const isBusy = isPending || uploading;

  return (
    <div className="flex min-h-screen flex-col bg-white px-5 pb-10 pt-12">

      {/* Greeting */}
      <div className="mb-8">
        <p className="text-sm font-medium text-[#45B8C0]">Добро пожаловать!</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          Привет, {tgFirst} 👋
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Расскажи немного о себе — всё опционально, можно заполнить позже.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-1 flex-col gap-6">

        {/* Avatar */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative h-24 w-24"
          >
            <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-100">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Аватар" fill sizes="96px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-300">
                  {(tgFirst[0] ?? "?").toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#45B8C0] shadow-md">
              {uploading
                ? <Loader2 size={14} className="animate-spin text-white" />
                : <Camera size={14} className="text-white" />
              }
            </div>
          </button>
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleAvatarPick(e.target.files)}
          />
        </div>

        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Имя</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как тебя зовут?"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
          />
        </div>

        {/* District */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <MapPin size={14} className="text-gray-400" />
            Район
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {BELGRADE_DISTRICTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setLocation(location === d ? "" : d)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  location === d
                    ? "border-[#45B8C0] bg-[#45B8C0] text-white"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
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
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
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
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isBusy}
          className="flex w-full items-center justify-center gap-1 rounded-2xl bg-[#1A1A1A] py-4 text-base font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-60"
        >
          {isPending ? "Сохраняем…" : "Готово"}
          <ChevronRight size={18} />
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isBusy}
          className="text-sm text-gray-400"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}
