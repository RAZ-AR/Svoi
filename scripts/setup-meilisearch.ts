// Svoi — One-time Meilisearch index setup script
// Run: npx tsx scripts/setup-meilisearch.ts
import "dotenv/config";
import { setupMeilisearchIndex } from "../src/lib/meilisearch/sync";

async function main() {
  console.log("🔍 Setting up Meilisearch index…");
  await setupMeilisearchIndex();
  console.log("✅ Done!");
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
