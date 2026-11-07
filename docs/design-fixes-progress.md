# Nonbreaking design audit fixes

Authority: docs/design-audit-2026-11-07.md. Preserve existing navigation, data, validation, OTP, notes persistence, image viewer, and custom 404. No new dependencies. Keep tomato/white primary contrast exception documented; darken only independent text roles. Changes remain in this existing isolated worktree and branch.

## Iteration 1 — tokens and text actions
Extend styles/colors.ts with existing semantic surface/text/action roles; add small typography, spacing, radius definitions only as consumed. Add AppButton(label, onPress, disabled, loading, destructive, style) preserving compact/full-width caller layouts. Migrate Login, Go home, Retry, collection Save/Create and empty-state actions, profile logout. Preserve callbacks, labels, errors, validation and spinners; expose disabled/busy states and 48px targets. Add focused tests for action/loading/disabled behavior; run existing auth, collections, not-found, component tests and TypeScript. Record primary contrast exception. Leave structural field, card and state work for later iterations.

## Iteration 2 — fields and accessibility
Plan after iteration 1 review is clean: shared field styles, persistent accessible input names, selected/expanded state, named 48px header actions and checkbox row targets. Preserve dismissal, OTP and save behavior.

## Iteration 3 — cards and layout
Plan after iteration 2 review is clean: typography, poster ratios, secondary/link/rating contrast, resize-safe grids and stable collection palette by ID. Preserve distinct card/media roles.

## Iteration 4 — state presentation and verification
Plan after iteration 3 review is clean: shared empty/loading/error presentation; Home failures with focused regression. Investigate lossless 404 PNG optimization only if tools available, retain original if no verified improvement. Run full frontend checks and available non-browser checks; document runtime gaps and audit coverage.

## Loop ledger
- Setup: source report imported from audit branch; current branch retains newer application fixes.
- Iteration 1: plan awaiting subagent review.
- Iteration 1 plan review: accepted. AppButton retains accessibilityLabel during loading and disables presses with busy/disabled state. Preserve Retry message-only behavior, trimmed-name validation, in-flight dismissal prevention and errors. Caller-owned widths/margins stay intact. Migrations: app/login.tsx, app/+not-found.tsx, components/RetryButton.tsx, components/CreateCollectionSheet.tsx, app/(tabs)/collection.tsx, app/collection/add.tsx, app/(tabs)/profile.tsx. Tests: __tests__/unit/components.test.tsx plus focused AppButton coverage and existing auth/login/collections/not-found suites. Change email, Resend OTP and Leave without saving stay separate text actions; accessibility follows in iteration 2. Remove superseded styles/imports only.
- Iteration 1 scope clarification: migrate collection/[id].tsx's equivalent filled Search Movies or TV Shows action as well; parent accepted this caller addition.
- Iteration 1 complete: plan review corrections applied; independent code review clean (code_review_1), scoped 60/60 and TypeScript pass. Broad-suite notes timeout pending final verification.
- Iteration 2 plan: iteration-2-plan.md, awaiting independent review.
- Iteration 2 plan review: checkbox row/keyboard action/TopBar fixtures clarified and implemented.
- Iteration 2 code review round 1: Space activation missing for custom checkbox under react-native-web 0.19; fix + regression check in progress. Scoped 118/118 and TypeScript passed before review.
- Iteration 2 complete: Space-key regression fixed (red→green), relevant 62/62 and TypeScript pass; scoped independent re-review clean (re_review_2).
- Iteration 3 plan: iteration-3-plan.md, awaiting review.
- Iteration 3 plan review: odd last row explicit sizing, shared elevation and all secondary/link consumers clarified.
- Iteration 3 code review round 1: outer FlatList width can include classic web scrollbar; fix to inner usable content width plus regression in progress. Prior scoped 83/83 and TypeScript pass.
- Iteration 3 complete: inner-content width fix + differing outer/content width regression; 83/83 and TypeScript pass, scoped re-review clean (re_review_3).

Detailed iteration plans and reviewer adjustments are recorded below. Implementation reports live in the ignored local workflow folder; this tracked file keeps the review trail with the source changes.
# Iteration 2 — fields and accessible controls

Authority: docs/design-audit-2026-11-07.md F2/F6, after iteration 1 clean review.

1. Inspect all TopBar callers and TextInput/Checkbox controls before editing. Reuse iteration-one tokens. Add shared field styles (16px text, 48px min-height, 8px radius, readable placeholder, padding and border) in existing styles area; preserve search and multiline notes variants. Avoid a field wrapper unless repeated markup requires it.
2. Migrate login email/OTP, CreateCollectionSheet name, search input and CollectionAddCard notes. Add persistent accessibilityLabel values matching existing visible names/tasks. Preserve values, focus refs, editable flags, OTP flow, errors and save timing. Replace fixed field heights with minHeight; allow text enlargement.
3. Extend TopBar icon descriptor with a required human label; migrate home Search and collection Add callers. Render named button wrappers with real 48x48 layout slots; preserve title alignment as far as possible and remove overlapping negative-margin target trick. Back button also gets a real slot. Header remains 56px tall.
4. SelectableChip exposes role button and selected state, and 48px minimum target. ExpandableText exposes a button and expanded state using existing See More/See Less callbacks. Label and enlarge CollectionAddCard checkbox target to a minimum 48px row without adding a second interactive control; preserve one mutation per press and disabled semantics. Name/change email, resend OTP and discard actions; expose disabled state and 48px target. Use existing platform focus behavior; do not suppress outlines.
5. Add focused tests for named header buttons, selected/expanded state, input names, checkbox single toggle/disabled. Reuse existing auth/editor/notes tests for behavior. Run affected Jest suites and tsc.

No data/service/navigation changes. Keep all pending-save/dismissal protections and contrast exception. No dependencies. Reviewer must check native/web semantics and avoid nested interactive checkbox targets.

Plan review corrections accepted:
- Checkbox uses one labeled 48px row control with checkbox role and checked/disabled/busy state. Small expo-checkbox is decorative/noninteractive inside (no nested focus/toggle). Update existing direct checkbox test locators to semantic row; assert one mutation and disabled/busy prevention.
- See More/Less uses a keyboard-operable TouchableOpacity/Pressable, not clickable Text alone.
- Update unit/components.test.tsx TopBar icon fixture for required human label.
# Iteration 3 — card hierarchy, contrast and responsive grids

Authority F1/F4/F5/F7. Begin only after iteration 2 code review clean.

1. Read CollectionCard callers, collection page column layout, Search and Explore FlatLists, MovieCardHorizontal, PeopleCardHorizontal and PeopleMovieCreditView. Keep card domains separate.
2. Replace module-load Dimensions collection sizing with current container sizing. Prefer two flex columns with equal cell wrappers and a 16px gap, so each is (available width - gap)/2, including odd last rows. CollectionCard fills its cell and uses square aspectRatio. Apply same shared width/gap policy to Search/Explore movie grids; people list remains full-width. Avoid window-size arithmetic where parent width suffices. Test resize and odd rows with layout assertions on renderer's actual cell structure.
3. Replace random collection color with deterministic small pastel palette indexed by stable collection ID hash. No persistence or dependency. Add tests same ID keeps color on remount; different IDs deterministically choose allowed palette colors.
4. Reuse shared tokens: 16px bold movie/person row titles, 14px caption ratings/notes at normal weight; movie posters 2:3 in row and credits, preserving people crop. Keep compact grid captions intentionally 12px. Page/section titles follow 24/20px roles. Apply relevant surface/border/shape/text tokens in affected existing local styles, no universal card abstraction.
5. Darken secondary helper/count text to #666, small text links to contrast-compliant accent-text role, yellow rating text to a readable amber. Preserve green/red rating semantics and tomato/white primary/selected-chip exception. Verify text contrast mathematically against white and actual field surfaces with a small focused test.
6. Run affected browse/search/people/collection/component suites and tsc. Add meaningful tests for new deterministic logic and equal-width layout rules; no snapshot churn for every literal style.

No navigation, data, callbacks, auth or save changes. Preserve white surfaces, warm auth/profile variant, viewer and artwork. No new dependencies.

Plan review corrections accepted:
- Odd final rows must retain half-width cells: use parent onLayout-measured width and (contentWidth - 16)/2 for explicit cells, or an equivalent shared gutter policy demonstrably preserving half width; plain flex:1 on odd last cell is insufficient. Test layout event resizing + odd row rules, do not call Jest assertions measured renderer verification.
- Share repeated movie/person row elevation values as a consumed style token.
- Explicitly migrate HomeSection and ExpandableText text links plus all existing COLORS.text_gray consumers; selected filled chips retain their documented primary contrast exception.
# Iteration 4 — state presentation and final coverage

Authority F8/F9, after iteration 3 code review clean.

1. Read existing empty/loading/error cases in Search, Explore, Collections, collection detail/add and HomeSection before editing. Introduce only a small EmptyState presentation with existing optional illustration, title, optional description/action. Reuse tokens for spacing/type. Migrate equivalent repeated empty markup without merging distinct query-empty, no-results, unauthenticated, failure or loading branches. Keep 404 custom composition/artwork.
2. Reuse FullPageLoader in equivalent full-loading cases; retain small paging spinners. Style collection row saving/error status using semantic caption/error roles, preserve existing logic and Retry callbacks. Do not transform a failed fetch into empty state.
3. HomeSection error must keep section heading and show error plus Retry that refetches that section; empty/idle/unauthenticated favorites continue existing behavior. Add regression tests failure visible, Retry recovers, legitimate empty stays separate. Preserve successful navigation and favorites refresh behavior.
4. Investigate existing 404 PNG compression with installed lossless tooling only. No optimizer installed at controller inspection (optipng/pngcrush/oxipng absent). Preserve artwork unchanged if no verified lossless reduction is feasible; document F9 optional follow-up rather than add dependency/redraw.
5. Verify focused state tests, all frontend Jest tests, TypeScript, web export (without deployment) if feasible. Run mechanical detector once on changed UI. Record unavailable browser/enlarged-text/screen-reader/native checks honestly. User requested source fixes/review loop, not browser automation. Final coverage document maps F1-F9 to delivered changes, exception and deferred runtime validation.

Preserve all service contracts, navigation routes, auth/OTP/notes behavior, primary contrast exception and image viewer. No new dependencies. Review against the complete audit for remaining nonbreaking items; no expansion into redesign, deployment or primary palette replacement.

F9 investigation detail: ffmpeg is installed (Impeccable context found it); try lossless PNG recompression to a temporary file using its existing encoder. Compare decoded RGBA hashes and file size, retain only if byte-identical decoded pixels and smaller. No redraw, palette quantization or added dependency. If no win, record measured result and keep original.

Plan review corrections accepted:
- Collections and collection detail need persistent initial error + Retry states (not empty invitation or blank list). Test failure, retry recovery and legitimate empty separately; preserve existing toast callbacks, create refresh and notes behavior.
- PNG candidate must preserve/verify color-profile/gamma metadata in addition to identical decoded RGBA pixels. Reject a candidate stripping display metadata. A simple stdlib lossless IDAT recompression that preserves all other chunks is also acceptable if installed ffmpeg cannot preserve metadata; only retain a measured reduction. No visual changes.

## Final loop outcome

- Iteration 1: plan feedback applied; code review clean; scoped 60/60 tests and TypeScript passed.
- Iteration 2: plan feedback applied; code review found missing checkbox Space activation on web; fixed with regression coverage, 62/62 relevant tests and TypeScript passed; independent re-review clean.
- Iteration 3: plan feedback applied; code review found scrollbar-inclusive grid width; fixed using inner content measurement with regression coverage, 83/83 tests and TypeScript passed; independent re-review clean.
- Iteration 4: plan feedback applied (persistent collection errors and PNG metadata preservation); code review clean.
- Final independent review of the accumulated change: spec compliance and code quality approved, no remaining findings.
- Final controller verification: 30/30 Jest suites, 336/336 tests; TypeScript and git diff --check passed. Static web export passed for 16 routes with synthetic process-only environment values. Mechanical detector returned no findings.
- No dependency/config/service changes or deployment. Browser/native/screen-reader/enlarged-text runtime checks remain unperformed. Approved tomato-white contrast exception remains documented.

Full audit mapping: [design-fixes-coverage.md](design-fixes-coverage.md).
