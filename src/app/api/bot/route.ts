// Svoi — Telegram Bot webhook handler
// POST /api/bot  ← registered as Telegram webhook URL
"use server";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL || "https://svoi-lac.vercel.app";

// Channels whose posts are auto-imported into listings
const MONITORED_CHANNELS = new Set([
  "belgrad_serbia",
  "avito_serbia",
  "beograd_oglasi",   // lowercase for case-insensitive matching
  "vizitkars",
]);

// Sentinel user ID for channel-imported listings (same as import script)
const IMPORT_USER_TG_ID = 888888888;

// ─── Telegram API helper ──────────────────────────────────────────────────────

async function sendMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: object,
  replyToMessageId?: number
) {
  const body: Record<string, unknown> = {
    chat_id:    chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup)     body.reply_markup          = replyMarkup;
  if (replyToMessageId) body.reply_to_message_id  = replyToMessageId;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
}

// ─── Download photo from Bot API ──────────────────────────────────────────────

async function downloadTgPhoto(fileId: string): Promise<ArrayBuffer | null> {
  try {
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileData = await fileRes.json();
    if (!fileData.ok) return null;

    const dlRes = await fetch(
      `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`
    );
    if (!dlRes.ok) return null;
    return dlRes.arrayBuffer();
  } catch {
    return null;
  }
}

// ─── Category detection ───────────────────────────────────────────────────────

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
  let title = lines[0].replace(/^[\s\p{Emoji}\p{P}]+/u, "").trim() || lines[0];
  title = title.slice(0, 120) || "Объявление";
  return { title, description: lines.slice(1).join("\n") };
}

// ─── Handle incoming channel post ─────────────────────────────────────────────

async function handleChannelPost(post: {
  message_id: number;
  chat: { username?: string };
  text?: string;
  caption?: string;
  photo?: { file_id: string; width: number; height: number }[];
}) {
  const channelUsername = (post.chat.username ?? "").toLowerCase();
  if (!MONITORED_CHANNELS.has(channelUsername)) return; // not one of ours

  const text = (post.text ?? post.caption ?? "").trim();
  if (!text) return; // skip photo-only posts without caption

  const supabase = createServiceClient();

  // Ensure import user exists
  const { data: importUser } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", IMPORT_USER_TG_ID)
    .single();

  let importUserId: string;
  if (importUser) {
    importUserId = importUser.id;
  } else {
    const { data: created } = await supabase
      .from("users")
      .insert({ telegram_id: IMPORT_USER_TG_ID, first_name: "Импорт из Telegram", completed_profile: true })
      .select("id")
      .single();
    if (!created) return;
    importUserId = created.id;
  }

  // Load categories
  const { data: cats } = await supabase.from("categories").select("id, slug");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catMap = Object.fromEntries((cats ?? []).map((c: any) => [c.slug, c.id]));

  const { title, description } = parseTitle(text);
  const { price, currency }    = parsePrice(text);
  const catSlug                = detectCategory(text);
  const categoryId             = catMap[catSlug] ?? catMap["misc"];

  // Download photo (pick largest size = last in array)
  let images: { url: string }[] = [];
  if (post.photo?.length) {
    const largest = post.photo[post.photo.length - 1];
    const buf = await downloadTgPhoto(largest.file_id);
    if (buf) {
      const filename = `tg-import/${channelUsername}/${post.message_id}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("images")
        .upload(filename, buf, { contentType: "image/jpeg", upsert: true });

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filename);
        images = [{ url: publicUrl }];
      }
    }
  }

  // Upsert with dedup (ON CONFLICT DO NOTHING via unique index)
  await supabase.from("listings").insert({
    user_id:       importUserId,
    category_id:   categoryId,
    title,
    description:   description || null,
    price,
    currency,
    images:        JSON.stringify(images),
    status:        "active",
    tg_channel:    post.chat.username ?? channelUsername, // preserve original casing
    tg_message_id: post.message_id,
  });
  // Unique index violation (duplicate) is silently ignored by Supabase
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // ── Channel post: auto-import into listings ────────────────────────────
    if (update?.channel_post) {
      await handleChannelPost(update.channel_post);
      return NextResponse.json({ ok: true });
    }

    const message = update?.message;
    if (!message?.from || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const { from, chat, text } = message as {
      from:  { id: number; first_name: string; last_name?: string; username?: string };
      chat:  { id: number };
      text:  string;
    };

    // ── /start ────────────────────────────────────────────────────────────────
    if (text.startsWith("/start")) {
      const supabase = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc("upsert_telegram_user", {
        p_telegram_id: from.id,
        p_first_name:  from.first_name,
        p_last_name:   from.last_name  ?? "",
        p_username:    from.username,
        p_avatar_url:  null,
      });

      const name = from.first_name;

      await sendMessage(
        chat.id,
        `Привет, <b>${name}</b>! 👋\n\n` +
        `Добро пожаловать в <b>Svoi</b> — доску объявлений для русскоязычных в Белграде.\n\n` +
        `🏷 Продавайте ненужные вещи\n` +
        `🔍 Находите нужное рядом\n` +
        `💬 Договаривайтесь напрямую\n\n` +
        `Нажмите кнопку ниже, чтобы открыть приложение:`,
        {
          inline_keyboard: [[
            {
              text:    "Открыть Svoi →",
              web_app: { url: APP_URL },
            },
          ]],
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bot webhook]", err);
    return NextResponse.json({ ok: true });
  }
}
