-- Svoi — Multi-channel attribution
-- tg_sources stores all channels where the same listing appeared
-- Format: [{"channel": "avito_serbia", "message_id": 1234}, ...]
ALTER TABLE public.listings
  ADD COLUMN tg_sources jsonb NOT NULL DEFAULT '[]'::jsonb;
