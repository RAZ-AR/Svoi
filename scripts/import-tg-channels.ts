// Svoi — Telegram channel importer (idempotent)
// Reads message history from configured public channels and creates listings.
// Safe to run multiple times — duplicates are skipped via unique index.
//
// Prerequisites:
//   - Run scripts/tg-session.ts ONCE to generate TELEGRAM_SESSION
//   - .env.local must have:
//       TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION
//       NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Usage:
//   npx tsx scripts/import-tg-channels.ts
//   npx tsx scripts/import-tg-channels.ts --limit=50  (messages per channel)

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { createClient } from "@supabase/supabase-js";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_ID   = Number(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH ?? "";
const SESSION  = process.env.TELEGRAM_SESSION  ?? "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://svoi-lac.vercel.app";

// Channels to import from (add/remove as needed)
const CHANNELS = [
  "belgrad_serbia",
  "avito_serbia",
  "Beograd_oglasi",
  "vizitkars",
];

// How many messages to read per channel (adjust via --limit=N flag)
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const MESSAGES_LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 200;

// Sentinel Telegram ID for the "import" user (different from seed user 999999999)
const IMPORT_USER_TG_ID = 888888888;

// ─── Category detection ───────────────────────────────────────────────────────

const CATEGORY_RULES: { slug: string; re: RegExp }[] = [
  { slug: "rent",      re: /аренд|сдам|сдаю|сниму|квартир|комнат|жиль|rent\b/i },
  { slug: "jobs",      re: /работ|вакансия|ищу работ|резюме|нанима|job|vacancy/i },
  { slug: "transport", re: /авто\b|машин|автомобил|bmw|volkswagen|toyota|ford|hyundai|kia/i },
  { slug: "education", re: /обучени|курс|репетитор|урок\b|учу\b|lesson/i },
  { slug: "services",  re: /услуг|помогу|сделаю|перевод|юрист|ремонт|клининг|service/i },
  { slug: "meetups",   re: /встреч|прогулк|знакомств|ищу компани|meetup/i },
  { slug: "stuff",     re: /продам|продаю|продается|куплю|отдам|даром|телефон|ноутбук/i },
];

function detectCategory(text: string): string {
  for (const { slug, re } of CATEGORY_RULES) {
    if (re.test(text)) return slug;
  }
  return "misc";
}

// ─── Price parsing ────────────────────────────────────────────────────────────

function parsePrice(text: string): { price: number | null; currency: string } {
  const patterns: { re: RegExp; currency: string }[] = [
    { re: /([\d][\d\s,.]*)\s*(?:€|EUR|евро)/i,     currency: "EUR" },
    { re: /([\d][\d\s,.]*)\s*(?:RSD|дин|динар)/i,  currency: "RSD" },
    { re: /([\d][\d\s,.]*)\s*(?:USD|\$|доллар)/i,  currency: "USD" },
  ];
  for (const { re, currency } of patterns) {
    const m = text.match(re);
    if (m) {
      const num = parseFloat(m[1].replace(/\s/g, "").replace(",", "."));
      if (!isNaN(num) && num > 0 && num < 10_000_000) {
        return { price: num, currency };
      }
    }
  }
  return { price: null, currency: "EUR" };
}

// ─── Message text parsing ─────────────────────────────────────────────────────

function parseMessage(text: string): { title: string; description: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { title: "Объявление", description: "" };

  // First line → title (strip leading punctuation/emoji clusters)
  let title = lines[0].replace(/^[\s\p{Emoji}\p{P}]+/u, "").trim() || lines[0];
  title = title.slice(0, 120);
  if (!title) title = "Объявление";

  const description = lines.slice(1).join("\n");
  return { title, description };
}

// ─── Photo upload ─────────────────────────────────────────────────────────────

async function uploadPhoto(
  client: TelegramClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any,
  channel: string
): Promise<string | null> {
  try {
    const buf = (await client.downloadMedia(message, {})) as Buffer | undefined;
    if (!buf?.length) return null;

    const filename = `tg-import/${channel}/${message.id}.jpg`;
    const { error } = await supabase.storage
      .from("images")
      .upload(filename, buf, { contentType: "image/jpeg", upsert: true });

    if (error) {
      console.warn(`    ⚠ upload failed for msg ${message.id}:`, error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(filename);

    return publicUrl;
  } catch (err) {
    console.warn(`    ⚠ photo download failed for msg ${message.id}:`, err);
    return null;
  }
}

// ─── Import user ──────────────────────────────────────────────────────────────

async function getImportUserId(): Promise<string> {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", IMPORT_USER_TG_ID)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      telegram_id:       IMPORT_USER_TG_ID,
      first_name:        "Импорт из Telegram",
      completed_profile: true,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(`Cannot create import user: ${error?.message}`);
  return created.id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_ID || !API_HASH) {
    console.error("❌  TELEGRAM_API_ID and TELEGRAM_API_HASH are required in .env.local");
    console.error("    Run scripts/tg-session.ts first to generate the session.");
    process.exit(1);
  }
  if (!SESSION) {
    console.error("❌  TELEGRAM_SESSION is empty. Run scripts/tg-session.ts first.");
    process.exit(1);
  }

  console.log(`🚀  Svoi — Telegram Channel Importer`);
  console.log(`    Channels: ${CHANNELS.join(", ")}`);
  console.log(`    Limit:    ${MESSAGES_LIMIT} messages per channel\n`);

  // Load categories from DB
  const { data: cats } = await supabase.from("categories").select("id, slug");
  const catMap = Object.fromEntries(
    (cats ?? []).map((c: { slug: string; id: number }) => [c.slug, c.id])
  );

  // Get (or create) the import user
  const importUserId = await getImportUserId();
  console.log(`📦  Import user: ${importUserId}\n`);

  // Connect to Telegram via MTProto
  const client = new TelegramClient(new StringSession(SESSION), API_ID, API_HASH, {
    connectionRetries: 3,
  });
  await client.connect();
  console.log("✅  Connected to Telegram\n");

  let totalImported = 0;
  let totalSkipped  = 0;
  let totalErrors   = 0;

  for (const channel of CHANNELS) {
    console.log(`📡  @${channel} — reading up to ${MESSAGES_LIMIT} messages...`);
    let imported = 0;
    let skipped  = 0;
    let errors   = 0;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const message of (client as any).iterMessages(channel, {
        limit: MESSAGES_LIMIT,
      })) {
        const text: string = message.message ?? "";
        if (!text.trim()) {
          skipped++;
          continue;
        }

        // Extract author Telegram ID if available (signed posts only, rare in broadcast channels)
        let authorId: number | null = null;
        if (message.fromId?.className === "PeerUser") {
          try {
            authorId = Number(message.fromId.userId);
          } catch {
            /* ignore */
          }
        }

        const { title, description } = parseMessage(text);
        const { price, currency }    = parsePrice(text);
        const catSlug                = detectCategory(text);
        const categoryId             = catMap[catSlug] ?? catMap["misc"];

        // Download the first photo if present
        let images: { url: string }[] = [];
        if (message.media?.className === "MessageMediaPhoto") {
          const url = await uploadPhoto(client, message, channel);
          if (url) images = [{ url }];
        }

        // Insert — ON CONFLICT with unique index = skip if already imported
        const { error } = await supabase.from("listings").insert({
          user_id:              importUserId,
          category_id:          categoryId,
          title,
          description:          description || null,
          price,
          currency,
          images:               JSON.stringify(images),
          status:               "active",
          tg_channel:           channel,
          tg_message_id:        message.id,
          tg_author_id:         authorId,
          tg_author_username:   null,
        });

        if (error?.code === "23505") {
          // Unique violation → already imported, skip silently
          skipped++;
        } else if (error) {
          console.warn(`    ⚠  msg ${message.id}: ${error.message}`);
          errors++;
        } else {
          imported++;
          process.stdout.write(`    ✓  [${message.id}] ${title.slice(0, 60)}\n`);
        }
      }
    } catch (err) {
      console.error(`    ✗  Error reading @${channel}:`, err);
      errors++;
    }

    console.log(
      `    → imported: ${imported} | dupes skipped: ${skipped} | errors: ${errors}\n`
    );
    totalImported += imported;
    totalSkipped  += skipped;
    totalErrors   += errors;

    // Brief pause between channels to respect Telegram rate limits
    await new Promise((r) => setTimeout(r, 1500));
  }

  await client.disconnect();

  console.log("─".repeat(50));
  console.log(
    `🎉  Done!  imported: ${totalImported} | skipped (dupes): ${totalSkipped} | errors: ${totalErrors}`
  );
  console.log(`\n    View listings at: ${APP_URL}/home`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
