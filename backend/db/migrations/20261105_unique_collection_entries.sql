-- Retried adds can race, and duplicate entries break note saves. Fails without changes if duplicates already exist.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE UNIQUE INDEX dev_movies_collections_movie_key ON public.dev_movies_collections (collection_id, movie_id) WHERE movie_id IS NOT NULL;
CREATE UNIQUE INDEX dev_movies_collections_tv_show_key ON public.dev_movies_collections (collection_id, tv_show_id) WHERE tv_show_id IS NOT NULL;
CREATE UNIQUE INDEX prod_movies_collections_movie_key ON public.prod_movies_collections (collection_id, movie_id) WHERE movie_id IS NOT NULL;
CREATE UNIQUE INDEX prod_movies_collections_tv_show_key ON public.prod_movies_collections (collection_id, tv_show_id) WHERE tv_show_id IS NOT NULL;
COMMIT;
