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

The server logs the name of any missing key above at startup, except `FAVMOV_PORT`, which is optional.

The first request of each UTC day refreshes the stored movie and TV show data from TMDB in the background, one run at a time. A failed run is retried by the first request at least an hour later. Run it by hand with `pnpm run sync`.
The sync requests fresh TMDB data without the page-level cache or cooldown. Row failures do not stop later titles, but the manual command exits with a nonzero status after both tables finish if any rows failed. A title TMDB no longer has is logged and skipped, and does not count as a failure.

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
