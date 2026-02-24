// Svoi — Onboarding: "Дополни профиль" screen shown after first Telegram login
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, Phone, Mail } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { updateProfile } from "@/actions/user";
import { Button } from "@/components/ui/button";

// Belgrade districts for quick pick
const BELGRADE_DISTRICTS = [
  "Нови Београд",
  "Земун",
  "Вождовац",
  "Врачар",
  "Звездара",
  "Палилула",
  "Чукарица",
  "Савски венац",
  "Стари град",
  "Барајево",
];

export default function OnboardingPage() {
  const auth = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const firstName =
    auth.status === "authenticated" ? auth.user.first_name : "";

  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");

  function handleSkip() {
    router.replace("/home");
  }

  function handleSubmit() {
    if (auth.status !== "authenticated") return;

    startTransition(async () => {
      await updateProfile(auth.user.id, {
        phone:             phone.trim() || undefined,
        location:          location.trim() || undefined,
        email:             email.trim() || undefined,
        completed_profile: true,
      });
      router.replace("/home");
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-5 pb-8 pt-12">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Добро пожаловать!</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          Привет, {firstName} 👋
        </h1>
        <p className="mt-2 text-gray-500">
          Расскажи немного о себе — это поможет другим быстрее с тобой связаться.
          Всё опционально.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Phone */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Phone size={14} className="text-gray-400" />
            Телефон
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+381 60 000 00 00"
            className="
              w-full rounded-2xl border border-gray-200 bg-gray-50
              px-4 py-3.5 text-base text-gray-900
              placeholder:text-gray-400
              focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
            "
          />
        </div>

        {/* Location */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <MapPin size={14} className="text-gray-400" />
            Район
          </label>
          {/* Quick district picker */}
          <div className="mb-2 flex flex-wrap gap-2">
            {BELGRADE_DISTRICTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setLocation(d)}
                className={`
                  rounded-full border px-3 py-1 text-xs font-medium transition-colors
                  ${
                    location === d
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }
                `}
              >
                {d}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Или напиши сам: «Нови Београд, Блок 45»"
            className="
              w-full rounded-2xl border border-gray-200 bg-gray-50
              px-4 py-3.5 text-base text-gray-900
              placeholder:text-gray-400
              focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
            "
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Mail size={14} className="text-gray-400" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="
              w-full rounded-2xl border border-gray-200 bg-gray-50
              px-4 py-3.5 text-base text-gray-900
              placeholder:text-gray-400
              focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20
            "
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          size="lg"
          className="w-full rounded-2xl"
        >
          {isPending ? "Сохраняем…" : "Готово"}
          <ChevronRight size={18} className="ml-1" />
        </Button>

        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-gray-400 underline-offset-2 hover:underline"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}
