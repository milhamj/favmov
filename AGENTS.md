# Agent guide

FavMov is a web-only Expo Router app for TMDB browsing and personal collections.
Express provides the API, static pages, SEO and media sync; Supabase provides auth and data.

## Commands

Run from the repository root with Node.js 22+ and pnpm 12. Use `npx pnpm` if pnpm is not on PATH.

```sh
pnpm run setup
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
```

Single-test examples:

```sh
pnpm --dir frontend exec jest --runInBand src/__tests__/unit/apiError.test.ts
pnpm --dir backend exec node --test utils/responses.test.js
pnpm --dir e2e exec playwright test tests/guest.spec.js --project=chromium --grep 'search'
```

Install browsers with `pnpm --dir e2e exec playwright install chromium firefox`. E2E builds the web export and takes minutes. `CI=1 pnpm e2e` forces a fresh build instead of reusing a running test server. Tests use fake services; credentials are unnecessary.

## Repository map

- `frontend/src/app/`: thin Expo Router routes.
- `frontend/src/features/{auth,movies,people,collections}/`: screens, hooks, services and models.
- `frontend/src/components/`, `hooks/`, `lib/`, `navigation/`, `theme/`: shared UI, hooks, infrastructure, navigation helpers and tokens.
- `frontend/src/__tests__/`: frontend tests; `frontend/test/`: shared helpers.
- `frontend/patches/`: pnpm dependency patches.
- `backend/`: JavaScript routes, validators, controllers, repositories, middleware, config and utilities; colocated tests and API tests in `backend/e2e/`.
- `backend/public/`: generated web export.
- `e2e/`: Playwright configuration, stack and browser tests.
- `docs/`: architecture and REST contracts; `.github/`: CI and PR template.

## Conventions and hard rules

- Keep routes thin and screens in features. Use TanStack Query hooks for server data.
- Services return data and throw `ApiError`; models are plain types.
- Use theme tokens only for styling values covered by the theme.
- Give `Pressable` a role and accessible name. Do not use `any` or `console` in app code.
- Server HTML must equal the first client render. Pause queries until hydration finishes; never weaken the hydration spec.
- Do not edit `frontend/patches` casually: the expo-font patch supports Firefox font detection during hydration.
- Keep backend layering: routes → validators → controllers → repositories. Use shared success/error response helpers; health has its own response.
- Do not snapshot `process.env` at module load in the backend. Table names use `dev_` or `prod_` according to `FAVMOV_NODE_ENV`.
- Keep Supabase service keys backend-only. `EXPO_PUBLIC_*` values are public bundle contents.
- Format with Prettier and use conventional commits. Native builds are not maintained or tested.

## Testing guidance

Use `frontend/test/renderWithProviders.tsx` for provider-backed rendering, `frontend/test/factories.ts` for fixtures and `frontend/test/expoRouter.ts` for router mocks. Cover behavior changes in the nearest relevant suite: Jest for frontend behavior, Node tests for backend logic/API, Playwright for browser and hydration behavior. Never weaken assertions to make a change pass.

## Pull requests

Fill in every section of [.github/pull_request_template.md](.github/pull_request_template.md) for the PR description.
