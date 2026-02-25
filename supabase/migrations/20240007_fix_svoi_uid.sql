-- Fix svoi_uid(): read svoi_user_id from user_metadata (nested in JWT)
-- Supabase stores custom user_metadata under the 'user_metadata' key in JWT,
-- not at the top level. The original function was reading the wrong path.
--
-- Run this in Supabase Dashboard → SQL Editor

create or replace function public.svoi_uid() returns uuid
  language sql stable security definer
  set search_path = public
  as $$
    select nullif(
      coalesce(
        -- user_metadata path (Telegram auth sets svoi_user_id here)
        current_setting('request.jwt.claims', true)::json->'user_metadata'->>'svoi_user_id',
        -- app_metadata path (fallback, in case it was set there)
        current_setting('request.jwt.claims', true)::json->'app_metadata'->>'svoi_user_id'
      ),
      ''
    )::uuid
  $$;
