-- Svoi — Enable Supabase Realtime for messages table
-- Allows clients to subscribe to new messages in real-time

-- Add messages table to the realtime publication
alter publication supabase_realtime add table public.messages;

-- Optional: also publish listings changes (for future features)
alter publication supabase_realtime add table public.listings;
