// Svoi — Authentication server actions
// Called from client after Telegram Mini App opens
"use server";

import { verifyTelegramInitData } from "@/lib/telegram/verify-init-data";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export type TelegramAuthResult =
  | {
      ok: true;
      userId: string;
      isNewUser: boolean;
      completedProfile: boolean;
      firstName: string;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Authenticate user via Telegram InitData.
 *
 * Flow:
 * 1. Verify HMAC signature server-side (initData never trusted from client)
 * 2. Upsert user in our users table
 * 3. Create a Supabase Auth session tied to this user
 * 4. Return user info so the client can redirect accordingly
 */
export async function authenticateWithTelegram(
  initData: string
): Promise<TelegramAuthResult> {
  try {
    // ── Step 1: Verify Telegram signature ─────────────────────────────────────
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not set");

    const parsed = verifyTelegramInitData(initData, botToken);
    const { user: tgUser } = parsed;

    // ── Step 2: Upsert user via secure postgres function ──────────────────────
    const serviceClient = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: svoiUser, error: upsertError } = await (serviceClient as any).rpc(
      "upsert_telegram_user",
      {
        p_telegram_id: tgUser.id,
        p_first_name:  tgUser.first_name,
        p_last_name:   tgUser.last_name ?? "",
        p_username:    tgUser.username,
        p_avatar_url:  tgUser.photo_url,
      }
    );

    if (upsertError) throw upsertError;
    if (!svoiUser)   throw new Error("upsert_telegram_user returned null");

    // ── Step 3: Create a Supabase Auth session ────────────────────────────────
    // We use a custom JWT approach: sign in anonymously, then attach svoi_user_id
    // to the JWT claims so our RLS helper public.svoi_uid() works.
    //
    // Strategy: use email OTP with a derived deterministic email, no actual email sent.
    const fakeEmail = `tg_${tgUser.id}@svoi.telegram.internal`;
    const fakePassword = derivePassword(tgUser.id, botToken);

    // Try sign-in first; if user doesn't exist in auth.users yet, sign up
    let sessionData = await serviceClient.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    });

    if (sessionData.error?.message.includes("Invalid login credentials")) {
      // First time: create auth user
      const signUp = await serviceClient.auth.admin.createUser({
        email: fakeEmail,
        password: fakePassword,
        email_confirm: true,  // skip confirmation
        user_metadata: {
          svoi_user_id:  svoiUser.id,
          telegram_id:   tgUser.id,
          first_name:    tgUser.first_name,
        },
      });
      if (signUp.error) throw signUp.error;

      // Now sign in
      sessionData = await serviceClient.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword,
      });
    }

    if (sessionData.error) throw sessionData.error;

    // ── Step 4: Set session cookie ─────────────────────────────────────────────
    const cookieStore = await cookies();
    const { access_token, refresh_token } = sessionData.data.session!;

    cookieStore.set("sb-access-token",  access_token,  { httpOnly: true, secure: true, sameSite: "none", path: "/" });
    cookieStore.set("sb-refresh-token", refresh_token, { httpOnly: true, secure: true, sameSite: "none", path: "/" });

    return {
      ok: true,
      userId:           svoiUser.id,
      isNewUser:        svoiUser.is_new_user,
      completedProfile: svoiUser.completed_profile,
      firstName:        svoiUser.first_name,
    };
  } catch (err) {
    console.error("[authenticateWithTelegram]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка авторизации",
    };
  }
}

/**
 * Derives a deterministic, stable password from telegram_id + bot_token.
 * Not stored anywhere — purely computed on demand.
 */
function derivePassword(telegramId: number, botToken: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256")
    .update(`svoi:${telegramId}:${botToken}`)
    .digest("hex");
}
