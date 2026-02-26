// Svoi — One-time Telegram MTProto session generator
// Run ONCE to get your TELEGRAM_SESSION string, then add it to .env.local
//
// Prerequisites:
//   1. Go to https://my.telegram.org → API development tools
//   2. Create an app → get API_ID and API_HASH
//   3. Add to .env.local:
//        TELEGRAM_API_ID=your_id
//        TELEGRAM_API_HASH=your_hash
//
// Usage:
//   npx tsx scripts/tg-session.ts
//
// Then copy the TELEGRAM_SESSION= line into your .env.local

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import * as readline from "readline";

const API_ID   = Number(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH ?? "";

if (!API_ID || !API_HASH) {
  console.error("❌  Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env.local first");
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (prompt: string) =>
  new Promise<string>((resolve) => rl.question(prompt, resolve));

async function main() {
  console.log("\n🔐  Telegram session generator\n");

  const client = new TelegramClient(new StringSession(""), API_ID, API_HASH, {
    connectionRetries: 3,
  });

  await client.start({
    phoneNumber:  async () => ask("📱 Phone number (with country code, e.g. +7999...): "),
    password:     async () => ask("🔑 2FA password (press Enter if none): "),
    phoneCode:    async () => ask("📟 Code from Telegram: "),
    onError:      (err) => console.error("Error:", err),
  });

  const sessionString = String(client.session.save());

  console.log("\n✅  Session created! Add this line to your .env.local:\n");
  console.log(`TELEGRAM_SESSION="${sessionString}"\n`);

  rl.close();
  await client.disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
