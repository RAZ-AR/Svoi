// Svoi — Telegram channel importer via public web (no API credentials needed)
// Reads public channels through t.me/s/{channel} — zero auth required.
// Safe to run multiple times — duplicates skipped via unique index.
//
// Usage:
//   npx tsx scripts/import-tg-scrape.ts
//   npx tsx scripts/import-tg-scrape.ts --limit=100
//   npx tsx scripts/import-tg-scrape.ts --channel=belgrad_serbia
//   npx tsx scripts/import-tg-scrape.ts --debug   (show raw HTML for diagnosis)

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://svoi-lac.vercel.app";

const CHANNELS = [
  "belgrad_serbia",
  "avito_serbia",
  "Beograd_oglasi",
  "vizitkars",
];

const limitArg    = process.argv.find((a) => a.startsWith("--limit="));
const channelArg  = process.argv.find((a) => a.startsWith("--channel="));
const DEBUG       = process.argv.includes("--debug");
const PAGES_LIMIT = limitArg ? Math.ceil(Number(limitArg.split("=")[1]) / 20) : 10;
const ONLY        = channelArg ? channelArg.split("=")[1] : null;

const IMPORT_USER_TG_ID = 888888888;

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface TgPost {
  id: number;
  text: string;
  photoUrl: string | null;
  date: string;
}

function parsePosts(html: string): TgPost[] {
  const posts: TgPost[] = [];

  // Find all message IDs from data-post="channel/ID"
  const idMatches = [...html.matchAll(/data-post="[^"]*\/(\d+)"/g)];
  if (DEBUG) console.log(`    [debug] found ${idMatches.length} data-post entries`);

  for (let i = 0; i < idMatches.length; i++) {
    const idMatch = idMatches[i];
    const id      = Number(idMatch[1]);
    const start   = idMatch.index!;
    const end     = i + 1 < idMatches.length ? idMatches[i + 1].index! : html.length;
    const block   = html.slice(start, Math.min(end, start + 8000));

    // ── Extract text ──────────────────────────────────────────────────────
    let text = "";

    // Try: tgme_widget_message_text
    const txtMatch =
      block.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/) ??
      block.match(/js-message_text[^>]*>([\s\S]*?)<\/div>/);
    if (txtMatch) text = stripHtml(txtMatch[1]);

    // ── Extract photo URL ─────────────────────────────────────────────────
    let photoUrl: string | null = null;

    // background-image:url('...')
    const bgMatch = block.match(/background-image:url\('([^']+)'\)/);
    if (bgMatch) photoUrl = bgMatch[1];

    // or <img src="..."> (skip avatars)
    if (!photoUrl) {
      const imgMatches = [...block.matchAll(/<img[^>]+src="([^"]+)"/g)];
      for (const m of imgMatches) {
        if (!m[1].includes("userpic") && !m[1].includes("avatar")) {
          photoUrl = m[1];
          break;
        }
      }
    }

    // ── Extract date ──────────────────────────────────────────────────────
    const dateMatch = block.match(/datetime="([^"]+)"/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

    if (DEBUG) {
      console.log(`    [debug] id=${id} text="${text.slice(0, 40)}" photo=${!!photoUrl}`);
    }

    if (text.trim() || photoUrl) {
      posts.push({ id, text, photoUrl, date });
    }
  }

  return posts;
}

// ─── Fetch one page ───────────────────────────────────────────────────────────

async function fetchPage(channel: string, beforeId?: number): Promise<{ posts: TgPost[]; minId: number }> {
  const url = beforeId
    ? `https://t.me/s/${channel}?before=${beforeId}`
    : `https://t.me/s/${channel}`;

  if (DEBUG) console.log(`    [debug] GET ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
      "Cache-Control":   "no-cache",
    },
  });

  if (!res.ok) {
    console.warn(`    ⚠ HTTP ${res.status} for ${url}`);
    return { posts: [], minId: 0 };
  }

  const html = await res.text();

  if (DEBUG) {
    console.log(`    [debug] response ${html.length} chars`);
    // Show a snippet around first data-post
    const idx = html.indexOf("data-post=");
    if (idx >= 0) console.log(`    [debug] first data-post context:\n${html.slice(idx, idx + 300)}`);
    else          console.log(`    [debug] NO data-post found in HTML`);
  }

  const posts = parsePosts(html);
  const minId = posts.length ? Math.min(...posts.map((p) => p.id)) : 0;
  return { posts, minId };
}

// ─── Photo upload ─────────────────────────────────────────────────────────────

async function uploadPhoto(photoUrl: string, channel: string, msgId: number): Promise<string | null> {
  try {
    const res = await fetch(photoUrl, {
      headers: { "Referer": "https://t.me/" },
    });
    if (!res.ok) return null;

    const buf  = await res.arrayBuffer();
    const ext  = photoUrl.includes(".png") ? "png" : "jpg";
    const path = `tg-import/${channel.toLowerCase()}/${msgId}.${ext}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(path, buf, { contentType: `image/${ext}`, upsert: true });

    if (error) {
      if (DEBUG) console.warn(`    [debug] upload error: ${error.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
    return publicUrl;
  } catch {
    return null;
  }
}

// ─── Category + price ─────────────────────────────────────────────────────────

const CATEGORY_RULES = [
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

function parsePrice(text: string): { price: number | null; currency: string } {
  const patterns = [
    { re: /([\d][\d\s,.]*)\s*(?:€|EUR|евро)/i,    currency: "EUR" },
    { re: /([\d][\d\s,.]*)\s*(?:RSD|дин|динар)/i, currency: "RSD" },
    { re: /([\d][\d\s,.]*)\s*(?:USD|\$|доллар)/i, currency: "USD" },
  ];
  for (const { re, currency } of patterns) {
    const m = text.match(re);
    if (m) {
      const num = parseFloat(m[1].replace(/\s/g, "").replace(",", "."));
      if (!isNaN(num) && num > 0 && num < 10_000_000) return { price: num, currency };
    }
  }
  return { price: null, currency: "EUR" };
}

function parseTitle(text: string): { title: string; description: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { title: "Объявление", description: "" };
  const title = lines[0].slice(0, 120) || "Объявление";
  return { title, description: lines.slice(1).join("\n") };
}

// ─── Import user ──────────────────────────────────────────────────────────────

async function getImportUserId(): Promise<string> {
  const { data: existing } = await supabase
    .from("users").select("id").eq("telegram_id", IMPORT_USER_TG_ID).single();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("users")
    .insert({ telegram_id: IMPORT_USER_TG_ID, first_name: "Импорт из Telegram", completed_profile: true })
    .select("id").single();
  if (error || !created) throw new Error(`Cannot create import user: ${error?.message}`);
  return created.id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const channels = ONLY ? [ONLY] : CHANNELS;

  console.log(`🚀  Svoi — Telegram Scrape Importer (no auth required)`);
  console.log(`    Channels: ${channels.join(", ")}`);
  console.log(`    Pages:    ${PAGES_LIMIT} per channel (~${PAGES_LIMIT * 20} messages)\n`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cats } = await supabase.from("categories").select("id, slug");
  const catMap = Object.fromEntries((cats ?? []).map((c: any) => [c.slug, c.id]));
  const importUserId = await getImportUserId();

  let totalImported = 0;
  let totalSkipped  = 0;

  for (const channel of channels) {
    console.log(`📡  @${channel}`);
    let imported = 0;
    let skipped  = 0;
    let beforeId: number | undefined;

    for (let page = 0; page < PAGES_LIMIT; page++) {
      const { posts, minId } = await fetchPage(channel, beforeId);
      beforeId = minId > 0 ? minId : undefined;

      if (!posts.length) {
        if (page === 0) console.log(`    ⚠ No posts found — channel may be private or name is wrong`);
        break;
      }

      for (const post of posts) {
        if (!post.text.trim() && !post.photoUrl) { skipped++; continue; }

        const { title, description } = parseTitle(post.text);
        const { price, currency }    = parsePrice(post.text);
        const catSlug                = detectCategory(post.text);
        const categoryId             = catMap[catSlug] ?? catMap["misc"];

        let images: { url: string }[] = [];
        if (post.photoUrl) {
          const url = await uploadPhoto(post.photoUrl, channel, post.id);
          if (url) images = [{ url }];
        }

        const { error } = await supabase.from("listings").insert({
          user_id:       importUserId,
          category_id:   categoryId,
          title,
          description:   description || null,
          price,
          currency,
          images:        JSON.stringify(images),
          status:        "active",
          created_at:    post.date,
          tg_channel:    channel,
          tg_message_id: post.id,
        });

        if (error?.code === "23505") {
          skipped++;
        } else if (error) {
          console.warn(`    ⚠  [${post.id}]: ${error.message}`);
          skipped++;
        } else {
          imported++;
          console.log(`    ✓  [${post.id}] ${title.slice(0, 58)}`);
        }
      }

      await new Promise((r) => setTimeout(r, 800));
      if (!beforeId) break;
    }

    console.log(`    → imported: ${imported} | dupes skipped: ${skipped}\n`);
    totalImported += imported;
    totalSkipped  += skipped;
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("─".repeat(50));
  console.log(`🎉  Done! imported: ${totalImported} | dupes skipped: ${totalSkipped}`);
  console.log(`\n    View at: ${APP_URL}/home`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
