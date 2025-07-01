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

# TODOs
- [x] FE: Add activeTab param to Main stack navigation
- [x] FE: Fix redirect before and after login
- [x] FE: Fix logout
- [ ] FE: Homepage - Add shimmering / loading state
- [ ] FE: Search TV shows
- [ ] BE: add movies to favorites (default collection)
- [x] BE: create collection and add movies to it