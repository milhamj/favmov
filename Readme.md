# Pre-Requisite
### backend/.env
```
FAVMOV_PORT=3080
FAVMOV_NODE_ENV=development || production
FAVMOV_SUPABASE_URL=
FAVMOV_SUPABASE_ANON_KEY=
```
```
pnpm run dev
```

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
- [ ] FE: Collection detail page - Change UI so that the notes are shown
- [ ] FE: All pages - Handle error states
- [ ] FE: Bug - Main screen tab navigation using activeTab
- [ ] FE: AddToCollection - Change to BottomSheet with transparent background

## BE
- [x] BE: add movies to favorites (default collection)
- [x] BE: create collection and add movies to it