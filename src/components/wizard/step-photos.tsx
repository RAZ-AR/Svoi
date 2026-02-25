// Svoi — Wizard Step 2: upload photos (up to 5)
"use client";

import { useRef, useState } from "react";
import { Plus, X, ImageIcon, Loader2 } from "lucide-react";
import { useNewListingStore } from "@/store/new-listing.store";
import { useTelegramMainButton } from "@/hooks/use-telegram-main-button";
import { getImageUploadUrl } from "@/actions/create-listing";
import { WizardNextButton } from "@/components/wizard/wizard-next-button";

interface StepPhotosProps {
  onNext: () => void;
}

export function StepPhotos({ onNext }: StepPhotosProps) {
  const { draft, addImage, removeImage, updateImageUrl } = useNewListingStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<Set<string>>(new Set());

  const canAddMore = draft.images.length < 5;
  const allUploaded = draft.images.length === 0 || draft.images.every((i) => i.storedUrl);

  // Telegram MainButton: can proceed even without photos (optional)
  useTelegramMainButton({
    text:     draft.images.length === 0 ? "Пропустить →" : "Далее →",
    onClick:  onNext,
    isActive: allUploaded || draft.images.length === 0,
    isLoading: uploading.size > 0,
  });

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const allowed = Array.from(files).slice(0, 5 - draft.images.length);

    for (const file of allowed) {
      if (!file.type.startsWith("image/")) continue;

      // Immediate local preview
      const localUrl = URL.createObjectURL(file);
      addImage({ localUrl, file });
      setUploading((s) => new Set(s).add(localUrl));

      try {
        const result = await getImageUploadUrl(file.type);
        if (result.ok) {
          // PUT directly to Supabase signed URL
          const res = await fetch(result.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          if (res.ok) {
            updateImageUrl(localUrl, result.publicUrl);
          } else {
            // Upload failed — remove broken image from draft
            removeImage(localUrl);
          }
        } else {
          removeImage(localUrl);
        }
      } catch {
        // Network error — remove broken image from draft
        removeImage(localUrl);
      } finally {
        setUploading((s) => {
          const next = new Set(s);
          next.delete(localUrl);
          return next;
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Фотографии</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          До 5 фото · Первое будет обложкой
        </p>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Existing images */}
        {draft.images.map((img, i) => (
          <div
            key={img.localUrl}
            className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.localUrl}
              alt={`Фото ${i + 1}`}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Cover badge on first photo */}
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
                Обложка
              </span>
            )}

            {/* Upload spinner */}
            {uploading.has(img.localUrl) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 size={24} className="animate-spin text-white" />
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeImage(img.localUrl)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 transition-colors active:bg-black/70"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="
              flex aspect-square flex-col items-center justify-center gap-2
              rounded-2xl border-2 border-dashed border-gray-200
              bg-gray-50 transition-colors active:bg-gray-100
            "
          >
            <Plus size={24} className="text-gray-400" />
            <span className="text-xs text-gray-400">
              {draft.images.length === 0 ? "Добавить" : `${draft.images.length}/5`}
            </span>
          </button>
        )}
      </div>

      {/* Hint */}
      {draft.images.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4">
          <ImageIcon size={20} className="shrink-0 text-blue-400" />
          <p className="text-sm text-blue-700">
            Объявления с фото получают в 3 раза больше откликов
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Pill navigation button — fixed above bottom nav */}
      <WizardNextButton
        label={
          uploading.size > 0
            ? "Загрузка..."
            : draft.images.length === 0
            ? "Пропустить"
            : "Далее"
        }
        onClick={onNext}
        disabled={uploading.size > 0}
        loading={uploading.size > 0}
      />
    </div>
  );
}
