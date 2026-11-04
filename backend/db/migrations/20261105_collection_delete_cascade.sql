-- Apply before deploying the parent-only delete controller. Does not repair/delete orphan data.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.dev_collections, public.prod_collections,
 public.dev_movies_collections, public.prod_movies_collections IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM public.dev_movies_collections child WHERE child.collection_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.dev_collections parent WHERE parent.id = child.collection_id)) THEN
  RAISE EXCEPTION 'dev_movies_collections has orphan collection_id values; investigate before migrating';
 END IF;
 IF EXISTS (SELECT 1 FROM public.prod_movies_collections child WHERE child.collection_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.prod_collections parent WHERE parent.id = child.collection_id)) THEN
  RAISE EXCEPTION 'prod_movies_collections has orphan collection_id values; investigate before migrating';
 END IF;
END $$;
ALTER TABLE public.dev_movies_collections
 DROP CONSTRAINT dev_movies_collections_collection_id_fkey,
 ADD CONSTRAINT dev_movies_collections_collection_id_fkey FOREIGN KEY (collection_id)
 REFERENCES public.dev_collections(id) ON DELETE CASCADE;
ALTER TABLE public.prod_movies_collections
 DROP CONSTRAINT prod_movie_collections_collection_id_fkey,
 ADD CONSTRAINT prod_movie_collections_collection_id_fkey FOREIGN KEY (collection_id)
 REFERENCES public.prod_collections(id) ON DELETE CASCADE;
COMMIT;
