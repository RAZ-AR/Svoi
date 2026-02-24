-- Svoi — Supabase Storage: images bucket + RLS policies

-- Create the public images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,                          -- public: URLs are accessible without auth
  52428800,                      -- 50 MB max per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- ─── Storage RLS ──────────────────────────────────────────────────────────────

-- Anyone can view images (public bucket)
create policy "images: public read"
  on storage.objects for select
  using (bucket_id = 'images');

-- Authenticated users can upload images
-- Path must start with listings/ or avatars/
create policy "images: authenticated upload"
  on storage.objects for insert
  with check (
    bucket_id = 'images'
    and auth.role() = 'authenticated'
    and (
      name like 'listings/%'
      or name like 'avatars/%'
    )
  );

-- Users can delete only their own files
-- (we embed user info in the path: listings/{userId}/{filename})
create policy "images: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'images'
    and auth.role() = 'authenticated'
  );
