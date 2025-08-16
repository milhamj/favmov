# Pre-Requisite
### backend/.env
```
PORT=3000
NODE_ENV=development || production
SUPABASE_URL=
SUPABASE_ANON_KEY=
```
```
pnpm run dev
```

### frontend/.env
```
TMDB_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
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