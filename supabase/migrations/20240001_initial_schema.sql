-- Svoi — Initial database schema
-- Run: supabase db push  (or paste in Supabase SQL editor)

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists postgis;   -- lat/lng + geospatial queries
create extension if not exists pg_trgm;  -- fuzzy text search fallback

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- One row per person. Can be created via Telegram InitData or Google OAuth.
create table public.users (
  id                uuid primary key default uuid_generate_v4(),
  -- Supabase Auth user id (null until linked)
  auth_id           uuid references auth.users(id) on delete set null,
  -- Telegram identity
  telegram_id       bigint unique,
  telegram_username text,
  -- Profile
  first_name        text not null default '',
  last_name         text not null default '',
  email             text,
  phone             text,
  avatar_url        text,
  -- Location (free text + optional geo)
  location          text,                          -- e.g. "Нови Београд, Блок 45"
  location_lat      double precision,
  location_lng      double precision,
  -- Onboarding
  completed_profile boolean not null default false,
  -- Meta
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Index for fast Telegram lookups (used on every Mini App open)
create index users_telegram_id_idx on public.users(telegram_id);
create index users_auth_id_idx on public.users(auth_id);

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
create table public.categories (
  id         serial primary key,
  name       text not null,
  slug       text not null unique,
  emoji      text,                   -- shown in carousel cards
  parent_id  int references public.categories(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Seed: 8 main categories for MVP
insert into public.categories (name, slug, emoji, sort_order) values
  ('Аренда жилья',      'rent',       '🏠', 1),
  ('Работа',            'jobs',       '💼', 2),
  ('Продажа вещей',     'stuff',      '📦', 3),
  ('Услуги',            'services',   '🔧', 4),
  ('Авто и транспорт',  'transport',  '🚗', 5),
  ('Обучение',          'education',  '📚', 6),
  ('Прогулки и встречи','meetups',    '☕', 7),
  ('Разное',            'misc',       '✨', 8);

-- ─── LISTINGS ─────────────────────────────────────────────────────────────────
create type listing_status as enum ('active', 'paused', 'sold', 'deleted');

create table public.listings (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  category_id int  not null references public.categories(id),
  -- Content
  title       text not null,
  description text,
  price       numeric(12, 2),              -- null = "договорная"
  currency    text not null default 'EUR', -- EUR | RSD | USD
  -- Location
  address     text,
  lat         double precision,
  lng         double precision,
  geo         geography(Point, 4326),      -- PostGIS point, auto-updated via trigger
  -- Media
  images      jsonb not null default '[]', -- array of {url, width, height}
  -- State
  status      listing_status not null default 'active',
  views       int not null default 0,
  -- For meetups category: event date
  event_date  timestamptz,
  -- Meta
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Spatial index for map queries
create index listings_geo_idx on public.listings using gist(geo);
-- Composite index for homepage feed
create index listings_status_created_idx on public.listings(status, created_at desc);
-- User's own listings
create index listings_user_id_idx on public.listings(user_id);

-- Auto-update geo from lat/lng on insert/update
create or replace function update_listing_geo()
returns trigger language plpgsql as $$
begin
  if new.lat is not null and new.lng is not null then
    new.geo := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger listings_geo_trigger
  before insert or update on public.listings
  for each row execute function update_listing_geo();

-- ─── CHATS ────────────────────────────────────────────────────────────────────
create table public.chats (
  id         uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user1_id   uuid not null references public.users(id) on delete cascade, -- listing owner
  user2_id   uuid not null references public.users(id) on delete cascade, -- buyer/enquirer
  created_at timestamptz not null default now(),
  -- One chat per (listing, buyer) pair
  unique(listing_id, user2_id)
);

create index chats_user1_idx on public.chats(user1_id);
create index chats_user2_idx on public.chats(user2_id);

-- ─── MESSAGES ─────────────────────────────────────────────────────────────────
create table public.messages (
  id         uuid primary key default uuid_generate_v4(),
  chat_id    uuid not null references public.chats(id) on delete cascade,
  sender_id  uuid not null references public.users(id) on delete cascade,
  text       text,
  image_url  text,                   -- optional attached image
  read_at    timestamptz,            -- null = unread
  created_at timestamptz not null default now(),
  -- Either text or image must be present
  check (text is not null or image_url is not null)
);

-- Index for real-time chat queries
create index messages_chat_id_created_idx on public.messages(chat_id, created_at asc);

-- ─── FAVORITES ────────────────────────────────────────────────────────────────
create table public.favorites (
  user_id    uuid not null references public.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, listing_id)
);

-- ─── BOOSTS ───────────────────────────────────────────────────────────────────
-- Paid feature: a listing stays at the top until until_date
create table public.boosts (
  id         serial primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  until_date timestamptz not null,
  created_at timestamptz not null default now()
);

create index boosts_listing_idx on public.boosts(listing_id, until_date desc);

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function touch_updated_at();
