// Svoi — Auth provider: auto-login via Telegram InitData on app start
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { authenticateWithTelegram } from "@/actions/auth";
import type { SvoiUser } from "@/lib/supabase/database.types";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: SvoiUser; isNewUser: boolean }
  | { status: "unauthenticated" }
  | { status: "error"; error: string };

const AuthContext = createContext<AuthState>({ status: "loading" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isTelegram, initData } = useTelegram();
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    // Wait for Telegram SDK to populate initData
    if (!isTelegram) {
      // Running in browser/PWA without Telegram — show standard login
      setAuth({ status: "unauthenticated" });
      return;
    }

    if (!initData) return; // still waiting for Telegram SDK

    // Auto-login: send initData to server for verification
    authenticateWithTelegram(initData).then((result) => {
      if (!result.ok) {
        setAuth({ status: "error", error: result.error });
        return;
      }

      // We have basic user info from the auth action — store what we need
      // Full user data will be fetched by individual screens via useUser()
      setAuth({
        status: "authenticated",
        isNewUser: result.isNewUser,
        // Minimal user object — rest loaded by useUser hook
        user: {
          id: result.userId,
          first_name: result.firstName,
          completed_profile: result.completedProfile,
        } as SvoiUser,
      });
    });
  }, [isTelegram, initData]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Convenience: get current user or throw if not authenticated */
export function useRequireAuth(): SvoiUser & { isNewUser: boolean } {
  const auth = useContext(AuthContext);
  if (auth.status !== "authenticated") {
    throw new Error("useRequireAuth: not authenticated");
  }
  return { ...auth.user, isNewUser: auth.isNewUser };
}
