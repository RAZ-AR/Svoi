// Svoi — Authentication server actions
// Called from client after Telegram Mini App opens
"use server";

import { verifyTelegramInitData } from "@/lib/telegram/verify-init-data";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

    // ── Step 3: Ensure auth.users entry exists (service role — admin only) ──────
    const fakeEmail    = `tg_${tgUser.id}@svoi.telegram.internal`;
    const fakePassword = derivePassword(tgUser.id, botToken);

    // Check if auth user already exists by trying to sign in
    const checkSignIn = await serviceClient.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    });

    if (checkSignIn.error?.message.includes("Invalid login credentials")) {
      // First time: create auth.users entry via admin API
      const signUp = await serviceClient.auth.admin.createUser({
        email:         fakeEmail,
        password:      fakePassword,
        email_confirm: true,
        user_metadata: {
          svoi_user_id: svoiUser.id,
          telegram_id:  tgUser.id,
          first_name:   tgUser.first_name,
        },
      });
      if (signUp.error) throw signUp.error;
    }

    // ── Step 4: Sign in via regular client so @supabase/ssr sets cookies ──────
    // createClient() uses setAll() callback — writes sb-{ref}-auth-token cookie
    // that subsequent server actions (createListing etc.) can read correctly.
    const anonClient = await createClient();
    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email:    fakeEmail,
      password: fakePassword,
    });

    if (signInError) throw signInError;

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
