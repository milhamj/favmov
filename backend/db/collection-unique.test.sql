-- Run only against the disposable fixture schema after applying the unique-entries migration.
\set ON_ERROR_STOP on
BEGIN;
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000009');
DO $$
DECLARE env text; col uuid; other uuid; rejected boolean;
BEGIN
 FOREACH env IN ARRAY ARRAY['dev', 'prod'] LOOP
  EXECUTE format('INSERT INTO public.%I(user_id,name) VALUES (''00000000-0000-0000-0000-000000000009'',''a'') RETURNING id', env || '_collections') INTO col;
  EXECUTE format('INSERT INTO public.%I(user_id,name) VALUES (''00000000-0000-0000-0000-000000000009'',''b'') RETURNING id', env || '_collections') INTO other;
  EXECUTE format('INSERT INTO public.%I(id,title) VALUES (9,''movie'')', env || '_movies');
  EXECUTE format('INSERT INTO public.%I(id,title) VALUES (9,''show'')', env || '_tv_shows');
  FOREACH rejected IN ARRAY ARRAY[false, true] LOOP
   DECLARE field text := CASE WHEN rejected THEN 'tv_show_id' ELSE 'movie_id' END;
   BEGIN
    EXECUTE format('INSERT INTO public.%I(%I,user_id,collection_id) VALUES (9,''00000000-0000-0000-0000-000000000009'',$1),(9,''00000000-0000-0000-0000-000000000009'',$2)', env || '_movies_collections', field) USING col, other;
    BEGIN
     EXECUTE format('INSERT INTO public.%I(%I,user_id,collection_id) VALUES (9,''00000000-0000-0000-0000-000000000009'',$1)', env || '_movies_collections', field) USING col;
     RAISE EXCEPTION 'Duplicate % entry accepted for %', field, env;
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
   END;
  END LOOP;
 END LOOP;
END $$;
ROLLBACK;
