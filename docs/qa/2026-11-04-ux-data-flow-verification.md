# UX/data-flow fixes — verification

Implemented all 11 audit findings in application code and migration scripts. The
owner's schema supplied on 2026-11-05 confirmed non-cascading collection foreign
keys and NOT NULL poster paths. These previously excluded database changes are
now implemented and tested in disposable PostgreSQL; they have **not** been
applied to live Supabase. Database rollout remains required before application
deployment. Historical exclusion notes below describe earlier review stages.

## Automated checks

- Frontend: `pnpm test --runInBand` (60 tests across 10 suites).
- Backend: `pnpm test` (42 tests, including poster validation and deletion contracts).
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


## Custom Back follow-up

Validated comment 6632963563: the custom Back button called the save operation
before navigation, which caused the removal guard to re-enter an already active
operation and drop the blocked action. The button now calls Back directly; the
supported removal guard owns saving and replaying navigation exactly once.

A real-container regression presses the actual custom Back button with a deferred
note save and verifies the editor remains during saving, stays open on failure,
and reaches Home on success or successful retry. Both cases failed against the
previous handler. Mock-based tests now exercise the guard callback explicitly
rather than implying that a router call proves the screen was removed.


## Ponytail sub-agent review

A fresh sub-agent reviewed the full PR and connected callers at head e296bb8,
assuming normal multi-user use with slow or failed requests. It reproduced two
must-fix findings. Both were validated again with permanent failing regressions:

1. Failed removal canceled a dirty note's autosave without resuming it. Failed
   removal now reschedules saving only when the retained draft differs from the
   saved text. A deferred-delete test proves no write runs during deletion, then
   the draft saves after deletion fails. Successful deletion still cancels saves.
2. Successful creation followed by a failed collection-list refresh offered no
   Retry and did not invalidate other screens. Creation now invalidates the store
   immediately, and list failure shows an inline Retry without another creation
   request or loss of the selected title. Existing cards remain mounted.

The full frontend suite (48 tests) and TypeScript passed after both fixes. The
review did not cover physical native gestures, live services, or database behavior;
the existing Supabase exclusions and cross-tab/app-termination limits still apply.


## Completeness and cleanup review (comment 6643294579)

Validated and fixed the navigation trap for permanent note-save failures. Failed
leave attempts now show a persistent page-level message and an explicit Leave
without saving action. That action disables prevention before replaying the stored
navigation action. A real-container regression verifies the failed route stays
mounted until discard, then reaches Home without another save request.

Restored membership-first collection ordering (stable within each group), long-title
ellipsis, and a neutral loading heading. Unsupported Explore sections show the
empty state without an impossible Retry. Permanent regressions cover each case.
All six Retry controls now use a shared styled button with at least a 44-point
touch target and disabled-state support.

Removed unused imports, the redundant Favorites check inside its discovery-only
branch, and the debounce hook's unused argument/flush API. Navigation save draining
still calls the card's save operation directly. Removed unused Navigation 6 stack
and tab dependencies and pinned the community CLI to the pre-PR 18.0.0 version.
Poster normalization remains at both request and server trust boundaries to keep
the agreed null-on-wire contract; the committed plan remains as historical context
and is superseded by this QA record where cleanup changed its proposed interfaces.

The frontend suite passed 52 tests after these changes. One cold full-suite run
hit the previous 5-second navigation test timeout; rerunning with the bounded
15-second test timeout passed. No timing assertions were weakened or sleeps added.


Chromium verification with mocked authenticated services passed: enter the editor
from a movie, edit a note, return a permanent 404 for saving, use browser Back,
verify the draft stays visible, then explicitly discard and reach the movie. No
uncaught page errors occurred. The check also confirmed an Expo web-history
limitation: browser Back updates the URL before its reset action is blocked, so
while the failed editor stays mounted the URL can show the previous page. Explicit
discard completes that navigation; this change does not manipulate the router's
internal browser-history bookkeeping to hide the mismatch. Prefer in-app Back
when preserving a failed draft, and do not reload while edits are unsaved.

The final web export passed with placeholder nonproduction configuration. Physical
native gestures and live services remain unverified. Backend code did not change
in this follow-up; the previous 36-test backend pass was not rerun.


## Ten-finding follow-up

Validated findings 1–6 and simplified 8–10. Permanent regressions first failed for
hidden-screen auth redirects, failed membership navigation, clean editor prevention,
stale failure banners, incomplete movie caches, and the search debounce flash.

- Only the focused protected screen redirects to Login. Destination updates do
  not themselves re-fire the redirect effect, preserving the focused route/query.
- Membership promises return success/failure. Failed adds/removes retain their
  intended operation and offer Retry; a pending failed membership change prevents
  leaving until retry succeeds or the user explicitly discards it.
- Cards report dirty/saving/membership work to the editor. Clean, loading, and
  error pages do not enable removal prevention. When all card work is confirmed,
  the page clears its obsolete leave-failure banner and stored blocked action.
- Placeholder cached movies without a title fall back to detail fetching. The
  existing string-param helper parses the ID before strict numeric validation.
- Nonempty search/filter changes show loading throughout debounce. Removed the
  dead reset argument and duplicate result clearing.
- Removed the duplicate membership-busy ref and the hidden-header menu option.

Finding 7 remains explicitly excluded: no live schema was available and the owner
previously requested skipping Supabase-dependent items. Poster nullability must be
verified before rollout; a successful validation mock does not establish storage
compatibility. No database migration or backend change was made in this follow-up.

The frontend suite passed 60 tests and TypeScript passed. Physical native gestures
and live services remain untested. Previously documented browser URL behavior can
still occur when dirty work actually blocks browser Back; clean exits now bypass
the guard entirely.


An independent review of this follow-up found that the reused string-param helper
threw on an already-decoded percent sign. A new failing editor regression now
covers `movie_id: '%'`; the shared parser tolerates malformed encoding so strict
numeric validation can show Invalid title URL without a service request. The
reviewer found no other concrete issue in the new pending-state or auth flows.


## Database follow-up — 2026-11-05

The owner-supplied schema confirms the exact collection FK names/types and poster
nullability. Added transactional cascade and nullable-artwork migrations plus
explicit rollback SQL. The controller now performs one parent delete after the
existing ownership lookup, with the same response envelope and user filters.

Observed RED→GREEN: four controller cases failed because the old implementation
issued child deletes; all 42 backend tests now pass. The real SQL test initially
failed because the cascade was absent. After both migrations it passed for dev
and prod: movie/TV entries cascade, an injected parent AFTER DELETE failure
preserves the parent and both notes, other collections/users remain intact, RLS
prevents another user's deletion, and null poster inserts succeed.

Both rollback scripts and reapplication passed. An orphan fixture deliberately
blocked the cascade migration; assertions confirmed both old constraints and the
orphan data survived unchanged. The fixture was cleaned, migrations reapplied,
and the main SQL test passed again. No user data or live services were accessed.

Deployment instructions are in `backend/db/README.md`. Apply schema changes before
the dependent API/frontend. Custom live triggers were not supplied or inspected;
the local fixture reproduces relevant constraints and SELECT/DELETE RLS only.
Poster rollback was also tested with an existing null poster: it failed while
preserving that row and all four nullable column definitions. Live Supabase
behavior remains unverified.
