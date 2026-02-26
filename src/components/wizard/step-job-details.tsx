// Svoi — Wizard Step 3 (Jobs): seeking / offering form
"use client";

import { useRef, useState } from "react";
import { Briefcase, Building2, Globe, FileText, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNewListingStore } from "@/store/new-listing.store";
import { WizardNextButton } from "@/components/wizard/wizard-next-button";
import { getResumeUploadUrl } from "@/actions/create-listing";

const SPHERES = [
  "IT", "Дизайн", "Маркетинг", "Строительство", "Медицина",
  "Образование", "Финансы", "Юриспруденция", "Торговля", "Транспорт",
  "Красота", "Спорт", "Другое",
];

const EXPERIENCE_OPTIONS = [
  { value: "no_exp",  label: "Без опыта" },
  { value: "1_3",     label: "1–3 года" },
  { value: "3_5",     label: "3–5 лет" },
  { value: "5_plus",  label: "5+ лет" },
];

interface StepJobDetailsProps {
  onNext: () => void;
}

export function StepJobDetails({ onNext }: StepJobDetailsProps) {
  const { draft, updateDraft } = useNewListingStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const isSeeking  = draft.jobType === "seeking";
  const isOffering = draft.jobType === "offering";

  // Validation
  const canProceed = (() => {
    if (!draft.jobType) return false;
    if (!draft.jobSphere) return false;
    if (isSeeking) return true; // name comes from profile
    if (isOffering) return draft.jobPosition.trim().length >= 2;
    return false;
  })();

  async function handleResumePick(files: FileList | null) {
    if (!files?.[0]) return;
    const file = files[0];
    if (file.type !== "application/pdf") return;

    setUploading(true);
    try {
      const result = await getResumeUploadUrl();
      if (!result.ok) return;
      await fetch(result.uploadUrl, {
        method: "PUT", body: file,
        headers: { "Content-Type": "application/pdf" },
      });
      updateDraft({ jobResumeUrl: result.publicUrl });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Работа</h2>
        <p className="mt-0.5 text-sm text-gray-500">💼 {draft.categoryName}</p>
      </div>

      {/* Type toggle: Ищу / Предлагаю */}
      <div className="flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
        {(["seeking", "offering"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => updateDraft({ jobType: type })}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
              draft.jobType === type
                ? "bg-[#1A1A1A] text-white shadow-sm"
                : "text-gray-500"
            )}
          >
            {type === "seeking" ? "🔍 Ищу работу" : "💼 Предлагаю"}
          </button>
        ))}
      </div>

      {draft.jobType && (
        <>
          {/* Sphere */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Briefcase size={14} className="text-gray-400" />
              Сфера <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPHERES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateDraft({ jobSphere: draft.jobSphere === s ? "" : s })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    draft.jobSphere === s
                      ? "border-[#45B8C0] bg-[#45B8C0] text-white"
                      : "border-gray-200 bg-white text-gray-600"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── SEEKING fields ── */}
          {isSeeking && (
            <>
              {/* Experience */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Опыт работы</label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateDraft({ jobExperience: draft.jobExperience === opt.value ? "" : opt.value })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        draft.jobExperience === opt.value
                          ? "border-[#45B8C0] bg-[#45B8C0] text-white"
                          : "border-gray-200 bg-white text-gray-600"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* About */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">О себе</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                  placeholder="Кратко о себе, навыках, пожеланиях…"
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
                />
              </div>

              {/* Desired salary */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Желаемая зарплата <span className="text-gray-400 text-xs">(опционально)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={draft.price}
                    onChange={(e) => updateDraft({ price: e.target.value })}
                    placeholder="0"
                    min={0}
                    className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
                  />
                  <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                    {(["EUR", "RSD"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateDraft({ currency: c })}
                        className={cn(
                          "px-4 py-3.5 text-sm font-medium transition-colors",
                          draft.currency === c ? "bg-[#1A1A1A] text-white" : "text-gray-600"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resume PDF */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Резюме (PDF) <span className="text-gray-400 text-xs">(опционально)</span>
                </label>
                {draft.jobResumeUrl ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                    <FileText size={18} className="shrink-0 text-green-600" />
                    <span className="flex-1 truncate text-sm text-green-800">Резюме прикреплено</span>
                    <button
                      type="button"
                      onClick={() => updateDraft({ jobResumeUrl: "" })}
                      className="text-xs text-gray-400"
                    >
                      Удалить
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 transition-colors active:bg-gray-50"
                  >
                    {uploading
                      ? <><Loader2 size={16} className="animate-spin" /> Загружаем…</>
                      : <><Upload size={16} /> Прикрепить PDF резюме</>
                    }
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleResumePick(e.target.files)}
                />
              </div>
            </>
          )}

          {/* ── OFFERING fields ── */}
          {isOffering && (
            <>
              {/* Position */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Позиция / должность <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={draft.jobPosition}
                  onChange={(e) => updateDraft({ jobPosition: e.target.value })}
                  placeholder="Frontend Developer, Менеджер, Повар…"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
                />
              </div>

              {/* Company */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Building2 size={14} className="text-gray-400" />
                  Компания <span className="text-gray-400 text-xs">(опционально)</span>
                </label>
                <input
                  type="text"
                  value={draft.jobCompany}
                  onChange={(e) => updateDraft({ jobCompany: e.target.value })}
                  placeholder="Название компании"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
                />
              </div>

              {/* Website */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Globe size={14} className="text-gray-400" />
                  Сайт <span className="text-gray-400 text-xs">(опционально)</span>
                </label>
                <input
                  type="url"
                  value={draft.jobWebsite}
                  onChange={(e) => updateDraft({ jobWebsite: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Требования и описание</label>
                <textarea
                  value={draft.jobRequirements}
                  onChange={(e) => updateDraft({ jobRequirements: e.target.value })}
                  placeholder="Что нужно уметь, условия работы, график…"
                  rows={5}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Зарплата <span className="text-gray-400 text-xs">(опционально)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={draft.price}
                    onChange={(e) => updateDraft({ price: e.target.value })}
                    placeholder="0"
                    min={0}
                    className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#45B8C0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45B8C0]/20"
                  />
                  <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                    {(["EUR", "RSD"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateDraft({ currency: c })}
                        className={cn(
                          "px-4 py-3.5 text-sm font-medium transition-colors",
                          draft.currency === c ? "bg-[#1A1A1A] text-white" : "text-gray-600"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <WizardNextButton label="Далее" onClick={onNext} disabled={!canProceed} />
    </div>
  );
}
