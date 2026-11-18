# FavMov

FavMov is a web app for discovering movies, TV shows and people from TMDB, and keeping titles in personal collections with notes. Browse without an account; sign in with an email code to save your picks.

Live site: [favmov.milhamj.com](https://favmov.milhamj.com)

## Features

- Browse trending movies, trending TV shows and popular movies.
- Search movies, TV shows and people.
- Explore title details, cast, crew and people's credits.
- Sign in with an email one-time code.
- Create personal collections and save a title to multiple collections.
- Write notes for each saved title, with automatic saving and retry controls.
- Revisit your latest favorites from the home page.

## Tech stack

| Part              | Technology                                                     |
| ----------------- | -------------------------------------------------------------- |
| Web app           | Expo SDK 57, Expo Router, React 19, TypeScript, TanStack Query |
| API               | Express 5, JavaScript, Node.js                                 |
| Auth and database | Supabase                                                       |
| Movie data        | TMDB                                                           |
| Tests             | Jest, Node test runner, Playwright                             |

## Project structure

- `frontend/`: web routes, feature screens, components and client services.
- `backend/`: API, exported pages, SEO and media sync.
- `e2e/`: browser tests and a local stack with fake services.
- `docs/`: [architecture](docs/architecture.md) and [API reference](docs/api.md).

## Getting started

You need Node.js 22 or newer, pnpm 12 (the repository pins 12.18.0), a Supabase project with email OTP enabled, and a TMDB API read access token. If pnpm is unavailable on PATH, use `npx pnpm` in place of `pnpm`.

From the repository root:

```sh
pnpm run setup
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Fill in both environment files before starting the app:

| File          | Variable                        | Required?        | Purpose                                                       |
| ------------- | ------------------------------- | ---------------- | ------------------------------------------------------------- |
| frontend/.env | `EXPO_PUBLIC_TMDB_TOKEN`        | Yes              | TMDB API read access token                                    |
| frontend/.env | `EXPO_PUBLIC_SUPABASE_URL`      | Yes              | Supabase project URL                                          |
| frontend/.env | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes              | Supabase public anonymous key                                 |
| frontend/.env | `EXPO_PUBLIC_API_URL`           | Yes              | Backend API URL; local example is `http://localhost:3080/api` |
| backend/.env  | `FAVMOV_PORT`                   | No               | Listening port; defaults to 3000, example uses 3080           |
| backend/.env  | `FAVMOV_HOST`                   | No               | Listening address; defaults to `127.0.0.1`                    |
| backend/.env  | `FAVMOV_NODE_ENV`               | Yes              | `development` or `production`; selects database names         |
| backend/.env  | `FAVMOV_SUPABASE_URL`           | Yes              | Supabase project URL                                          |
| backend/.env  | `FAVMOV_SUPABASE_ANON_KEY`      | Yes              | Public key used with the caller's session token               |
| backend/.env  | `FAVMOV_TMDB_API_KEY`           | For SEO and sync | TMDB API read access token, despite the variable name         |
| backend/.env  | `FAVMOV_SUPABASE_S_KEY`         | For sync         | Supabase service key; backend only                            |

`EXPO_PUBLIC_*` values are embedded in the web bundle and public by design. Never put a Supabase service key in them. The backend refuses startup if a required variable is missing.

The Supabase schema and row-level security policies are not yet included in this repository. You must provision them separately to use collections. The backend expects tables `collections`, `movies`, `tv_shows`, `movies_collections`, and views `collections_with_movie_count` and `latest_movies_added_to_collection`, all prefixed with `dev_` for `FAVMOV_NODE_ENV=development` or `prod_` for `production`. The server refuses to start with any other value. Collection deletion requires cascading entry deletion; entries must be unique per collection and title, and poster columns must allow null.

Start these in separate terminals from the root:

```sh
pnpm --dir backend dev
pnpm --dir frontend web
```

Open the web URL printed by Expo. Keep `EXPO_PUBLIC_API_URL` matched to the backend port.

## Scripts

Run these from the repository root:

| Command          | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `pnpm run setup` | Install all three projects with frozen lockfiles       |
| `pnpm lint`      | ESLint and formatting checks across all three projects |
| `pnpm typecheck` | Check frontend TypeScript                              |
| `pnpm test`      | Backend and frontend tests                             |
| `pnpm e2e`       | Playwright browser suite                               |
| `pnpm format`    | Format the three projects with Prettier                |
| `pnpm build:web` | Export the web app into backend/public                 |

## Testing

Backend tests cover validation, repositories, middleware, SEO, sync and the real API against fake Supabase. Frontend Jest tests cover services, hooks, screens, authentication and editing. Playwright exercises the exported app against fake Supabase and TMDB in Chromium, with hydration also checked in Firefox.

Tests need no credentials or external network once dependencies and browsers are installed. Install browsers once:

```sh
pnpm --dir e2e exec playwright install chromium firefox
```

Run `pnpm test` and `pnpm e2e`. Browser tests build the web export and take minutes; `CI=1 pnpm e2e` forces a fresh build rather than reusing a running test server.

## Deployment

Set frontend values for the deployed API before building; they are baked into the export. Configure backend environment variables on the server with `FAVMOV_NODE_ENV=production`.

```sh
pnpm build:web
pnpm --dir backend start
```

The build replaces `backend/public` with the exported site. The backend serves both pages and `/api`; deploy it behind your HTTPS endpoint. It listens on `127.0.0.1` only, which suits a proxy or tunnel on the same machine; in a container, on a hosting platform, or behind a proxy on another machine, set `FAVMOV_HOST=0.0.0.0` so it accepts outside connections, or `::` to also accept IPv6 where the host has it. Do not deploy under a path containing a dot-directory (for example, `/srv/.apps/favmov`): Express `res.sendFile` refuses those paths for page fallbacks.

With both sync keys set, the first request each UTC day starts a background media refresh; failed runs retry on a request at least an hour later. Run it manually with `pnpm --dir backend sync`.

## Platform

Web only today. Native iOS and Android builds are untested and are not maintained.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for checks and conventions.

## Acknowledgements

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

[GNU GPL version 2 only (GPL-2.0-only)](LICENSE).
