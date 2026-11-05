BEGIN;
SET LOCAL lock_timeout = '5s';
DROP INDEX public.dev_movies_collections_movie_key;
DROP INDEX public.dev_movies_collections_tv_show_key;
DROP INDEX public.prod_movies_collections_movie_key;
DROP INDEX public.prod_movies_collections_tv_show_key;
COMMIT;
