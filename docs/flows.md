# FavMov: flows and behavior

What the app does today, from reading the code and running its tests. To run them, see [Testing](../Readme.md#testing).

## Architecture

| Part | Role |
| --- | --- |
| `frontend/` | Expo Router app (web, iOS, Android). Calls TMDB directly for public data, and the backend for anything user-owned. |
| `backend/` | Express server. Serves the JSON API under `/api` and the exported web pages. |
| Supabase | Email OTP sign-in and the database. The frontend owns the session; the backend verifies its token on each request. |
| TMDB | Movie, TV and people data. Called by the browser, by the SEO lookup, and by the daily sync. |

The database schema and its Row Level Security rules are not in this repo.

## Sign-in

1. `/login` takes an email and calls Supabase, which creates the account on first use.
2. On success the page asks for the code and starts a 5 minute countdown. Resend is disabled until it ends.
3. **Change** returns to the email step and resets the countdown.
4. A correct code shows a welcome toast, then goes back after 2 seconds, or home if there is no history.
5. A wrong code shows the Supabase error and lets the user retry.

The session persists across reloads (AsyncStorage). `useAuth` follows sign-in and sign-out live, and `backendClient` adds the token to every API call. A failure reading the session counts as signed out.

**Protected pages** (`withAuth`): `/collection`, `/collection/:id`, `/collection/add` and `/profile`. They show a loader while the session loads, then send guests to `/login`.

**Logout** on `/profile` signs out of Supabase. If that fails, the user stays put with an error toast.

## Browsing

- **Home** shows Trending Movies, Trending TV Shows and Popular Movies to everyone, plus Your Favorites when signed in. A section with no titles disappears. Favorites reload when the page regains focus, only if a collection changed since the last load.
- **Explore** (`/explore?section_type=…`) lists one section and loads the next page at the end of the list, up to page 500.
- **Search** waits 300 ms after typing stops, then searches the selected filter: Movie, TV Show or People. Adult titles are excluded. The filter hides while typing, and changing it repeats the search. More pages load at the end of the list until `total_pages`.
- **Movie page** (`/movie/:id`, with `?is_tv_show=true` for TV) shows anything already cached at once, then fills in from TMDB: top 10 cast, and up to 20 crew with the director and producers first. Cast and crew link to their people pages.
- **People page** (`/people/:id`) shows the profile with `N/A` for gaps, plus acting and crew credits. Each list merges movies and TV, puts undated titles first and then newest first, and can be hidden.

### Passing data between pages

`MovieStore` carries a title's data to the next page, so it can render at once. Entries live 30 minutes, the store holds 100, and the oldest is evicted first. Movies and TV shows with the same id stay separate. The movie and add-to-collection pages remove the entry when they read it.

## Collections

- **Create**: the Collections tab opens a sheet. Names are trimmed, blank names can't be saved, and a duplicate (ignoring case) keeps the sheet open with the reason.
- **List**: sorted by title count, then most recently updated. A collection with no titles uses its creation date.
- **Detail**: shows titles newest first, with notes and the release year. An empty collection links to search.
- **Saving a title**: the heart on the movie page is outlined when unsaved and filled when saved. Guests go to login. Signed-in users open `/collection/add`, which lists collections holding the title first. Ticking a box adds the title, unticking removes it. Notes appear once it is saved, and save, trimmed, 1 second after typing stops.
- **Keeping pages fresh**: `CollectionStateStore` records the time of the last change. The tab, detail and home pages reload on focus only if that is newer than their last load. The movie page always re-checks its saved state on return.
- **Sharing rows**: a title is stored once in `movies` or `tv_shows` and linked to each collection. Removing it from a collection leaves that row in place. Deleting a collection deletes its links first.

## API

All routes under `/api/collections` need `Authorization: Bearer <token>`. Every response uses the same envelope:

```json
{ "success": true, "message": "…", "debugMessage": "development only", "data": {} }
```

| Method and path | Purpose | Notable responses |
| --- | --- | --- |
| `GET /api/health` | Health check, no auth | 200 |
| `POST /api/collections` | Create | 201, 400 blank or duplicate |
| `GET /api/collections` | List the caller's collections | 200 |
| `DELETE /api/collections/:id` | Delete with its links | 200, 404 not the owner |
| `GET /api/collections/latest_movies` | Latest saved titles, for Your Favorites | 200 |
| `POST /api/collections/:id/movies` | Add a title | 201, 400 invalid or already there, 404 not the owner |
| `GET /api/collections/:id/movies` | Collection with its titles | 200, 404 not the owner |
| `POST /api/collections/:id/movies/:movieId/notes` | Set notes | 201, 404 title not in the collection |
| `DELETE /api/collections/:id/movies/:movieId?is_tv_show=` | Remove a title | 200, 400 not in the collection, 404 not the owner |
| `GET /api/collections/check_exist/:id?is_tv_show=` | Which of the caller's collections hold a title | 200 |

Other behavior:

- A missing or invalid token gets a 401. Unknown `/api` paths get a JSON 404, and malformed JSON gets a 400.
- Database failures answer 500 with a generic message. The cause appears in `debugMessage` in development only.
- `FAVMOV_NODE_ENV` picks the tables: `dev_*` or `prod_*`. Any other value makes data routes answer 500.

## Web pages and SEO

- Each route has its own prerendered HTML, because serving another route's file breaks hydration. Trailing slashes are rewritten, not redirected, so `//example.com/` can't become an open redirect.
- `/movie/:id` fills the title and description tags from TMDB when `FAVMOV_TMDB_API_KEY` is set. A title TMDB doesn't have answers 404. If TMDB is down, the page is served with the default tags.
- Lookups are cached for 1 hour, a 404 for 5 minutes, up to 1000 entries. A failure pauses all lookups for 30 seconds.
- A non-numeric `/movie/:id` and any unknown path answer 404.
- `res.sendFile` refuses paths containing a dot-directory, so the server must not be deployed under one, such as `~/.something/`. Those fallback routes would all answer 404.

## Daily media sync

Runs in the background on the first request of each UTC day, when both `FAVMOV_SUPABASE_S_KEY` and `FAVMOV_TMDB_API_KEY` are set. It never delays the request. It compares every stored movie and TV show with TMDB and updates rows that differ. One bad title doesn't stop the rest. `pnpm run sync` runs it by hand, and exits nonzero if any row failed.

## Known issues

Each is pinned by a test with `KNOWN ISSUE` in its name, or a comment in the logout test, so a fix shows up as a deliberate test change. Nothing here has been fixed.

| Issue | Effect | Test |
| --- | --- | --- |
| Logout goes home, then the mounted `withAuth` screens redirect to login | Users land on `/login`, and the success toast never shows | `e2e/tests/signedIn.spec.js` |
| Reloading `/collection/add` loses the cached title | The user is bounced out with "Movie collections are needed" | `e2e/tests/signedIn.spec.js` |
| A title with no poster is rejected | Those titles can't be saved | `backend/e2e/api.test.js` |
| Text typed during a running search is dropped | Results don't match the query | `flows/search.test.tsx` |
| Failed searches and Explore loads show "No results found." | An outage looks like an empty result | `flows/search.test.tsx`, `flows/browse.test.tsx` |
| A failed Home section disappears silently | No error is shown | `flows/browse.test.tsx` |
| A failed people lookup never stops the spinner | The page stays stuck after the toast | `flows/details.test.tsx` |
| A failed link leaves the movie row behind | Harmless orphan row | `backend/e2e/api.test.js` |
| A failed collection delete still removes the links | **Data loss**: the collection survives, empty | `backend/e2e/api.test.js` |
| Removing a missing TV show answers just `TV Show` | Operator precedence bug in the message | `backend/e2e/api.test.js` |
| The string `"false"` for `is_tv_show` passes validation, then counts as true | Only affects other API clients | `backend/e2e/api.test.js` |
| Saving notes answers 201 | Nothing is created; should be 200 | `backend/e2e/api.test.js` |
| Add and notes fallback messages swap "movie" and "tv show" | Wrong wording when the network fails | `unit/collectionService.test.ts` |
| Notes still show after remove and re-add | The server dropped them, the box doesn't say so | `flows/collections.test.tsx` |
| "Create Collection" on the add page goes home | Should go to the Collections tab | `flows/collections.test.tsx` |
| An empty email is sent to Supabase | No client-side validation | `flows/login.test.tsx` |
| `routes.collections` is `/collections` | The page is `/collection`. Unused today | `unit/navigation.test.ts` |
| A missing route param becomes `"undefined"` | `/explore` with no section shows that title | `unit/util.test.ts`, `flows/browse.test.tsx` |
| A stray `%` in a route param throws `URIError` | Would throw during render; only the parser is tested | `unit/util.test.ts` |

`frontend/.env` in the Readme lists `FAVMOV_API_BASE_URL_LOCAL`, but the code only reads `FAVMOV_API_BASE_URL_PROD`.
