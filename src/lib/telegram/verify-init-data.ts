// Svoi — Telegram InitData HMAC verification (server-side only)
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import { createHmac, createHash } from "crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ParsedInitData {
  user: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
  chat_type?: string;
}

/**
 * Verifies the HMAC signature of Telegram InitData and parses user info.
 * Throws an error if the signature is invalid or data is too old.
 *
 * @param initData - Raw initData string from WebApp.initData
 * @param botToken - Your bot token from @BotFather
 * @param maxAgeSeconds - Reject data older than this (default: 1 hour)
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 3600
): ParsedInitData {
  if (!initData) {
    throw new Error("initData is empty");
  }

  // 1. Parse into key-value pairs
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Missing hash in initData");

  // 2. Build the data-check-string (all fields except hash, sorted alphabetically)
  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // 3. HMAC-SHA256 with key = HMAC-SHA256("WebAppData", botToken)
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // 4. Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(expectedHash, hash)) {
    throw new Error("Invalid Telegram InitData signature");
  }

  // 5. Check freshness
  const authDate = parseInt(params.get("auth_date") ?? "0", 10);
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age > maxAgeSeconds) {
    throw new Error(`Telegram InitData is too old (${age}s > ${maxAgeSeconds}s)`);
  }

  // 6. Parse user JSON
  const userRaw = params.get("user");
  if (!userRaw) throw new Error("Missing user in initData");

  const user: TelegramUser = JSON.parse(userRaw);

  return {
    user,
    auth_date: authDate,
    hash,
    query_id: params.get("query_id") ?? undefined,
    chat_type: params.get("chat_type") ?? undefined,
  };
}

/** Constant-time string comparison to prevent timing attacks */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.equals(bufB) && // fast path
    // XOR comparison — doesn't short-circuit
    bufA.every((byte, i) => (byte ^ bufB[i]) === 0);
}
