// Svoi — Zustand store: current user state
import { create } from "zustand";
import type { SvoiUser } from "@/lib/supabase/database.types";

interface UserStore {
  user: SvoiUser | null;
  setUser: (user: SvoiUser | null) => void;
  updateUser: (partial: Partial<SvoiUser>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  clearUser: () => set({ user: null }),
}));
