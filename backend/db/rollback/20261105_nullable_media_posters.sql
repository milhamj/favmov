-- Intentionally fails if posterless rows now exist. Never invent artwork or delete user data to roll back.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.dev_movies ALTER COLUMN poster_path SET NOT NULL;
ALTER TABLE public.dev_tv_shows ALTER COLUMN poster_path SET NOT NULL;
ALTER TABLE public.prod_movies ALTER COLUMN poster_path SET NOT NULL;
ALTER TABLE public.prod_tv_shows ALTER COLUMN poster_path SET NOT NULL;
COMMIT;
