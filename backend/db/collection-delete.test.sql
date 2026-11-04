-- Run only against the disposable fixture schema after applying both migrations.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE env text;
BEGIN
 FOREACH env IN ARRAY ARRAY['dev', 'prod'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = format('public.%I', env || '_movies_collections')::regclass
   AND confrelid = format('public.%I', env || '_collections')::regclass AND confdeltype = 'c') THEN
   RAISE EXCEPTION 'Missing cascading collection foreign key for %', env;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid IN (format('public.%I', env || '_movies')::regclass,
   format('public.%I', env || '_tv_shows')::regclass) AND attname = 'poster_path' AND attnotnull) THEN
   RAISE EXCEPTION 'Posters must be nullable for %', env;
  END IF;
 END LOOP;
END $$;
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
DO $$
DECLARE env text;
BEGIN
 FOREACH env IN ARRAY ARRAY['dev', 'prod'] LOOP
  EXECUTE format('INSERT INTO public.%I(id,user_id,name) VALUES
   (''10000000-0000-0000-0000-000000000001'',''00000000-0000-0000-0000-000000000001'',''delete''),
   (''10000000-0000-0000-0000-000000000002'',''00000000-0000-0000-0000-000000000001'',''rollback''),
   (''10000000-0000-0000-0000-000000000003'',''00000000-0000-0000-0000-000000000002'',''other user'')', env || '_collections');
  EXECUTE format('INSERT INTO public.%I(id,title,poster_path) VALUES (1,''posterless movie'',NULL),(2,''artwork'',''/poster.jpg'')', env || '_movies');
  EXECUTE format('INSERT INTO public.%I(id,title,poster_path) VALUES (1,''posterless TV'',NULL)', env || '_tv_shows');
  EXECUTE format('INSERT INTO public.%I(movie_id,tv_show_id,user_id,collection_id,notes,is_tv_show)
   SELECT CASE WHEN tv THEN NULL ELSE 1 END, CASE WHEN tv THEN 1 ELSE NULL END,
    c.user_id, c.id, CASE WHEN tv THEN ''TV note'' ELSE ''movie note'' END, tv
   FROM public.%I c CROSS JOIN (VALUES (false),(true)) AS media(tv)', env || '_movies_collections', env || '_collections');
 END LOOP;
END $$;
CREATE FUNCTION pg_temp.fail_collection_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.name = 'rollback' THEN RAISE EXCEPTION 'injected delete failure' USING ERRCODE = '23514'; END IF;
 RETURN OLD;
END $$;
CREATE TRIGGER zz_injected_failure AFTER DELETE ON public.dev_collections FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_collection_delete();
CREATE TRIGGER zz_injected_failure AFTER DELETE ON public.prod_collections FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_collection_delete();
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
SET LOCAL ROLE authenticated;
DO $$
DECLARE env text; affected integer;
BEGIN
 FOREACH env IN ARRAY ARRAY['dev', 'prod'] LOOP
  EXECUTE format('DELETE FROM public.%I WHERE id = ''10000000-0000-0000-0000-000000000003''', env || '_collections');
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'RLS allowed deleting another user collection'; END IF;
  EXECUTE format('DELETE FROM public.%I WHERE id = ''10000000-0000-0000-0000-000000000001''', env || '_collections');
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Owned collection was not deleted'; END IF;
  BEGIN
   EXECUTE format('DELETE FROM public.%I WHERE id = ''10000000-0000-0000-0000-000000000002''', env || '_collections');
   RAISE EXCEPTION 'Expected injected failure';
  EXCEPTION WHEN check_violation THEN
   IF SQLERRM <> 'injected delete failure' THEN RAISE; END IF;
  END;
 END LOOP;
END $$;
RESET ROLE;
DO $$
DECLARE env text; remaining integer;
BEGIN
 FOREACH env IN ARRAY ARRAY['dev', 'prod'] LOOP
  EXECUTE format('SELECT count(*) FROM public.%I', env || '_collections') INTO remaining;
  IF remaining <> 2 THEN RAISE EXCEPTION 'Parent delete/rollback failed for %', env; END IF;
  EXECUTE format('SELECT count(*) FROM public.%I WHERE collection_id = ''10000000-0000-0000-0000-000000000001''', env || '_movies_collections') INTO remaining;
  IF remaining <> 0 THEN RAISE EXCEPTION 'Cascade left deleted collection entries for %', env; END IF;
  EXECUTE format('SELECT count(*) FROM public.%I WHERE collection_id IN (
   ''10000000-0000-0000-0000-000000000002'', ''10000000-0000-0000-0000-000000000003'')
   AND notes = CASE WHEN is_tv_show THEN ''TV note'' ELSE ''movie note'' END', env || '_movies_collections') INTO remaining;
  IF remaining <> 4 THEN RAISE EXCEPTION 'Rollback or isolation lost notes for %', env; END IF;
 END LOOP;
END $$;
ROLLBACK;
