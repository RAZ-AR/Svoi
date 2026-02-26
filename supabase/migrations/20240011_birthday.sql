-- Svoi — Add birthday field to users
ALTER TABLE public.users
  ADD COLUMN birthday date;
