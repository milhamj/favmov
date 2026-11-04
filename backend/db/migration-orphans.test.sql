-- Disposable test-schema.sql database only, before applying the cascade migration.
\set ON_ERROR_STOP on
BEGIN;
ALTER TABLE public.dev_movies_collections DROP CONSTRAINT dev_movies_collections_collection_id_fkey;
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000099');
INSERT INTO public.dev_movies_collections(user_id,collection_id,notes)
 VALUES ('00000000-0000-0000-0000-000000000099','99999999-0000-0000-0000-000000000099','must not be repaired');
ALTER TABLE public.dev_movies_collections ADD CONSTRAINT dev_movies_collections_collection_id_fkey
 FOREIGN KEY (collection_id) REFERENCES public.dev_collections(id) NOT VALID;
COMMIT;
-- Expected failure: psql must continue so we can assert migration rollback preserved the data/constraints.
\set ON_ERROR_STOP off
\ir migrations/20261105_collection_delete_cascade.sql
\set ON_ERROR_STOP on
DO $$
BEGIN
 IF (SELECT count(*) FROM public.dev_movies_collections WHERE notes = 'must not be repaired') <> 1 THEN
  RAISE EXCEPTION 'Migration changed orphan data';
 END IF;
 IF (SELECT count(*) FROM pg_constraint WHERE conname IN (
  'dev_movies_collections_collection_id_fkey', 'prod_movie_collections_collection_id_fkey') AND confdeltype = 'a') <> 2 THEN
  RAISE EXCEPTION 'Orphan migration did not roll back both constraints';
 END IF;
END $$;
BEGIN;
DELETE FROM public.dev_movies_collections WHERE user_id = '00000000-0000-0000-0000-000000000099';
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000099';
ALTER TABLE public.dev_movies_collections VALIDATE CONSTRAINT dev_movies_collections_collection_id_fkey;
COMMIT;
