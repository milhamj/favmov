# Database changes for collection deletion and posterless titles

The owner supplied development/production table definitions on 2026-11-05. They
confirm NO ACTION collection foreign keys and NOT NULL poster paths. These scripts
use the supplied names, including the singular `prod_movie_collections_collection_id_fkey`.
They do not change ownership policies, other foreign keys, or existing row values.

## Deployment order

1. Review the schema and any live custom triggers. Trigger definitions were not
   supplied; local tests cannot establish their production behavior. Take a backup
   and choose a maintenance window: ALTER TABLE needs locks. The scripts abort if
   they cannot acquire a lock within five seconds; investigate and retry later.
2. Apply all three migrations **before deploying this API/frontend**:

   ```sh
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/20261105_collection_delete_cascade.sql
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/20261105_nullable_media_posters.sql
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/20261105_unique_collection_entries.sql
   ```

   Each script is transactional and changes both dev and prod tables in the
   selected database. They can also be run as SQL in Supabase's SQL Editor. The
   cascade migration checks for orphan references under table locks and stops
   with a diagnostic; it never deletes or repairs inconsistent rows. The unique
   entries migration likewise stops on existing duplicates and names the key. Pick
   which row's notes to keep by hand, then rerun it.
3. Deploy the API, then the frontend. The API deletes only the owned parent row;
   PostgreSQL deletes its entries in the same statement. Without the cascade
   migration, existing foreign keys reject deletion of populated collections
   instead of partially emptying them. Without the nullable-poster migration,
   posterless inserts still fail their database constraint.

Read-only custom trigger inspection (repeat for dev/prod as needed):

```sql
SELECT c.relname AS table_name, t.tgname, pg_get_triggerdef(t.oid)
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND c.relname IN ('dev_collections', 'prod_collections',
    'dev_movies_collections', 'prod_movies_collections', 'dev_movies',
    'prod_movies', 'dev_tv_shows', 'prod_tv_shows');
```

## Rollback

Revert the application first. The files under `rollback/` restore the supplied
NO ACTION collection constraints and NOT NULL poster columns, and drop the unique
entry indexes. Run each with
`psql ... -v ON_ERROR_STOP=1 -f ...`. Poster rollback intentionally fails if any
posterless row now exists; it leaves all four columns nullable and does not invent
artwork or delete titles. Keeping the nullable columns is compatible with the old
application and is safer than forced data repair. Application rollback alone does
not revert database constraints.

## Disposable PostgreSQL checks

Run from the repository root. Never run `test-schema.sql` or the test scripts in
Supabase or any database containing data you care about. The fixture is an adapted,
dependency-ordered test schema with a minimal `auth.uid()` implementation and the
relevant SELECT/DELETE policies; it does not emulate all Supabase services, custom
triggers, grants, or insert/update policies. No live schema export is executed.
The container uses local trust authentication with no published port.

```sh
docker run -d --rm --name favmov-db-test -e POSTGRES_HOST_AUTH_METHOD=trust \
  -v "$PWD/backend/db:/work:ro" postgres:17-alpine
docker exec favmov-db-test pg_isready -U postgres
# Continue only after pg_isready reports accepting connections.
docker exec favmov-db-test psql -U postgres -v ON_ERROR_STOP=1 -f /work/test-schema.sql
docker exec favmov-db-test psql -U postgres -v ON_ERROR_STOP=1 -f /work/migration-orphans.test.sql
docker exec favmov-db-test psql -U postgres -v ON_ERROR_STOP=1 -f /work/migrations/20261105_collection_delete_cascade.sql
docker exec favmov-db-test psql -U postgres -v ON_ERROR_STOP=1 -f /work/migrations/20261105_nullable_media_posters.sql
docker exec favmov-db-test psql -U postgres -v ON_ERROR_STOP=1 -f /work/migrations/20261105_unique_collection_entries.sql
docker exec favmov-db-test psql -U postgres -v ON_ERROR_STOP=1 -f /work/collection-delete.test.sql
docker exec favmov-db-test psql -U postgres -v ON_ERROR_STOP=1 -f /work/collection-unique.test.sql
(cd backend && pnpm test)
docker stop favmov-db-test
```

`migration-orphans.test.sql` deliberately provokes migration errors, then asserts
that neither constraint changed and the orphan row was preserved. Its exit status
is zero only if those assertions and fixture cleanup succeed. The main SQL test
rolls back its fixtures and injected triggers. It verifies both environments:
movie/TV cascade, preserved notes after an injected AFTER DELETE failure, another
user's rows and RLS isolation, and inserts with null and nonempty poster paths.

To check rollback/reapply on this disposable fixture, run the rollback files,
reapply the migrations, and repeat `collection-delete.test.sql` before stopping
the container. These checks passed locally on PostgreSQL 17; no Supabase migration
has been applied by the coding agent.
