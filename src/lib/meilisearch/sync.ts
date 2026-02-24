// Svoi — Meilisearch index sync helpers
// Called after listing create/update/delete

import { MeiliSearch } from "meilisearch";

function getClient() {
  const host   = process.env.NEXT_PUBLIC_MEILISEARCH_HOST;
  const apiKey = process.env.MEILISEARCH_ADMIN_KEY;
  if (!host || !apiKey) return null;
  return new MeiliSearch({ host, apiKey });
}

/** Index or update a listing document in Meilisearch */
export async function indexListing(doc: Record<string, unknown>) {
  const client = getClient();
  if (!client) return;

  try {
    const index = client.index("listings");
    await index.addDocuments([doc], { primaryKey: "id" });
  } catch (err) {
    console.error("[meilisearch:index]", err);
  }
}

/** Remove a listing from the Meilisearch index */
export async function deindexListing(id: string) {
  const client = getClient();
  if (!client) return;

  try {
    const index = client.index("listings");
    await index.deleteDocument(id);
  } catch (err) {
    console.error("[meilisearch:deindex]", err);
  }
}

/**
 * Configure the listings index on first deploy.
 * Run once: import and call `setupMeilisearchIndex()` from a script or Supabase Edge Function.
 */
export async function setupMeilisearchIndex() {
  const client = getClient();
  if (!client) throw new Error("Meilisearch not configured");

  const index = client.index("listings");

  // Filterable attributes — used by FiltersSheet
  await index.updateFilterableAttributes([
    "status",
    "category_id",
    "currency",
    "price",
    "address",
    "user_id",
  ]);

  // Sortable attributes
  await index.updateSortableAttributes([
    "created_at",
    "price",
    "views",
  ]);

  // Searchable attributes — order matters (higher = more weight)
  await index.updateSearchableAttributes([
    "title",
    "description",
    "category_name",
    "address",
    "user_first_name",
  ]);

  // Typo tolerance settings
  await index.updateTypoTolerance({
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
  });

  console.log("[meilisearch] Index configured ✓");
}
