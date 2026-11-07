# FavMov component style audit

Date: 2026-11-07. Scope: the styling and interaction declarations across all 31 TSX files under `frontend/src/components` and `frontend/src/app`, plus the existing color definitions and assets. This is a source-based audit and consolidation proposal, not an implementation or deployment.

## Verdict

FavMov has a recognizable visual identity, but it is maintained by copying values between pages. Shared behavior exists; shared visual rules are incomplete. The smallest useful improvement is a small token file and a few controls reused by the existing pages—not a new UI framework or a redesign.

The baseline should preserve the user's choices: white pages, pale gray headers, tomato (`#FF6347`) accents, system fonts, and white bold primary-button labels matching Login. The image viewer's black canvas, destructive actions, semantic ratings, and custom 404 illustration are intentional exceptions, not defects to flatten into one appearance.

## Source audit health

These scores describe implementation evidence only. They are not a native-platform certification or measured runtime-performance grade.

| Dimension | Score | Evidence |
| --- | --- | --- |
| Accessibility | 2/4 | Some named buttons and explicit roles; measured contrast failures and missing labels/selection states remain. |
| Performance | 3/4 | Virtualized browse/search lists and thumbnail helpers already exist; the decorative 404 asset is relatively large. Frame timing was not measured. |
| Appearance and theming | 1/4 | Existing tokens cover ratings and two grays; brand, text roles, spacing, and controls remain page-local. Light-only appearance is explicitly configured and is not counted as a defect. |
| Responsive layout | 2/4 | Flexible layouts exist, but collection sizes are captured once and grid percentages conflict with fixed gaps at narrow widths. |
| Implementation consistency | 2/4 | Reusable navigation and state components exist; buttons, fields, cards, and empty states still diverge. |
| Total | 10/20 | Significant consolidation is warranted within the current visual identity. |

Nine grouped findings: two P1, six P2, one P3. No P0 task-blocking issue established by this audit. The mechanical web detector returned no findings; manual source checks below found issues outside its rules. Native interaction behavior remains unverified.

## Findings

### F1 — P1: text colors fail contrast in several roles

**Category:** accessibility. **Evidence:** `app/login.tsx:297`, `app/+not-found.tsx:43`, `components/SelectableChip.tsx:24`, `components/HomeSection.tsx:136`, `components/ExpandableText.tsx:74`, `styles/colors.ts:5`, `components/CollectionAddCard.tsx:174`.

- White on tomato, and tomato on white, measure approximately **2.95:1**. This affects 16px primary labels, selected chip labels, and small inline actions. Normal text needs 4.5:1 under WCAG AA; bold 16px is not large text.
- `#888` on white is **3.54:1**, affecting small rating counts and collection helper text. The notes placeholder `#898989` on white is **3.50:1**.
- Yellow rating text `#F9A825` on white is approximately **1.97:1**. Ratings also show numbers, so this is a readability issue rather than a color-only meaning issue.

**Impact:** important actions and secondary information are harder to read for low-vision users.

**Recommendation:** keep the explicitly selected tomato/white primary appearance as the current product decision; record its contrast exception and do not silently switch labels back to dark. A future AA-compliant primary treatment needs an explicit visual decision. Independently move small secondary text to `#666`, and give text links and rating text sufficiently dark semantic colors. Audit placeholder colors against the actual field surface.

**Suggested follow-up:** `$impeccable harden`; resolve the primary-color exception before claiming AA compliance.

### F2 — P1: controls lack a consistent accessibility contract

**Category:** accessibility. **Evidence:** `components/TopBar.tsx:46`, `components/SelectableChip.tsx:37`, `components/CollectionAddCard.tsx:163`, `components/CreateCollectionSheet.tsx:78`, `app/login.tsx:178`.

Header action icons are passed a glyph name and callback without a human-readable accessibility label. Chips do not expose a selected accessibility state. Collection checkboxes are rendered at 18×18 without an explicitly enlarged labeled row target. Form labels/placeholders do not consistently provide persistent, programmatically associated names.

**Impact:** screen-reader users cannot reliably identify actions or selection state; small standalone controls are harder to operate by touch. An 18px visual checkbox can remain, but its interactive region should be larger. Native effective hit regions must be measured rather than inferred from the visual alone.

**Recommendation:** standardize named icon actions, selected/disabled/busy states, input labels, and a minimum 48×48 layout target for standalone controls. Preserve header alignment by designing its layout slot and hit region together; negative margins alone do not establish the effective native target size.

**Suggested follow-up:** `$impeccable harden`, then `$impeccable adapt`.

### F3 — P2: the same action has different button styling and state feedback

**Category:** implementation consistency. **Evidence:** `components/RetryButton.tsx:14`, `app/login.tsx:296`, `components/CreateCollectionSheet.tsx:168`, `app/+not-found.tsx:43`, `app/(tabs)/collection.tsx:178`, `app/collection/add.tsx:228`, `app/(tabs)/profile.tsx:130`.

Login uses white 16px bold labels, a 5px radius, and 15px padding. Go home uses the same label treatment but a 6px radius and 12px/24px padding. Create Collection/Save use an 8px radius. Retry still has `#222` semibold text with no explicit size, despite its tomato background. Some actions show a spinner, some disable without any changed appearance, and Retry uses reduced opacity. The disabled Save button has the same visual styling as the enabled button.

**Impact:** users must relearn which controls are primary, available, or busy. Visual edits drift because each copy must be updated separately.

**Recommendation:** introduce one small `AppButton` for existing text actions with `label`, `onPress`, `disabled`, and `loading`; add a destructive treatment only for existing destructive actions. Use Login's white 16px bold label as the approved primary reference. Standardize radius, padding, target size, and disabled/loading feedback. Keep Retry's error message logic in `RetryButton`, which should render the shared button. Do not merge distinct action widths: full-width form actions and compact inline Retry actions can share visual rules.

**Suggested follow-up:** `$impeccable extract`, then `$impeccable polish`.

### F4 — P2: visual roles are not represented by shared tokens

**Category:** appearance and theming. **Evidence:** `styles/colors.ts:1`, `components/TopBar.tsx:68`, `app/login.tsx:259`, `app/(tabs)/profile.tsx:90`, and the repeated local styles across components.

The existing color object covers ratings, `#888`, and a placeholder background, but not the accent, screen/header/field surfaces, text roles, borders, or destructive actions. A literal-value scan found colors in 21 files and 26 local stylesheets. Local stylesheets themselves are appropriate; repeated semantic values without a shared definition cause the drift.

**Impact:** changing one brand or neutral role requires searching multiple pages, and independent near-matches accumulate.

**Recommendation:** extend the existing styles module with only the roles already used: accent/onAccent, primary/secondary text, page/header/field surfaces, border, destructive, and existing rating colors. Add small typography, spacing, radius, and elevation definitions. Keep page composition in local stylesheets. Preserve the warm auth/profile surface as an explicit surface variant if retained; preserve logout as destructive rather than changing every red action to tomato.

**Suggested follow-up:** `$impeccable extract`.

### F5 — P2: equivalent cards use different text hierarchies and poster crops

**Category:** implementation consistency. **Evidence:** `components/MovieCardHorizontal.tsx:67`, `components/PeopleCardHorizontal.tsx:46`, `components/MovieCard.tsx:45`, `components/people/PeopleMovieCreditView.tsx:82`.

Movie and person rows share an 80px image and similar layout, but movie titles are 12px while person names are 16px. Movie row ratings are 12px; poster-grid ratings are 14px. Notes use a light 300 weight. Movie thumbnails use 2:3 in the grid and 3:4 in rows/credits, changing the crop of the same poster.

**Impact:** titles and metadata change apparent importance between screens; row titles can look less important than their notes, and posters crop inconsistently.

**Recommendation:** define roles rather than forcing every text element to one size: page title 24px bold, section title 20px bold, row title 16px semibold/bold, body 16px regular, caption 14px regular, and 12px only where intentionally compact. Keep avatars and posters as distinct media roles. Use 2:3 for movie posters unless a deliberate compact crop is documented. Share values/styles between rows without inventing a universal card component.

**Suggested follow-up:** `$impeccable typeset`, then `$impeccable polish`.

### F6 — P2: form controls have three unrelated visual treatments

**Category:** implementation consistency. **Evidence:** `app/login.tsx:279`, `components/CreateCollectionSheet.tsx:149`, `app/search.tsx:222`, `components/CollectionAddCard.tsx:209`.

Login fields are filled gray with a 5px radius and 45px fixed height. Collection-name fields use an 8px radius and 45px fixed height. Search is outlined with 8px corners and a 40px minimum height. Notes use a half-pixel border, 4px radius, 4px padding, and 32px minimum height.

**Impact:** the editing vocabulary changes from page to page; compact padding and fixed heights leave less room for enlarged text.

**Recommendation:** share field typography, border, radius, padding, label, error and disabled styles. Use a 48px minimum single-line control height instead of a fixed text-box height. Retain search and multiline/notes variants where their tasks differ. Add only a small labeled field component where repeated structure actually warrants it; notes must keep their existing save/error behavior.

**Suggested follow-up:** `$impeccable extract`, then `$impeccable harden`.

### F7 — P2: grid spacing and collection sizes do not share a responsive rule

**Category:** responsive layout. **Evidence:** `components/CollectionCard.tsx:6`, `components/CollectionCard.tsx:39`, `app/search.tsx:81`, `app/explore.tsx:51`.

Collection card width is computed from `Dimensions.get('window')` at module load, so it does not respond to later resizing. A collection also receives a new random pastel when remounted, weakening visual recognition. Search and Explore combine two 48% items with a 16px gap: below 400px of content width, the declared widths plus the gap exceed the row width. This is a source-level sizing conflict; its final clipping/overflow should be checked on each renderer.

**Impact:** responsive changes can leave stale card sizes, and narrow results grids can become uneven. Color is not a stable visual identifier for a collection.

**Recommendation:** size grids from their current container; calculate columns after subtracting the gap rather than mixing percentages and a fixed margin. Use a small, shared gap and width policy. Preserve the collection pastel treatment with a stable palette assignment by collection ID rather than random remount colors. Do not use the same media layout for every card type.

**Suggested follow-up:** `$impeccable adapt`.

### F8 — P2: loading, empty, and error surfaces repeat styling but differ in behavior

**Category:** implementation consistency. **Evidence:** `components/HomeSection.tsx:88`, `components/FullPageLoader.tsx:4`, `app/search.tsx:179`, `app/explore.tsx:97`, `app/(tabs)/collection.tsx:153`, `app/collection/[id].tsx:142`, `app/collection/add.tsx:200`.

Several pages duplicate the same 120px illustration and 18px empty heading with slightly different spacing and opacity. Loading uses a full-page loader in some places and bespoke containers elsewhere. Home sections disappear for error/empty/idle states, whereas Search and Explore show inline retry feedback. Saving and failure status in collection rows use unstyled text.

**Impact:** failure can look like intentionally absent content; repeated state layouts acquire different spacing and hierarchy over time.

**Recommendation:** share a small empty-state presentation and loading/error styles, with optional illustration and action. Keep error, empty, loading, unauthenticated, and idle states distinct. Retain the custom 404 artwork and page composition. Home section failures need an explicit error state rather than being silently treated as empty; that is a behavior change and should get its own focused regression test.

**Suggested follow-up:** `$impeccable harden`, then `$impeccable polish`.

### F9 — P3: the decorative 404 image has an optional payload improvement

**Category:** performance. **Evidence:** `frontend/assets/not_found_cinema.png` is approximately 521 KiB at 720×480, rendered at up to 320px wide.

**Impact:** more data must load for an error surface. The image is already local, transparent, correctly sized in layout, and not a task blocker.

**Recommendation:** investigate loss-conscious PNG palette optimization, comparing transparency and the soft beam on white. Preserve the current visual; do not redraw, remove the artwork, change its composition, or add a new dependency just to chase a size target. Other app icons are also large on disk, but their actual delivery paths need checking before calling them page-load costs.

**Suggested follow-up:** `$impeccable optimize`.

## Proposed shared baseline

- **Colors:** preserve tomato `#FF6347`; page white; header `#F8F8F8`; field `#F5F5F5`; primary text `#333`; secondary text `#666`; border `#E0E0E0`. Name existing destructive and rating roles separately. Track the chosen white-on-tomato contrast exception.
- **Typography:** keep system fonts; use the role scale in F5. Primary labels stay white, 16px, bold as requested. Retry should adopt the same primary-label role if it remains a filled primary action.
- **Spacing:** use 4, 8, 12, 16, 24, and 32 for recurring layouts. Use 16px page gutters and a constrained form column with 24px internal padding. Do not mass-replace meaningful image dimensions or icon sizes.
- **Shape:** 8px for text controls and small media cards; one named larger radius for panels/sheets. Circle radii remain circles. Different radii are not automatically defects when they describe different component roles.
- **Interactions:** share disabled/loading feedback, named icon actions, focus treatment on web, and accessible selected/expanded states. Target 48px for standalone touch controls without shifting existing title alignment.
- **Layout:** keep `PageContainer` and `TopBar`; standardize their usage and the gaps beneath them. Retain domain-specific grid, row, detail, modal and full-image layouts.

## Smallest useful implementation sequence

1. **Tokens and text actions:** extend the existing styles module, add the minimal shared button, migrate Login, Go home, Retry, Save, collection empty-state actions, and the existing destructive profile action. Preserve callbacks, validation, loading/error logic, labels and routes. No new dependency.
2. **Fields and icon actions:** standardize repeated field styles, persistent accessible names, selection states, and control targets. Retain OTP state, notes persistence, and modal dismissal protections.
3. **Cards and page spacing:** apply shared typography/shape/surface values to existing components, correct responsive sizing, and stabilize collection colors. Share styles first; extract structural components only where duplication remains substantial.
4. **State presentation:** consolidate empty/loading/error styling and explicitly test any changed failure behavior. Preserve the movie/people search distinctions and the custom not-found page.
5. **Bounded verification and polish:** inspect narrow and wide web layouts, enlarged text, focus and keyboard operation; exercise both loading and failure states. Use representative signed-in data. Run existing navigation, search, auth, collection, notes and page-route tests, adding tests only for changed logic. Check iOS/Android appearance and touch behavior when devices are available. Finish with `$impeccable polish` and re-run the audit.

## What already works and should remain

The system font and restrained palette fit a browsing app. `PageContainer`, `TopBar`, `RetryButton`, `SelectableChip`, `ImageViewer`, and `FullPageLoader` already provide useful shared building blocks. Browse/search lists use `FlatList`, and movie thumbnail URLs are separated from full-size images. Safe-back navigation and existing notes/error handling must survive the style work. Semantic rating colors and the black full-image viewer are useful intentional differences.

## Limits and delivery

Only this report was added. No component style, behavior, deployment, or secret configuration was changed for the audit. The scan and contrast calculations ran locally; no current browser walkthrough, screen-reader session, performance trace, enlarged-text session, or native-device check was performed. Earlier 404-specific browser checks do not establish application-wide quality. Runtime validation belongs in the implementation sequence before shipping unification changes.
