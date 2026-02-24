// Svoi — Zustand store: new listing wizard draft state
import { create } from "zustand";

export type WizardStep = 1 | 2 | 3 | 4;

export interface DraftImage {
  // localUrl: shown in preview before upload
  localUrl: string;
  // storedUrl: set after successful Supabase Storage upload
  storedUrl?: string;
  file?: File;
}

export interface NewListingDraft {
  // Step 1
  categoryId: number | null;
  categoryName: string;
  categoryEmoji: string;
  // Step 2
  images: DraftImage[];
  // Step 3
  title: string;
  description: string;
  price: string;         // string for input, parsed to number on submit
  currency: "EUR" | "RSD" | "USD";
  eventDate: string;     // ISO string, only for meetups category
  // Step 4
  address: string;
  lat: number | null;
  lng: number | null;
}

interface NewListingStore {
  step: WizardStep;
  draft: NewListingDraft;
  isSubmitting: boolean;

  setStep:        (step: WizardStep) => void;
  nextStep:       () => void;
  prevStep:       () => void;
  updateDraft:    (patch: Partial<NewListingDraft>) => void;
  addImage:       (img: DraftImage) => void;
  removeImage:    (localUrl: string) => void;
  updateImageUrl: (localUrl: string, storedUrl: string) => void;
  setSubmitting:  (v: boolean) => void;
  reset:          () => void;
}

const INITIAL_DRAFT: NewListingDraft = {
  categoryId:    null,
  categoryName:  "",
  categoryEmoji: "",
  images:        [],
  title:         "",
  description:   "",
  price:         "",
  currency:      "EUR",
  eventDate:     "",
  address:       "",
  lat:           null,
  lng:           null,
};

export const useNewListingStore = create<NewListingStore>((set) => ({
  step:         1,
  draft:        { ...INITIAL_DRAFT },
  isSubmitting: false,

  setStep: (step) => set({ step }),
  nextStep: () =>
    set((s) => ({ step: Math.min(s.step + 1, 4) as WizardStep })),
  prevStep: () =>
    set((s) => ({ step: Math.max(s.step - 1, 1) as WizardStep })),

  updateDraft: (patch) =>
    set((s) => ({ draft: { ...s.draft, ...patch } })),

  addImage: (img) =>
    set((s) => ({
      draft: {
        ...s.draft,
        images: s.draft.images.length < 5
          ? [...s.draft.images, img]
          : s.draft.images,
      },
    })),

  removeImage: (localUrl) =>
    set((s) => ({
      draft: {
        ...s.draft,
        images: s.draft.images.filter((i) => i.localUrl !== localUrl),
      },
    })),

  updateImageUrl: (localUrl, storedUrl) =>
    set((s) => ({
      draft: {
        ...s.draft,
        images: s.draft.images.map((i) =>
          i.localUrl === localUrl ? { ...i, storedUrl } : i
        ),
      },
    })),

  setSubmitting: (v) => set({ isSubmitting: v }),

  reset: () => set({ step: 1, draft: { ...INITIAL_DRAFT }, isSubmitting: false }),
}));
