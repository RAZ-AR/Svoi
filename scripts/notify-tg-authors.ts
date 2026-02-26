// Svoi — Notify original Telegram authors about their imported listings
//
// Sends a reply to the original channel post (from the bot) with:
//   - A link to the listing on Svoi
//   - Instruction on how to claim/edit/delete it
//
// The bot MUST be added as admin with "Post Messages" permission
// in each channel before running this script.
//
// Usage (dry run first!):
//   npx tsx scripts/notify-tg-authors.ts --dry-run
//   npx tsx scripts/notify-tg-authors.ts
//   npx tsx scripts/notify-tg-authors.ts --channel=belgrad_serbia  (one channel only)

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "https://svoi-lac.vercel.app";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const isDryRun      = process.argv.includes("--dry-run");
const channelFilter = process.argv.find((a) => a.startsWith("--channel="))?.split("=")[1];

// ─── Telegram API helper ──────────────────────────────────────────────────────

async function tgSend(method: string, body: object): Promise<{ ok: boolean; result?: unknown; description?: string }> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ─── Build notification message ───────────────────────────────────────────────

function buildNotification(listing: {
  id: string;
  title: string;
  tg_channel: string;
}): { text: string; reply_markup: object } {
  const listingUrl = `${APP_URL}/listings/${listing.id}`;

  const text =
    `🔔 <b>Ваше объявление теперь на Svoi!</b>\n\n` +
    `<i>${listing.title.slice(0, 100)}</i>\n\n` +
    `Svoi — доска объявлений для русскоязычных в Белграде. ` +
    `Нажмите кнопку ниже чтобы открыть, отредактировать или удалить объявление.\n\n` +
    `<b>Как управлять объявлением?</b>\n` +
    `Откройте ссылку → нажмите «Это моё объявление» → получите полный доступ.`;

  const reply_markup = {
    inline_keyboard: [
      [{ text: "Открыть объявление →", url: listingUrl }],
    ],
  };

  return { text, reply_markup };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!BOT_TOKEN) {
    console.error("❌  TELEGRAM_BOT_TOKEN is required in .env.local");
    process.exit(1);
  }

  console.log(`🔔  Svoi — Author Notifier`);
  if (isDryRun)      console.log("    ⚠  DRY RUN — no messages will be sent");
  if (channelFilter) console.log(`    Channel filter: @${channelFilter}`);
  console.log();

  // Fetch un-notified imported listings
  let query = supabase
    .from("listings")
    .select("id, title, tg_channel, tg_message_id")
    .not("tg_channel", "is", null)
    .is("tg_notified_at", null)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (channelFilter) {
    query = query.eq("tg_channel", channelFilter);
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error("DB error:", error.message);
    process.exit(1);
  }

  if (!listings?.length) {
    console.log("✅  Nothing to notify — all imported listings are already notified.");
    return;
  }

  console.log(`📋  Found ${listings.length} listing(s) to notify\n`);

  let sent   = 0;
  let failed = 0;

  for (const listing of listings) {
    const chatId    = `@${listing.tg_channel}`;
    const msgId     = listing.tg_message_id;
    const shortTitle = listing.title.slice(0, 60);

    console.log(`  → [${listing.tg_channel}/${msgId}] ${shortTitle}`);

    if (isDryRun) {
      console.log(`     (dry run — would send reply to ${chatId} msg ${msgId})\n`);
      continue;
    }

    const { text, reply_markup } = buildNotification(listing);

    const result = await tgSend("sendMessage", {
      chat_id:               chatId,
      text,
      parse_mode:            "HTML",
      reply_to_message_id:   msgId,
      reply_markup,
      disable_web_page_preview: true,
    });

    if (result.ok) {
      // Mark as notified
      await supabase
        .from("listings")
        .update({ tg_notified_at: new Date().toISOString() })
        .eq("id", listing.id);

      console.log(`     ✓ sent\n`);
      sent++;
    } else {
      console.warn(`     ✗ failed: ${result.description}\n`);
      failed++;
    }

    // Brief pause to respect Telegram rate limits (30 msg/sec per group)
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!isDryRun) {
    console.log("─".repeat(50));
    console.log(`✅  Done!  sent: ${sent} | failed: ${failed}`);
  } else {
    console.log("\nRun without --dry-run to actually send the notifications.");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
