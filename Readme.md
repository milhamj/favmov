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
FAVMOV_API_BASE_URL= http://127.0.0.1:3080/api
```
```
pnpm run web
```
#### Export
```
rm -rf node_modules
rm -rf $HOME/Library/Caches/pnpm/dlx
rm -rf .expo

pnpm install

pnpm exec expo export -p web
```
#### Clear build cache
```
rm -rf .expo .expo-shared dist node_modules/.pnpm
pnpm install
pnpm exec expo export -p web
```

# TODOs
- [x] FE: Add activeTab param to Main stack navigation
- [x] FE: Fix redirect before and after login
- [x] FE: Fix logout
- [x] FE: Homepage - Add shimmering / loading state
- [ ] FE: All pages - Handle error states
- [ ] FE: Bug - Main screen tab navigation using activeTab
- [ ] FE: AddToCollection - Change to BottomSheet with transparent background
- [ ] FE: Search TV shows
- [x] BE: add movies to favorites (default collection)
- [x] BE: create collection and add movies to it