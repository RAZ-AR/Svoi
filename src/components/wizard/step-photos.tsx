// Svoi — Wizard Step 2: upload photos (up to 5)
"use client";

import { useState } from "react";
import { Plus, X, ImageIcon, Loader2 } from "lucide-react";
import { useNewListingStore } from "@/store/new-listing.store";
import { getImageUploadUrl } from "@/actions/create-listing";
import { WizardNextButton } from "@/components/wizard/wizard-next-button";

interface StepPhotosProps {
  onNext: () => void;
}

export function StepPhotos({ onNext }: StepPhotosProps) {
  const { draft, addImage, removeImage, updateImageUrl } = useNewListingStore();
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const [skipPhotos, setSkipPhotos] = useState(false);

  const canAddMore = draft.images.length < 5;
  const isUploading = uploading.size > 0;
  const allUploaded = draft.images.length > 0 && draft.images.every((i) => i.storedUrl);
  const canProceed = !isUploading && (allUploaded || skipPhotos);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    // Reset skip when user actually adds photos
    setSkipPhotos(false);
    const allowed = Array.from(files).slice(0, 5 - draft.images.length);

    for (const file of allowed) {
      if (!file.type.startsWith("image/")) continue;

      const localUrl = URL.createObjectURL(file);
      addImage({ localUrl, file });
      setUploading((s) => new Set(s).add(localUrl));

      try {
        const result = await getImageUploadUrl(file.type);
        if (result.ok) {
          const res = await fetch(result.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          if (res.ok) {
            updateImageUrl(localUrl, result.publicUrl);
          } else {
            removeImage(localUrl);
          }
        } else {
          removeImage(localUrl);
        }
      } catch {
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
        <h2 className="text-xl font-bold text-gray-900">
          Фотографии <span className="text-red-400">*</span>
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          До 5 фото · Первое будет обложкой
        </p>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
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

            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
                Обложка
              </span>
            )}

            {uploading.has(img.localUrl) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 size={24} className="animate-spin text-white" />
              </div>
            )}

            <button
              type="button"
              onClick={() => removeImage(img.localUrl)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 transition-colors active:bg-black/70"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}

        {/* Add button — <label> directly triggers file picker without programmatic .click()
            This is the correct way in Telegram iOS where inputRef.click() is blocked */}
        {canAddMore && (
          <label
            htmlFor="photo-upload"
            className="
              flex aspect-square cursor-pointer flex-col items-center justify-center gap-2
              rounded-2xl border-2 border-dashed border-gray-200
              bg-gray-50 transition-colors active:bg-gray-100
            "
          >
            <Plus size={24} className="text-gray-400" />
            <span className="text-xs text-gray-400">
              {draft.images.length === 0 ? "Добавить" : `${draft.images.length}/5`}
            </span>
          </label>
        )}
      </div>

      {/* Hint — only when no photos and not skipped */}
      {draft.images.length === 0 && !skipPhotos && (
        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4">
          <ImageIcon size={20} className="shrink-0 text-blue-400" />
          <p className="text-sm text-blue-700">
            Объявления с фото получают в 3 раза больше откликов
          </p>
        </div>
      )}

      {/* "Без фото" — required choice when no photos added */}
      {draft.images.length === 0 && (
        <button
          type="button"
          onClick={() => setSkipPhotos((v) => !v)}
          className={`
            flex items-center gap-3 rounded-2xl border p-4 text-left transition-all
            ${skipPhotos ? "border-primary bg-primary/5" : "border-gray-200 bg-white"}
          `}
        >
          <span className={`
            flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all
            ${skipPhotos ? "border-primary bg-primary" : "border-gray-300 bg-white"}
          `}>
            {skipPhotos && <span className="h-2 w-2 rounded-full bg-white" />}
          </span>
          <span className={`text-sm font-medium ${skipPhotos ? "text-primary" : "text-gray-500"}`}>
            Продолжить без фото
          </span>
        </button>
      )}

      {/* Hidden file input — triggered via <label htmlFor="photo-upload"> above */}
      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Pill navigation button */}
      <WizardNextButton
        label={isUploading ? "Загрузка..." : "Далее"}
        onClick={onNext}
        disabled={!canProceed}
        loading={isUploading}
      />
    </div>
  );
}
