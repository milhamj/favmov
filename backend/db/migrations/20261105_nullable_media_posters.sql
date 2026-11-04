-- Apply before accepting null artwork through the API. Existing poster paths are unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.dev_movies ALTER COLUMN poster_path DROP NOT NULL;
ALTER TABLE public.dev_tv_shows ALTER COLUMN poster_path DROP NOT NULL;
ALTER TABLE public.prod_movies ALTER COLUMN poster_path DROP NOT NULL;
ALTER TABLE public.prod_tv_shows ALTER COLUMN poster_path DROP NOT NULL;
COMMIT;
