// Svoi — New listing wizard: 4-step flow
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTelegramBack } from "@/hooks/use-telegram-back";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useNewListingStore } from "@/store/new-listing.store";
import { useCategories } from "@/hooks/use-listings";
import { createListing } from "@/actions/create-listing";
import { WizardProgress } from "@/components/wizard/wizard-progress";
import { StepCategory } from "@/components/wizard/step-category";
import { StepPhotos } from "@/components/wizard/step-photos";
import { StepDetails } from "@/components/wizard/step-details";
import { StepLocation } from "@/components/wizard/step-location";
import { WizardSuccess } from "@/components/wizard/wizard-success";

export default function NewListingPage() {
  const router = useRouter();
  const { webApp } = useTelegram();
  const { step, draft, nextStep, prevStep, setSubmitting, isSubmitting, reset } =
    useNewListingStore();
  const { data: categories = [] } = useCategories();

  const [result, setResult] = useState<{ listingId: string; title: string } | null>(null);

  // ── Back navigation ───────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (step > 1) {
      prevStep();
    } else {
      router.back();
    }
  }, [step, prevStep, router]);

  useTelegramBack(handleBack);

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (isSubmitting) return;

    setSubmitting(true);
    webApp?.HapticFeedback?.impactOccurred("medium");

    const images = draft.images
      .filter((i) => i.storedUrl)
      .map((i) => ({ url: i.storedUrl! }));

    const res = await createListing({
      categoryId:  draft.categoryId!,
      title:       draft.title.trim(),
      description: draft.description.trim(),
      price:       draft.price ? parseFloat(draft.price) : null,
      currency:    draft.currency,
      address:     draft.address.trim(),
      lat:         draft.lat,
      lng:         draft.lng,
      images,
      eventDate:   draft.eventDate || null,
    });

    setSubmitting(false);

    if (res.ok) {
      webApp?.HapticFeedback?.notificationOccurred("success");
      reset();
      setResult({ listingId: res.listingId, title: draft.title });
    } else {
      webApp?.HapticFeedback?.notificationOccurred("error");
      alert(`Ошибка: ${res.error}`);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return <WizardSuccess listingId={result.listingId} title={result.title} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-gray-500 active:text-gray-700"
        >
          {step > 1 ? "← Назад" : "Отмена"}
        </button>
        <h1 className="text-base font-semibold text-gray-900">Новое объявление</h1>
        {/* Spacer */}
        <div className="w-14" />
      </div>

      {/* Step progress */}
      <WizardProgress current={step} />

      {/* Step content — animated slide */}
      <div className="flex-1 overflow-y-auto animate-fade-in">
        {step === 1 && (
          <StepCategory
            categories={categories}
            onNext={nextStep}
          />
        )}
        {step === 2 && (
          <StepPhotos onNext={nextStep} />
        )}
        {step === 3 && (
          <StepDetails onNext={nextStep} />
        )}
        {step === 4 && (
          <StepLocation
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
