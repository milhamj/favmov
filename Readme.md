# Pre-Requisite
### backend/.env
```
FAVMOV_PORT=3080
FAVMOV_NODE_ENV=development || production
FAVMOV_SUPABASE_URL=
FAVMOV_SUPABASE_ANON_KEY=
FAVMOV_TMDB_API_KEY= # plain TMDB read token, enables per-movie SEO tags and the media sync
FAVMOV_SUPABASE_S_KEY= # Supabase service key, enables the media sync. Keep it out of the frontend
```
```
pnpm run dev
```

The first request of each UTC day refreshes the stored movie and TV show data from TMDB in the background. Run it by hand with `pnpm run sync`.
The sync requests fresh TMDB data without the page-level cache or cooldown. Row failures do not stop later titles, but the manual command exits with a nonzero status after both tables finish if any rows failed.

### frontend/.env
```
FAVMOV_NODE_ENV=
FAVMOV_TMDB_API_KEY=
FAVMOV_SUPABASE_URL=
FAVMOV_SUPABASE_ANON_KEY=
FAVMOV_API_BASE_URL_LOCAL=http://localhost:3030/api
FAVMOV_API_BASE_URL_PROD=
```
```
pnpm run web
```
#### Export
```
pnpm exec expo export -p web
```
#### Clear build cache
```
rm -rf node_modules
rm -rf $HOME/Library/Caches/pnpm/dlx
rm -rf .expo .expo-shared dist node_modules/.pnpm

pnpm install
```

# TODOs

## FE
- [x] FE: Add activeTab param to Main stack navigation
- [x] FE: Fix redirect before and after login
- [x] FE: Fix logout
- [x] FE: Homepage - Add shimmering / loading state
- [x] FE: Search TV shows
- [x] FE: Bug - Main screen tab navigation using activeTab
- [x] FE: Collection detail page - Change UI so that the notes are shown
- [ ] FE: Trending & Popular list page with pagination
- [x] FE: SEO for each movie detail (need SSR)
- [ ] FE: All pages - Handle error states
- [ ] FE: AddToCollection - Change to BottomSheet with transparent background

## BE
- [x] BE: add movies to favorites (default collection)
- [x] BE: create collection and add movies to it

## UX/data-flow regression checks

Install dependencies in each app, then run:

```sh
(cd frontend && pnpm install && pnpm test --runInBand && pnpm exec tsc --noEmit)
(cd backend && pnpm install && pnpm test)
(cd frontend && pnpm exec expo export -p web)
```

The frontend tests use Expo SDK 52's Jest preset and mocked network/native
boundaries. Route tests live in `frontend/src/__tests__`, outside Expo's route
directory. The web export requires the existing `FAVMOV_*` environment settings;
use nonproduction values for local verification. Run Expo export directly rather
than the deployment script, which clears backend public files.

Notes save in order within an editor instance. Native-stack removal prevention guards Back and swipe dismissal. Back waits for saves and membership
changes; a failed save leaves the editor open with Retry and a page-level Leave without saving action. Closing the browser or
terminating the app can still lose unsaved drafts, and simultaneous editing in
multiple tabs is not coordinated.

The API relies on these Supabase rules, applied to both dev and prod tables on
2026-11-05. Any new environment needs them too:

- `*_movies_collections.collection_id` cascades on delete, because deleting a
  collection only deletes the parent row.
- `poster_path` is nullable on `*_movies` and `*_tv_shows`.
- `*_movies_collections` has unique partial indexes on (`collection_id`, `movie_id`)
  and (`collection_id`, `tv_show_id`).

See `docs/qa/2026-11-04-ux-data-flow-verification.md` for verification evidence and
remaining platform checks.

Web navigation limit: browser Back can update the address while a failed note save
keeps the editor visible. Use its Retry/Leave without saving controls; reloading
at that point loses the unsaved draft. In-app Back uses the same save guard without
that browser-history mismatch.
