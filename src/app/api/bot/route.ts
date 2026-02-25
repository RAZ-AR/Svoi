// Svoi — Telegram Bot webhook handler
// POST /api/bot  ← registered as Telegram webhook URL
"use server";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL || "https://svoi-lac.vercel.app";

// ─── Telegram API helper ──────────────────────────────────────────────────────

async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: object
) {
  const body: Record<string, unknown> = {
    chat_id:    chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
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
      // Register (or refresh) user in our database using Telegram data
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

    // Always return 200 — Telegram retries on any other status
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bot webhook]", err);
    return NextResponse.json({ ok: true });
  }
}
