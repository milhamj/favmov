-- Disposable PostgreSQL only. Adapted from the owner's schema; not a Supabase deployment script.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA auth;
CREATE ROLE authenticated NOLOGIN;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA auth TO authenticated;
DO $$
DECLARE env text;
BEGIN
 FOREACH env IN ARRAY ARRAY['dev', 'prod'] LOOP
  EXECUTE format('CREATE TABLE public.%I (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
   user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id), name varchar NOT NULL
  )', env || '_collections');
  EXECUTE format('CREATE TABLE public.%I (
   uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(), id bigint NOT NULL UNIQUE,
   created_at timestamptz NOT NULL DEFAULT now(), title text NOT NULL, poster_path text NOT NULL,
   rating double precision, rating_count bigint, release_date varchar, updated_at timestamptz
  )', env || '_movies');
  EXECUTE format('CREATE TABLE public.%I (LIKE public.%I INCLUDING ALL)', env || '_tv_shows', env || '_movies');
  EXECUTE format('CREATE TABLE public.%I (
   id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, movie_id bigint REFERENCES public.%I(id),
   user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id), collection_id uuid,
   notes text, is_tv_show boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
   tv_show_id bigint REFERENCES public.%I(id), CONSTRAINT %I FOREIGN KEY (collection_id) REFERENCES public.%I(id)
  )', env || '_movies_collections', env || '_movies', env || '_tv_shows',
   CASE WHEN env = 'dev' THEN 'dev_movies_collections_collection_id_fkey' ELSE 'prod_movie_collections_collection_id_fkey' END,
   env || '_collections');
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', env || '_collections');
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', env || '_movies_collections');
  EXECUTE format('CREATE POLICY own_select ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', env || '_collections');
  EXECUTE format('CREATE POLICY own_delete ON public.%I FOR DELETE USING (auth.uid() = user_id)', env || '_collections');
  EXECUTE format('CREATE POLICY own_select ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', env || '_movies_collections');
  EXECUTE format('CREATE POLICY own_delete ON public.%I FOR DELETE USING (auth.uid() = user_id)', env || '_movies_collections');
  EXECUTE format('GRANT SELECT, DELETE ON public.%I, public.%I TO authenticated', env || '_collections', env || '_movies_collections');
 END LOOP;
END $$;
COMMIT;
