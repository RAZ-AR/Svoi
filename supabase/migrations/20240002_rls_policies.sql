-- Svoi — Row Level Security policies
-- Every table is locked down; access is granted by explicit policies.

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────
alter table public.users     enable row level security;
alter table public.categories enable row level security;
alter table public.listings  enable row level security;
alter table public.chats     enable row level security;
alter table public.messages  enable row level security;
alter table public.favorites enable row level security;
alter table public.boosts    enable row level security;

-- ─── Helper: get current svoi user id from JWT ────────────────────────────────
-- We store svoi user.id in the JWT custom claim "svoi_user_id"
-- Placed in public schema (auth schema not writable on Supabase cloud)
create or replace function public.svoi_uid() returns uuid
  language sql stable security definer
  as $$
    select nullif(
      current_setting('request.jwt.claims', true)::json->>'svoi_user_id',
      ''
    )::uuid
  $$;

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Anyone can read public profile info (name, avatar, telegram_username)
create policy "users: public read"
  on public.users for select
  using (true);

-- Only the owner can update their own profile
create policy "users: owner update"
  on public.users for update
  using (id = public.svoi_uid());

-- Insert only via service role (done server-side in upsert_telegram_user)
-- No direct client inserts allowed.

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
-- Read-only for everyone; managed by admins via service role
create policy "categories: public read"
  on public.categories for select
  using (true);

-- ─── LISTINGS ─────────────────────────────────────────────────────────────────
-- Everyone can read active listings
create policy "listings: public read active"
  on public.listings for select
  using (status = 'active');

-- Owner can read their own listings regardless of status
create policy "listings: owner read own"
  on public.listings for select
  using (user_id = public.svoi_uid());

-- Authenticated users can create listings
create policy "listings: authenticated insert"
  on public.listings for insert
  with check (user_id = public.svoi_uid() and public.svoi_uid() is not null);

-- Owner can update their own listing
create policy "listings: owner update"
  on public.listings for update
  using (user_id = public.svoi_uid());

-- Owner can soft-delete (status = 'deleted') — no hard delete from client
create policy "listings: owner soft delete"
  on public.listings for update
  using (user_id = public.svoi_uid());

-- ─── CHATS ────────────────────────────────────────────────────────────────────
-- Only the two participants can see their chat
create policy "chats: participants read"
  on public.chats for select
  using (user1_id = public.svoi_uid() or user2_id = public.svoi_uid());

-- Authenticated users can start a chat (as user2)
create policy "chats: buyer insert"
  on public.chats for insert
  with check (user2_id = public.svoi_uid() and public.svoi_uid() is not null);

-- ─── MESSAGES ─────────────────────────────────────────────────────────────────
-- Only chat participants can read messages
create policy "messages: participants read"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id
        and (c.user1_id = public.svoi_uid() or c.user2_id = public.svoi_uid())
    )
  );

-- Participants can send messages
create policy "messages: participants insert"
  on public.messages for insert
  with check (
    sender_id = public.svoi_uid()
    and exists (
      select 1 from public.chats c
      where c.id = chat_id
        and (c.user1_id = public.svoi_uid() or c.user2_id = public.svoi_uid())
    )
  );

-- ─── FAVORITES ────────────────────────────────────────────────────────────────
create policy "favorites: owner read"
  on public.favorites for select
  using (user_id = public.svoi_uid());

create policy "favorites: owner insert"
  on public.favorites for insert
  with check (user_id = public.svoi_uid() and public.svoi_uid() is not null);

create policy "favorites: owner delete"
  on public.favorites for delete
  using (user_id = public.svoi_uid());

-- ─── BOOSTS ───────────────────────────────────────────────────────────────────
-- Publicly readable (to know which listings are boosted)
create policy "boosts: public read"
  on public.boosts for select
  using (true);

-- Inserts only via service role (after payment confirmation)
