# UX/data-flow fixes — verification

Implemented audit findings 1, 3–11 in the existing components/services, with no
new runtime dependency. Finding 4 covers application validation and request
normalization; actual null storage requires unverified Supabase nullability.
Finding 2 (atomic deletion) and database migrations were explicitly skipped at
the owner's request. No production service/schema was modified.

## Automated checks

- Frontend: `pnpm test --runInBand` (44 tests across 10 suites).
- Backend: `pnpm test` (36 tests, including poster validation).
- Types: `pnpm exec tsc --noEmit` in frontend.
- Web bundle: `pnpm exec expo export -p web` with placeholder localhost Supabase
  and backend settings and dummy TMDB token. Does not establish live API behavior.

Core regressions were observed failing before implementation: concurrent notes,
missing Retry, debounce flush/cancel, empty-cache editor/Back, stale search,
failed-page retry, poster validation/normalization, return-route validation,
person request failure, and Favorites heading navigation. Added coverage exercises
removal/re-add and failed removal, timer cleanup, URL errors/retry, same-ID movie/TV
route races, creation through the real sheet, auth loading and failed OTP, stale
person responses/404, and clearing search.

The final review found editable notes during navigation drain and membership
removal. Both received failing regressions and fixes that disable editing during
those operations. A further failing regression verified Back waits for pending
membership deletion. Editor cards remain mounted while scrolling so draft timers
are not discarded by list virtualization.

## Browser/platform checks

T3 preview is blocked by host AppArmor. A local Playwright Chromium smoke check
against the static export with mocked TMDB responses passed slow Alien→Arrival
search ordering, posterless rendering, and signed-out editor redirect preserving
both movie ID and TV flag; no uncaught page errors occurred.

No emulator/simulator is available. Native input/back gestures, live OTP, live
Supabase/TMDB requests, full authenticated browser save/create/remove flows, and
real database rollback/nullability remain untested. Additional matrix coverage
for every filter/pagination permutation and creation cancellation/failure is not
exhaustive; unit tests are not a substitute for those platform/live checks.

## Implementation decisions

- Combined tasks 1 and 5's editor changes so navigation regressions exercise a
  URL-loaded editor. The note/debounce component keeps API ordering locally.
- Skipped schema inspection/migrations/atomic deletion as explicitly requested.
- Freeze inputs while leaving or changing membership; ordinary note saves keep
  typing available and coalesce pending text.
- Per-instance note ordering does not resolve cross-tab conflicts or preserve
  drafts after browser/app termination.


## PR feedback follow-up

Validated both findings in review comment 6632676052 against the installed
navigation code and failing regressions:

- Native-stack reads the removal-prevention context to set `preventNativeDismiss`;
  a raw `beforeRemove` listener does not populate that context. The editor now uses
  `usePreventRemove` and replays the blocked action only after saves succeed. The
  stack disables the unsupported back-button history menu. The direct Navigation
  dependency is aligned to Expo Router's installed 7.1.18 so the hook shares the
  navigator's context. Tests use the real navigation container/prevention context
  to verify pending/failed saves retain the editor and successful retry pops it.
- Login now uses Expo Router's `dismissTo`, which pops to an existing destination
  or replaces the current route when absent. Real StackRouter regressions cover
  movie and TV destinations, Back reaching Home, and a direct protected editor
  destination absent from history. Both movie-history cases fail with the old
  replacement behavior.

Declared `babel-preset-expo` as a direct development dependency so tests do not
rely on a transitively hoisted preset. The full frontend suite and TypeScript
passed after these changes. Native gestures still require a device check; these
regressions establish prevention-context/state behavior, not physical gestures.
