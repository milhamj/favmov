-- Revert the API controller before removing cascade support.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.dev_movies_collections
 DROP CONSTRAINT dev_movies_collections_collection_id_fkey,
 ADD CONSTRAINT dev_movies_collections_collection_id_fkey FOREIGN KEY (collection_id)
 REFERENCES public.dev_collections(id) ON DELETE NO ACTION;
ALTER TABLE public.prod_movies_collections
 DROP CONSTRAINT prod_movie_collections_collection_id_fkey,
 ADD CONSTRAINT prod_movie_collections_collection_id_fkey FOREIGN KEY (collection_id)
 REFERENCES public.prod_collections(id) ON DELETE NO ACTION;
COMMIT;
