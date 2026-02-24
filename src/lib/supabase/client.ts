// Svoi — Supabase browser client (for Client Components)
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Singleton browser client — safe to call multiple times */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
