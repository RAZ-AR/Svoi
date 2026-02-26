-- Svoi — Telegram channel import tracking
-- Adds source metadata to listings so we can:
--   1. Deduplicate imports (run script N times, no duplicates)
--   2. Show attribution badge linking to the original post
--   3. Notify original author when requested

ALTER TABLE public.listings
  ADD COLUMN tg_channel         text,        -- e.g. 'belgrad_serbia'
  ADD COLUMN tg_message_id      bigint,      -- original Telegram message ID
  ADD COLUMN tg_author_id       bigint,      -- Telegram user ID of original poster (null for anonymous channels)
  ADD COLUMN tg_author_username text,        -- username of original poster (optional)
  ADD COLUMN tg_notified_at     timestamptz; -- null = not yet notified

-- Unique constraint: same channel + same message_id = no duplicate import
-- ON CONFLICT (tg_channel, tg_message_id) DO NOTHING handles idempotency
CREATE UNIQUE INDEX listings_tg_dedup_idx
  ON public.listings (tg_channel, tg_message_id)
  WHERE tg_channel IS NOT NULL;

-- Fast lookup for the notify script (find un-notified imported listings)
CREATE INDEX listings_tg_notify_idx
  ON public.listings (tg_channel, created_at DESC)
  WHERE tg_channel IS NOT NULL AND tg_notified_at IS NULL;
