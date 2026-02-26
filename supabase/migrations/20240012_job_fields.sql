-- Svoi — Job listing fields + files bucket for resumes

-- ─── Job-specific columns on listings ─────────────────────────────────────────
ALTER TABLE public.listings
  ADD COLUMN job_type         text CHECK (job_type IN ('seeking', 'offering')),
  ADD COLUMN job_sphere       text,          -- Сфера: IT, Дизайн, Строительство…
  ADD COLUMN job_experience   text,          -- Опыт: no_exp | 1_3 | 3_5 | 5_plus
  ADD COLUMN job_company      text,          -- Название компании (для offering)
  ADD COLUMN job_website      text,          -- Сайт компании (для offering)
  ADD COLUMN job_position     text,          -- Позиция/должность (для offering)
  ADD COLUMN job_requirements text,          -- Требования (для offering)
  ADD COLUMN job_resume_url   text;          -- PDF резюме (для seeking)

-- Index for fast job listing queries
CREATE INDEX listings_job_type_idx ON public.listings (job_type)
  WHERE job_type IS NOT NULL;

-- ─── Files bucket for resumes ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  true,
  10485760,  -- 10 MB
  array['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "files: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'files');

CREATE POLICY "files: authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'files'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "files: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'files'
    AND auth.role() = 'authenticated'
  );
