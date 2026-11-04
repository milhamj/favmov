# UX and Data Flow Fixes Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Do not start implementation from this document without a user request to implement.

**Goal:** Fix all 11 bugs from the repository audit and add regression tests that reproduce their user-visible failures.

**Architecture:** Keep the existing Expo screens, services, models, and Express controllers. Fix request ownership and note ordering where requests start; make collection deletion atomic in the database. Reuse the existing collection creation sheet and result types.

**Tech Stack:** Expo SDK 52, React 18.3.1, React Native, TypeScript, Express, Supabase/Postgres, Node's test runner. Add only frontend test development dependencies compatible with these installed versions.

**Spec:** The 11 numbered findings in the preceding audit, mapped below. This is a proposed implementation plan, not a record of changes already made.

## Global constraints

- Scope: user experience and data flow only; no security audit or unrelated refactoring.
- Preserve existing API routes and success/error response envelopes.
- Keep movie and TV identifiers distinct throughout requests, caches, and tests.
- No new runtime dependency, generic request framework, global state library, or redesign.
- Use fake timers and deferred promises for timing tests; do not rely on sleeps or live TMDB.
- Use disposable database fixtures for destructive tests. Never test deletion against user collections.
- First write each regression, confirm that it fails for the intended reason, implement the fix, rerun its tests, then commit that task separately.

## Coverage and order

| Task | Audit findings | Deliverable |
| --- | --- | --- |
| 1 | 1, 11 | Ordered note saves and correct remove/re-add state |
| 2 | 2 | Atomic collection deletion |
| 3 | 3, 8 | Current-query results and retryable pagination |
| 4 | 4 | Saving titles without posters |
| 5 | 5, 6 | Reloadable editor and working collection creation |
| 6 | 7 | Login returns to the requested destination |
| 7 | 9 | Person lookup failures end loading and allow retry |
| 8 | 10 | Favorites heading no longer opens unsupported Explore |

Tasks are independently reviewable. Run them in this order; task 1 introduces the frontend test setup reused later. Task 6 relies on task 5 making editor URLs self-sufficient.

## Review focus

- Movie and TV show sharing the same numeric ID must never share editor or search state: tasks 3–6.
- A response for a previous query, filter, or route must not replace current data: tasks 3, 5, 7.
- Empty text is a valid saved note, and failed removal must preserve the displayed note: task 1.
- Navigation while a note is pending must not silently discard the latest edit: task 1.
- Database failure must leave both the collection and its notes intact: task 2, including a real database rollback test.

## Task 1: Order note writes and fix remove/re-add state

**Files:** Modify `frontend/src/components/CollectionAddCard.tsx`, `frontend/src/app/collection/add.tsx`, and `frontend/src/hooks/useDebouncedCallback.ts`; add adjacent `CollectionAddCard.test.tsx`, `add.test.tsx`, and `useDebouncedCallback.test.tsx`. Add `frontend/jest.config.js`, `frontend/jest.setup.ts`, test scripts in `frontend/package.json`, and update `frontend/pnpm-lock.yaml`.

**Interfaces:** Keep `updateNotes(collectionId, movieId, isTvShow, notes)` and membership service signatures. Change the debounce hook return value to a callable with `cancel(): void` and `flush(): void`; check all callers before changing it. Keep the asynchronous write ordering inside the collection card, rather than teaching the generic timer hook about API requests.

- [ ] Add `jest-expo` matched to Expo SDK 52, a compatible `@testing-library/react-native`, React test renderer exactly `18.3.1`, and Jest TypeScript types as development dependencies. Use the Expo preset, exclude tests from Expo routes, and mock environment/service/native boundaries centrally. Put route tests outside `src/app` if the router discovers adjacent test files; use `frontend/src/__tests__/app/collection-add.test.tsx` in that case.
- [ ] Add fake-timer/deferred-request regressions: a burst saves only the latest text; an unresolved save prevents a second write from starting; edits during that write are coalesced and saved after it; clearing text saves `''`; failures retain the draft and expose Retry without an infinite retry loop.
- [ ] Add membership regressions: successful removal clears notes and pending timers; failed removal preserves notes and membership; remove/re-add displays and persists an empty note; a pending old update cannot execute against a newly created membership.
- [ ] Add hook regressions for cancellation, flushing exactly once, latest callback usage, and timer cleanup. Add a navigation regression that edits a note and immediately presses Back, then asserts that the latest edit is saved before leaving; a failed save keeps the editor open with a retry action.
- [ ] Run `cd frontend && pnpm test -- --runInBand` and confirm the new regressions fail against current behavior.
- [ ] Implement one active write per card with refs for the latest pending value and active request. Keep typing available during saves; only mark the latest successful value as saved. Show Saving, Saved, or an actionable save error. Use explicit `setIsSaved(value)`, not toggling stale state.
- [ ] Cancel pending note work before removal and disable removal while a note write is active. Clear the draft only after successful deletion. Route in-app back/gesture removal through a save-and-wait operation exposed by cards to the editor; register mounted cards only, clean registrations on unmount, and prevent duplicate navigation while draining. Keep the page mounted if draining fails. Do not claim that closing the browser or killing the app guarantees a save.
- [ ] Rerun the note, hook, and editor tests. Commit as `fix: preserve ordered collection note edits`.

**Risk:** Client ordering covers this editor instance, not simultaneous editing in two tabs. Closing the browser or killing the app during a request can still lose unsaved text; a server revision protocol or persistent offline drafts would be separate scope. Debounce cleanup must not cancel a required navigation flush.

## Task 2: Make collection deletion atomic

**Files:** Modify `backend/controllers/collectionController.js`; create `backend/controllers/collectionController.test.js`, `backend/db/collection-delete.test.sql`, and, if required after schema inspection, `backend/db/migrations/20261104_collection_delete_cascade.sql`. Document deployment and test commands in `Readme.md`.

**Interfaces:** Preserve `DELETE /api/collections/:collection_id`, its existing ownership lookup, and `{ success: true, data: { is_success: true } }` on success. Replace separate child/parent writes with one parent delete backed by a foreign key using `ON DELETE CASCADE`.

- [ ] Inspect development and production collection/membership table definitions in a read-only schema export. Record the actual foreign key names, column types, cascade behavior, triggers, and whether `poster_path` allows null for task 4. The repository does not contain these definitions; this is a prerequisite for completing database work.
- [ ] Add controller tests showing that a failed parent delete reports failure and never issues a separate membership delete; successful deletion preserves the response contract; missing collections do not write anything.
- [ ] Add a transaction-wrapped SQL integration test using fixture collections containing a movie, a TV show, and notes. Delete one collection and assert only its children disappear. Inject a delete failure using a test-only trigger and assert the collection and every child/note remain. Roll back all fixtures and triggers.
- [ ] Run `cd backend && pnpm test`; confirm controller regressions fail against the current two-write implementation.
- [ ] If the required cascade already exists, reuse it. Otherwise write an explicit migration for the inspected foreign keys on `dev_movies_collections` and `prod_movies_collections`. Check for orphan rows and stop migration with a diagnostic if found; do not delete or repair user data automatically.
- [ ] Delete only the parent collection in the controller; preserve user filtering and normal failure responses. Do not substitute two reordered requests or compensating inserts: neither guarantees rollback.
- [ ] Run the SQL test on a disposable database: `psql "$FAVMOV_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/collection-delete.test.sql`. Run backend tests. Deploy the schema before the controller change; record rollback SQL that restores the previous constraint definitions.
- [ ] Commit as `fix: delete collections and entries atomically`.

**Risk:** Foreign key changes can lock tables and fail on existing inconsistent rows. A mocked controller test alone does not prove atomicity; this task remains incomplete until the database test passes. Do not apply production migrations as part of merely writing or reviewing this plan.

## Task 3: Keep search results current and retry failed pages

**Files:** Modify `frontend/src/app/search.tsx` and `frontend/src/app/explore.tsx`; create `frontend/src/__tests__/app/search.test.tsx` and `explore.test.tsx`. Keep existing service response types unless a real pagination limit is needed from the API.

**Interfaces:** Retain `searchMovie`, `searchPeople`, and discovery service signatures. Give each query/filter/section a request generation; pagination is guarded within that generation, not across all searches. Store the last successfully loaded page, initially zero.

- [ ] Add deferred-request tests: search Alien, change to Arrival, resolve Arrival then Alien, and assert only Arrival is visible. Repeat with movie/TV/people filter changes and clearing the query; stale requests must not change results, loading state, or page totals.
- [ ] Add pagination tests on both screens: page 1 succeeds, page 2 fails, Retry requests page 2 again, then page 3 loads once. Assert no duplicate request for repeated end-of-list events, no lost rows on failure, and no stale page append after query/section changes.
- [ ] Add tests that section/query changes reset the successful page counter; a legitimate empty first page differs from an error. After a failed page, scrolling must not endlessly retry: expose a footer Retry action and resume automatic loading after success.
- [ ] Run `cd frontend && pnpm test -- --runInBand search explore`; confirm failures.
- [ ] Replace the global search fetch lock with generation-aware requests. Increment the generation immediately on query/filter change, before the debounce expires. Allow a new first-page request while the old generation is in flight; ignore all stale completions, including `finally` loading updates.
- [ ] Advance the successful page only after success. Keep current rows on pagination errors and offer Retry for that same page. Reset Explore request state on section changes, and treat an empty subsequent page as the end rather than requesting forever.
- [ ] Run the targeted tests and commit as `fix: keep search and pagination results consistent`.

**Risk:** Ignoring a stale response does not cancel its network request. Cancellation is optional; correctness must not depend on it. Prevent obsolete requests from unlocking the active generation's pagination guard.

## Task 4: Accept titles with no poster

**Files:** Modify `backend/controllers/collectionController.js`, `frontend/src/services/collectionService.ts`, and their tests. If task 2 finds a non-null constraint, add `backend/db/migrations/20261104_nullable_media_posters.sql` for the actual affected tables.

**Interfaces:** Keep `postAddMovieToCollection(collectionId, movie, isTvShow)` unchanged. Send/store `null` for missing artwork; preserve nonempty poster paths and the existing model fallback URL.

- [ ] Add service and API regressions for a posterless movie and TV show: null, omitted, and empty poster inputs succeed with otherwise valid data; valid paths remain unchanged; malformed non-string poster values still fail. Assert title and media ID requirements remain enforced.
- [ ] Run backend tests and `cd frontend && pnpm test -- --runInBand collectionService`; confirm the relevant regressions fail.
- [ ] Normalize absent/blank paths to null, validate paths only when supplied, and adjust database nullability only if inspection proves it necessary. Do not store the fallback image URL as a TMDB poster path.
- [ ] Run targeted tests and verify the existing poster fallback renders for stored nulls. Commit as `fix: allow saving titles without artwork`.

**Risk:** Frontend-only changes cannot bypass backend validation or database constraints. Nullability migration must precede deployment of requests containing null posters.

## Task 5: Load the editor from its URL and create collections in place

**Files:** Modify `frontend/src/app/collection/add.tsx`, `frontend/src/navigation/routes.ts`, and editor tests from task 1. Reuse `CreateCollectionSheet.tsx`, `fetchMovieDetails`, `getCheckMovieExistInCollection`, and `getUserCollections`; add no replacement creation component.

**Interfaces:** Preserve `/collection/add?movie_id=<id>&is_tv_show=true` and movie-cache keys. Fix `routes.collections` to `/collection` and verify its callers. A cache hit may seed rendering, but the URL is the authoritative identity and membership is refreshed from the service.

- [ ] Add tests for an empty cache, refresh-equivalent mounting, and movie/TV sharing an ID. Assert the correct detail and membership services are called and checkbox/notes state matches the responses.
- [ ] Add tests for invalid/missing IDs, request failure followed by Retry, and route changes during loading. Invalid URLs must show a useful error without requesting movie 0 or redirecting unexpectedly.
- [ ] Add a no-collections test: press Create Collection, fill the existing sheet, save successfully, and assert the new collection appears without losing the current title. Test cancel and failed creation; reopening keeps a usable editor.
- [ ] Run the editor tests and confirm failures.
- [ ] Replace the empty-movie fallback/redirect with loading, success, and retryable error state. Fetch details as needed and fresh membership; ignore completions for obsolete routes. Render cards only after membership is known so a late load cannot leave incorrect initial checkbox state.
- [ ] Open the existing creation sheet locally. After successful creation, refresh collections while preserving the selected title and confirmed edits. Invalidate collection state so returning to the Collections tab shows the new collection. Preserve pending drafts if the list refreshes.
- [ ] Run editor and note tests together; commit as `fix: restore collection editor from URLs`.

**Risk:** A collection-list refresh must not remount dirty note cards or overwrite local drafts. Cache consumption and retry behavior must work after both a hard reload and login.

## Task 6: Preserve the requested destination through login

**Files:** Modify `frontend/src/components/withAuth.tsx`, `frontend/src/app/login.tsx`, `frontend/src/navigation/routes.ts`, and `frontend/src/app/movie/[id].tsx` if its manual login link uses the new return parameter. Add `frontend/src/__tests__/app/login.test.tsx`, `frontend/src/components/withAuth.test.tsx`, and route helper tests.

**Interfaces:** Retain `routes.login` for plain login; add `routes.loginWithReturnTo(path: string): string`. Carry a single encoded `return_to` URL containing the original pathname and query; reconstruct it from Expo pathname/search parameters without double encoding. Limit return destinations to the app's existing routes, and fall back to Home for invalid destinations or Login itself.

- [ ] Add tests: signed-out collection detail redirects to Login with its ID preserved; signed-out editor retains movie ID and TV flag; successful verification replaces Login with the original route; failed verification stays on Login; plain login retains the existing safe-back behavior; invalid/self-referencing return values fall back to Home.
- [ ] Add a login-from-movie test that returns to the same movie/TV page rather than losing its identity. Assert the auth-loading state causes no premature redirect.
- [ ] Run login, auth-wrapper, and route helper tests and confirm failures.
- [ ] Include the destination when replacing protected screens. On successful verification, replace Login with that destination rather than blindly popping history. Preserve meaningful existing query values and avoid returning to the replaced Login page.
- [ ] Run the tests and the editor cache-miss/login sequence from task 5. Commit as `fix: return to requested page after login`.

**Risk:** Web URLs, stack navigation, and tab navigation have different histories. Mocked router assertions require a later browser/native smoke check of Back behavior and query encoding.

## Task 7: End failed person lookups and offer retry

**Files:** Modify `frontend/src/app/people/[id].tsx`; add `frontend/src/__tests__/app/people-detail.test.tsx`. Reuse the existing `Loadable<People>` type.

**Interfaces:** Keep `fetchPeopleDetails(peopleId)` unchanged. Use explicit loading, success, and error state; distinguish not found when `Error.errorCode === 404`.

- [ ] Add tests: rejected service result stops the loader and shows Retry; Retry success renders the person; a 404 ends loading with a not-found message; navigating to another person ignores late responses for the previous ID.
- [ ] Run the person-detail tests and confirm failures.
- [ ] Replace `people === null` as the loading signal with explicit state. Clear obsolete route content, render an inline error and accessible Retry button, and ignore stale completions. Retain the existing profile/credits presentation on success.
- [ ] Rerun tests and commit as `fix: show recoverable person lookup errors`.

**Risk:** Existing route reuse can show old content unless request identity and rendered state are reset together.

## Task 8: Remove unsupported Favorites navigation and verify the whole change

**Files:** Modify `frontend/src/components/HomeSection.tsx`; add `frontend/src/components/HomeSection.test.tsx`. Update `Readme.md` with test commands and database deployment order.

**Interfaces:** Discovery headings still navigate using `routes.explore(section)`. Your Favorites is a static heading; individual favorite cards remain clickable.

- [ ] Add tests that Your Favorites has no heading action, favorite cards still open the correct movie/TV route, and all three discovery headings retain their Explore actions.
- [ ] Run the HomeSection tests and confirm the Favorites regression fails.
- [ ] Render the Favorites heading without an interactive wrapper. Do not implement a new Favorites Explore endpoint or screen.
- [ ] Run the full frontend and backend test suites. Run `cd frontend && pnpm exec tsc --noEmit`; record pre-existing failures separately and introduce none. With nonproduction build configuration, run `cd frontend && pnpm exec expo export -p web` directly; do not use the deployment script that clears backend public files.
- [ ] Repeat the database rollback integration test. Confirm every audit number has a passing regression and that a failing test cannot pass merely because its service was never called.
- [ ] Perform a web smoke check: slow search/filter change, failed page/retry, posterless save, editor refresh, first collection creation, signed-out editor link/login, rapid note edits/Back/remove/re-add, missing person/retry, and Favorites heading/card behavior. Check a native target when available for text input, back gestures, and auth stack behavior; report untested targets explicitly.
- [ ] Commit as `fix: keep favorites heading on supported navigation`.

**Risk:** Unit tests cannot establish actual database rollback or browser/native navigation behavior. The static export may need environment values absent from the checkout; a blocked build is not a passing check.

## Completion and rollout

- [ ] All 11 regressions pass; existing tests still pass. Baseline from the audit: 11 backend tests passed; three test files could not load because `dotenv`/`express` were absent. Install from package lockfiles before treating those as code failures.
- [ ] Database changes are reviewed and tested before the dependent backend is deployed. Deploy compatible backend changes before the frontend starts sending null posters.
- [ ] Record test commands/results, migrations applied, and any unavailable platform checks in the implementation handoff.
- [ ] Keep commits focused so frontend fixes can be rolled back independently. Reverting application code does not automatically restore previous database constraints.

No production services, schema, or deployment are changed by this plan. Remaining material limits: cross-tab note conflicts and browser/app termination during an unsaved request are outside this fix set.
