-- Svoi — Telegram authentication server function
-- Called from Next.js Server Action after verifying InitData HMAC signature.
-- Uses service role — never exposed to client.

-- ─── upsert_telegram_user ─────────────────────────────────────────────────────
-- Creates or updates a user from Telegram InitData.
-- Returns: {id, telegram_id, first_name, completed_profile, is_new_user}
create or replace function public.upsert_telegram_user(
  p_telegram_id   bigint,
  p_first_name    text,
  p_last_name     text default '',
  p_username      text default null,
  p_avatar_url    text default null
)
returns json
language plpgsql
security definer  -- runs as postgres superuser, bypasses RLS
set search_path = public
as $$
declare
  v_user         public.users;
  v_is_new_user  boolean := false;
begin
  -- Try to find existing user
  select * into v_user
  from public.users
  where telegram_id = p_telegram_id;

  if not found then
    -- First-time user: create record
    v_is_new_user := true;
    insert into public.users (
      telegram_id,
      first_name,
      last_name,
      telegram_username,
      avatar_url,
      completed_profile
    ) values (
      p_telegram_id,
      p_first_name,
      coalesce(p_last_name, ''),
      p_username,
      p_avatar_url,
      false
    )
    returning * into v_user;
  else
    -- Returning user: refresh Telegram data (name/avatar may change)
    update public.users
    set
      first_name        = coalesce(nullif(p_first_name, ''), first_name),
      last_name         = coalesce(p_last_name, last_name),
      telegram_username = coalesce(p_username, telegram_username),
      avatar_url        = coalesce(p_avatar_url, avatar_url),
      updated_at        = now()
    where id = v_user.id
    returning * into v_user;
  end if;

  return json_build_object(
    'id',                v_user.id,
    'telegram_id',       v_user.telegram_id,
    'first_name',        v_user.first_name,
    'last_name',         v_user.last_name,
    'telegram_username', v_user.telegram_username,
    'avatar_url',        v_user.avatar_url,
    'completed_profile', v_user.completed_profile,
    'is_new_user',       v_is_new_user
  );
end;
$$;

-- ─── get_nearby_listings ──────────────────────────────────────────────────────
-- Returns active listings within `p_radius_km` kilometers of a point.
-- Used by the map view.
create or replace function public.get_nearby_listings(
  p_lat       double precision,
  p_lng       double precision,
  p_radius_km double precision default 10,
  p_category  text default null,
  p_limit     int  default 50
)
returns setof public.listings
language sql stable
as $$
  select l.*
  from public.listings l
  join public.categories c on c.id = l.category_id
  where
    l.status = 'active'
    and l.geo is not null
    and st_dwithin(
      l.geo,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000  -- convert km → meters
    )
    and (p_category is null or c.slug = p_category)
  order by
    st_distance(l.geo, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) asc
  limit p_limit;
$$;

-- ─── increment_listing_views ──────────────────────────────────────────────────
create or replace function public.increment_listing_views(p_listing_id uuid)
returns void language sql as $$
  update public.listings
  set views = views + 1
  where id = p_listing_id and status = 'active';
$$;
