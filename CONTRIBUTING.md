# Contributing

Follow [Getting started](README.md#getting-started) to install dependencies and configure the app. Node.js 22+ and pnpm 12 are required. Each of `frontend/`, `backend/` and `e2e/` has its own dependencies and lockfile.

Before opening a pull request, run from the repository root:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
```

Install browser binaries once with `pnpm --dir e2e exec playwright install chromium firefox`. Tests use fake services and need no real credentials or external network after installation. Browser tests build the web export and take minutes.

## Conventions

- Keep Expo Router routes thin; place screens and feature logic in `frontend/src/features/`.
- Fetch server data through TanStack Query hooks; services return data and throw `ApiError`.
- Keep models as plain TypeScript types and use shared theme tokens.
- Use accessible controls: `Pressable` needs a role and an accessible name. Avoid `any` and `console` in app code.
- Preserve matching server HTML and first client render; keep queries paused until hydration completes.
- Keep backend routes, validators, controllers and repositories separate; use the shared response envelope.
- Read backend environment variables when needed rather than capturing them at module load.
- Add or update tests with behavior changes; keep meaningful assertions intact.
- Format with Prettier using `pnpm format`; use conventional commits such as `docs: clarify setup` or `fix(auth): validate email`.

## Pull requests

Fill in every section of the [pull request template](.github/pull_request_template.md). Explain the problem, resulting behavior and checks you ran, including anything not checked. See [architecture](docs/architecture.md) and the [API reference](docs/api.md) for design and contracts.
