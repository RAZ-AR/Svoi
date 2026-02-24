-- Svoi — pg_trgm index for Supabase search fallback
-- Also: Postgres function to build Meilisearch document for a listing

-- Trigram indexes for fast ILIKE search (Supabase fallback)
create index if not exists listings_title_trgm_idx
  on public.listings using gin(title gin_trgm_ops);

create index if not exists listings_description_trgm_idx
  on public.listings using gin(description gin_trgm_ops);

-- ─── listing_to_search_doc ─────────────────────────────────────────────────
-- Returns a flat JSON document ready to index in Meilisearch.
-- Call via pg_net (realtime webhook) or Edge Function on insert/update.
create or replace function public.listing_to_search_doc(p_listing_id uuid)
returns json
language sql stable
as $$
  select json_build_object(
    'id',             l.id,
    'user_id',        l.user_id,
    'category_id',    l.category_id,
    'title',          l.title,
    'description',    l.description,
    'price',          l.price,
    'currency',       l.currency,
    'address',        l.address,
    'lat',            l.lat,
    'lng',            l.lng,
    'images',         l.images,
    'status',         l.status,
    'views',          l.views,
    'created_at',     extract(epoch from l.created_at)::bigint,
    -- Flattened joins for Meilisearch filtering
    'user_first_name',  u.first_name,
    'user_username',    u.telegram_username,
    'user_avatar',      u.avatar_url,
    'category_name',    c.name,
    'category_slug',    c.slug,
    'category_emoji',   c.emoji
  )
  from public.listings l
  join public.users      u on u.id = l.user_id
  join public.categories c on c.id = l.category_id
  where l.id = p_listing_id;
$$;
