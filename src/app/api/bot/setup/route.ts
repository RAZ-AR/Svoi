// Svoi — Register Telegram webhook
// GET /api/bot/setup  ← call once after deploy to register webhook URL with Telegram
import { NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl || appUrl.includes("localhost")) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL must be a public HTTPS URL, not localhost" },
      { status: 400 }
    );
  }

  const webhookUrl = `${appUrl}/api/bot`;

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url:             webhookUrl,
        allowed_updates: ["message", "channel_post", "callback_query"],
      }),
    }
  );

  const data = await res.json();

  return NextResponse.json({
    webhook_url: webhookUrl,
    telegram:    data,
  });
}
