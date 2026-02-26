// Svoi — Import from Telegram Desktop export (HTML format)
// - Imports only posts from the last N months (default: 3)
// - Upsert: re-running updates existing listings, no duplicates
// - Marks "verified author" badge for active posters (3+ listings)
// - --dry-run: preview stats without writing to DB
//
// Usage:
//   npx tsx scripts/import-tg-export.ts --dir=~/Downloads/tg-export --dry-run
//   npx tsx scripts/import-tg-export.ts --dir=~/Downloads/tg-export --months=3
//   npx tsx scripts/import-tg-export.ts --dir=~/Downloads/tg-export --channel=belgrad_serbia

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as fs   from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://svoi-lac.vercel.app";

// ─── Args ─────────────────────────────────────────────────────────────────────

const dirArg     = process.argv.find((a) => a.startsWith("--dir="));
const channelArg = process.argv.find((a) => a.startsWith("--channel="));
const monthsArg  = process.argv.find((a) => a.startsWith("--months="));
const DRY_RUN    = process.argv.includes("--dry-run");

if (!dirArg) {
  console.error("❌  Usage: npx tsx scripts/import-tg-export.ts --dir=~/Downloads/tg-export [--dry-run] [--months=3]");
  process.exit(1);
}

const BASE_DIR  = dirArg.split("=")[1].replace(/^~/, process.env.HOME ?? "");
const ONLY      = channelArg ? channelArg.split("=")[1] : null;
const MONTHS    = monthsArg  ? Number(monthsArg.split("=")[1]) : 3;

// Cutoff: only import posts newer than this
const CUTOFF = new Date();
CUTOFF.setMonth(CUTOFF.getMonth() - MONTHS);

// Threshold for "verified author" badge (N or more listings = verified)
const VERIFIED_THRESHOLD = 3;

const IMPORT_USER_TG_ID = 888888888;

// ─── HTML parsing ─────────────────────────────────────────────────────────────

interface TgPost {
  id:             number;
  text:           string;
  photoRel:       string | null;
  date:           Date;
  authorName:     string | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseHtmlFile(html: string): TgPost[] {
  const posts: TgPost[] = [];
  const blocks = html.split(/(?=<div class="message)/);

  for (const block of blocks) {
    const idMatch = block.match(/id="message(\d+)"/);
    if (!idMatch) continue;
    const id = Number(idMatch[1]);

    // Text
    let text = "";
    const textMatch = block.match(/<div class="text[^"]*">([\s\S]*?)<\/div>/);
    if (textMatch) text = stripHtml(textMatch[1]);

    // Photo
    let photoRel: string | null = null;
    const photoMatch =
      block.match(/href="(photos\/[^"]+\.(?:jpg|jpeg|png|webp))"/i) ??
      block.match(/src="(photos\/[^"]+\.(?:jpg|jpeg|png|webp))"/i);
    if (photoMatch) photoRel = photoMatch[1];

    // Date — search for title="DD.MM.YYYY HH:MM:SS" anywhere in block
    // Handles: class="pull_right date details", timezone suffix "UTC+01:00", etc.
    let date = new Date(0); // epoch = guaranteed "too old", filtered out if unparseable
    const dateMatch = block.match(/title="(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
    if (dateMatch) {
      const [, dd, mm, yyyy, hh, min, ss] = dateMatch.map(Number);
      date = new Date(yyyy, mm - 1, dd, hh, min, ss);
    }

    // Author name (only in channels with signed posts)
    let authorName: string | null = null;
    const fromMatch = block.match(/<div class="from_name">([^<]+)</);
    if (fromMatch) authorName = fromMatch[1].trim() || null;

    if (text.trim() || photoRel) {
      posts.push({ id, text, photoRel, date, authorName });
    }
  }

  return posts;
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
  return { title: lines[0].slice(0, 120) || "Объявление", description: lines.slice(1).join("\n") };
}

// ─── Photo upload ─────────────────────────────────────────────────────────────

async function uploadLocalPhoto(absPath: string, channel: string, msgId: number): Promise<string | null> {
  if (!fs.existsSync(absPath)) return null;
  try {
    const buf  = fs.readFileSync(absPath);
    const ext  = absPath.endsWith(".png") ? "png" : "jpg";
    const dest = `tg-import/${channel.toLowerCase()}/${msgId}.${ext}`;
    const { error } = await supabase.storage
      .from("images").upload(dest, buf, { contentType: `image/${ext}`, upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(dest);
    return publicUrl;
  } catch { return null; }
}

// ─── Import user ──────────────────────────────────────────────────────────────

async function getImportUserId(): Promise<string> {
  const { data } = await supabase.from("users").select("id")
    .eq("telegram_id", IMPORT_USER_TG_ID).single();
  if (data) return data.id;
  const { data: created, error } = await supabase.from("users")
    .insert({ telegram_id: IMPORT_USER_TG_ID, first_name: "Импорт из Telegram", completed_profile: true })
    .select("id").single();
  if (error || !created) throw new Error(`Cannot create import user: ${error?.message}`);
  return created.id;
}

// ─── Mark verified authors ────────────────────────────────────────────────────
// After import: authors with VERIFIED_THRESHOLD+ listings = verified badge

async function markVerifiedAuthors(channels: string[]) {
  console.log(`\n🏅  Marking verified authors (${VERIFIED_THRESHOLD}+ listings)...`);

  for (const channel of channels) {
    // Count listings per author in this channel
    const { data: counts } = await supabase
      .from("listings")
      .select("tg_author_username, tg_author_id")
      .eq("tg_channel", channel)
      .not("tg_author_username", "is", null);

    if (!counts?.length) {
      // No named authors — fall back to channel-level verification:
      // if the channel contributed 10+ listings, mark all as verified
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("tg_channel", channel)
        .eq("status", "active");

      if ((count ?? 0) >= 10) {
        const { error } = await supabase
          .from("listings")
          .update({ tg_author_verified: true })
          .eq("tg_channel", channel);
        if (!error) console.log(`    ✓ @${channel} — channel verified (${count} listings)`);
      }
      continue;
    }

    // Count by author name
    const authorCounts: Record<string, number> = {};
    for (const row of counts) {
      const key = row.tg_author_username ?? `id:${row.tg_author_id}`;
      authorCounts[key] = (authorCounts[key] ?? 0) + 1;
    }

    const verifiedAuthors = Object.entries(authorCounts)
      .filter(([, c]) => c >= VERIFIED_THRESHOLD)
      .map(([name]) => name);

    if (verifiedAuthors.length) {
      await supabase
        .from("listings")
        .update({ tg_author_verified: true })
        .eq("tg_channel", channel)
        .in("tg_author_username", verifiedAuthors);
      console.log(`    ✓ @${channel} — ${verifiedAuthors.length} verified author(s): ${verifiedAuthors.join(", ")}`);
    } else {
      console.log(`    · @${channel} — no authors reached threshold yet`);
    }
  }
}

// ─── Cross-channel fingerprint map (shared across all channel imports) ────────
// fingerprint (first 100 chars) → listing id already in DB
const crossChannelMap = new Map<string, string>();

function textFingerprint(text: string): string {
  return text.slice(0, 100).trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Process one channel ──────────────────────────────────────────────────────

async function importChannel(
  channelDir: string,
  channelName: string,
  catMap: Record<string, number>,
  importUserId: string
): Promise<{ imported: number; updated: number; skipped: number; tooOld: number }> {

  const htmlFiles = fs.readdirSync(channelDir)
    .filter((f) => f.match(/^messages\d*\.html$/))
    .sort((a, b) => {
      const na = Number(a.replace("messages", "").replace(".html", "") || "1");
      const nb = Number(b.replace("messages", "").replace(".html", "") || "1");
      return na - nb;
    });

  if (!htmlFiles.length) {
    console.log(`    ⚠ No messages*.html files found`);
    return { imported: 0, updated: 0, skipped: 0, tooOld: 0 };
  }

  // Parse all HTML files and deduplicate by message ID
  const seen = new Set<number>();
  const allPosts: TgPost[] = [];
  for (const file of htmlFiles) {
    const html  = fs.readFileSync(path.join(channelDir, file), "utf-8");
    for (const post of parseHtmlFile(html)) {
      if (!seen.has(post.id)) { seen.add(post.id); allPosts.push(post); }
    }
  }

  // Sort by date descending (newest first)
  allPosts.sort((a, b) => b.date.getTime() - a.date.getTime());

  const recent = allPosts.filter((p) => p.date >= CUTOFF);
  const tooOld = allPosts.length - recent.length;

  // Keep only posts that have meaningful text (min 10 chars)
  const noText    = recent.filter((p) => p.text.trim().length < 10).length;
  const withText  = recent.filter((p) => p.text.trim().length >= 10);

  // Remove intra-export duplicates (same first 80 chars = same listing reposted)
  const textSeen  = new Set<string>();
  let   intraDupes = 0;
  const toImport: TgPost[] = [];
  for (const p of withText) {
    const fp = p.text.slice(0, 80).trim().toLowerCase();
    if (fp && textSeen.has(fp)) { intraDupes++; continue; }
    if (fp) textSeen.add(fp);
    toImport.push(p);
  }

  const withPhoto = toImport.filter((p) => p.photoRel).length;

  console.log(`    Total in export:    ${allPosts.length}`);
  console.log(`    Older than ${MONTHS}m:    ${tooOld} → пропущено`);
  console.log(`    Без текста:         ${noText} → пропущено`);
  console.log(`    Дублей удалено:     ${intraDupes}`);
  console.log(`    С фото:             ${withPhoto}`);
  console.log(`    Готово к импорту:   ${toImport.length}`);

  if (DRY_RUN) {
    console.log(`\n    Примеры (первые 8):`);
    for (const p of toImport.slice(0, 8)) {
      const { title } = parseTitle(p.text);
      const cat = detectCategory(p.text);
      const { price, currency } = parsePrice(p.text);
      const priceStr = price ? `${price} ${currency}` : "цена не указана";
      console.log(`      [${p.id}] [${cat}] ${title.slice(0, 55)} — ${priceStr}`);
    }
    if (toImport.length > 8) console.log(`      ... и ещё ${toImport.length - 8}`);
    return { imported: 0, updated: 0, skipped: 0, tooOld, dryCount: toImport.length } as any;
  }

  console.log("");

  let imported    = 0;
  let updated     = 0;
  let crossDupes  = 0;
  let skipped     = 0;

  for (const post of toImport) {
    const fp = textFingerprint(post.text);

    // ── Cross-channel duplicate: same listing already imported from another channel ──
    if (crossChannelMap.has(fp)) {
      const existingId = crossChannelMap.get(fp)!;

      // Append this channel as an additional source tag
      const { data: existing } = await supabase
        .from("listings")
        .select("tg_sources")
        .eq("id", existingId)
        .single();

      const raw = existing?.tg_sources;
      const sources: { channel: string; message_id: number }[] =
        Array.isArray(raw) ? raw : (typeof raw === "string" ? JSON.parse(raw) : []);

      // Only add if this channel isn't already in sources
      const alreadyTagged = sources.some((s) => s.channel === channelName);
      if (!alreadyTagged) {
        sources.push({ channel: channelName, message_id: post.id });
        await supabase
          .from("listings")
          .update({ tg_sources: sources })
          .eq("id", existingId);
        process.stdout.write(`    ↩  [${post.id}] cross-dupe → added tag @${channelName}\n`);
      }

      crossDupes++;
      continue;
    }

    const { title, description } = parseTitle(post.text);
    const { price, currency }    = parsePrice(post.text);
    const catSlug                = detectCategory(post.text);
    const categoryId             = catMap[catSlug] ?? catMap["misc"];

    let images: { url: string }[] = [];
    if (post.photoRel) {
      const absPath = path.join(channelDir, post.photoRel);
      const url = await uploadLocalPhoto(absPath, channelName, post.id);
      if (url) images = [{ url }];
    }

    // Upsert on (tg_channel, tg_message_id)
    const { error, data } = await supabase
      .from("listings")
      .upsert({
        user_id:              importUserId,
        category_id:          categoryId,
        title,
        description:          description || null,
        price,
        currency,
        images:               JSON.stringify(images),
        status:               "active",
        created_at:           post.date.toISOString(),
        tg_channel:           channelName,
        tg_message_id:        post.id,
        tg_author_username:   post.authorName,
        tg_sources:           JSON.stringify([]),
      }, {
        onConflict:       "tg_channel,tg_message_id",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      console.warn(`    ⚠  [${post.id}]: ${error.message}`);
      skipped++;
    } else {
      const listingId = (data as any)?.[0]?.id;
      if (listingId) crossChannelMap.set(fp, listingId); // register for cross-channel dedup
      imported++;
      process.stdout.write(`    ✓  [${post.id}] ${title.slice(0, 58)}\n`);
    }
  }

  console.log(`    → upserted: ${imported} | cross-dupes merged: ${crossDupes} | skipped: ${skipped}\n`);
  return { imported, updated, skipped, tooOld };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(BASE_DIR)) {
    console.error(`❌  Not found: ${BASE_DIR}`);
    process.exit(1);
  }

  const allDirs  = fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);
  const channels = ONLY ? allDirs.filter((d) => d.toLowerCase() === ONLY.toLowerCase()) : allDirs;

  if (!channels.length) {
    console.error(`❌  No channel folders found in ${BASE_DIR}`);
    process.exit(1);
  }

  console.log(`🚀  Svoi — Telegram Export Importer${DRY_RUN ? " [DRY RUN — ничего не запишется]" : ""}`);
  console.log(`    Dir:      ${BASE_DIR}`);
  console.log(`    Channels: ${channels.join(", ")}`);
  console.log(`    Filter:   последние ${MONTHS} месяца (с ${CUTOFF.toLocaleDateString("ru-RU")})\n`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cats } = await supabase.from("categories").select("id, slug");
  const catMap       = Object.fromEntries((cats ?? []).map((c: any) => [c.slug, c.id]));
  const importUserId = await getImportUserId();

  let totalImported = 0;
  let totalSkipped  = 0;
  let totalOld      = 0;
  let totalDry      = 0;

  for (const channel of channels) {
    console.log(`📡  @${channel}`);
    const res = await importChannel(path.join(BASE_DIR, channel), channel, catMap, importUserId) as any;
    if (DRY_RUN) {
      totalDry += res.dryCount ?? 0;
    } else {
      console.log(`    → upserted: ${res.imported} | skipped: ${res.skipped} | too old: ${res.tooOld}\n`);
    }
    totalImported += res.imported;
    totalSkipped  += res.skipped;
    totalOld      += res.tooOld;
  }

  console.log("─".repeat(50));

  if (DRY_RUN) {
    console.log(`📊  Итого будет импортировано: ${totalDry} объявлений`);
    console.log(`    Старых (пропущено):         ${totalOld}`);
    console.log(`\n    Всё выглядит правильно? Запусти без --dry-run:`);
    console.log(`    npx tsx scripts/import-tg-export.ts --dir=${BASE_DIR} --months=${MONTHS}`);
    return;
  }

  // Mark verified authors across all imported channels
  await markVerifiedAuthors(channels);

  console.log(`🎉  Done! upserted: ${totalImported} | skipped: ${totalSkipped} | too old (ignored): ${totalOld}`);
  console.log(`\n    View at: ${APP_URL}/home`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
