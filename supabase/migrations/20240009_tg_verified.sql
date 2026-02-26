-- Svoi — Telegram: verified author flag + fix unique index for upsert

-- Add verified author column
ALTER TABLE public.listings
  ADD COLUMN tg_author_verified boolean NOT NULL DEFAULT false;

-- Replace partial unique index with full one (required for Supabase upsert)
-- NULL values never conflict in PostgreSQL unique indexes, so this is safe
DROP INDEX IF EXISTS listings_tg_dedup_idx;
CREATE UNIQUE INDEX listings_tg_dedup_idx
  ON public.listings (tg_channel, tg_message_id);

-- Index for fast "verified" badge lookup
CREATE INDEX listings_tg_verified_idx
  ON public.listings (tg_channel, tg_author_verified)
  WHERE tg_channel IS NOT NULL;
