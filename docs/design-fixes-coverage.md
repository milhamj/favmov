# Design audit fix coverage

Source: [2026-11-07 audit](design-audit-2026-11-07.md), imported from `audit/design-2026-11-07` while retaining the newer application fixes on this branch. Changes preserve routes, callbacks, validation, OTP, collection/notes persistence, image-viewer behavior, existing light identity and 404 composition. No dependency or service/configuration changes.

| Finding | Delivered | Remaining limit |
| --- | --- | --- |
| F1 text contrast | Secondary/count/helper text uses #666; small links use #B8321C; amber rating text uses #8A5700. Focused contrast checks cover white and field surfaces. | Approved white-on-tomato primary and selected-chip treatment remains a documented contrast exception. Existing destructive appearance is retained. No application-wide AA claim. |
| F2 accessible controls | Persistent field/action names; selected/expanded/checked/disabled/busy states; 48px control targets. Header actions have real layout slots. Checkbox row is a single control with Enter/Space support and busy/disabled guards. | Native effective targets, screen-reader output and browser keyboard behavior require runtime validation. |
| F3 buttons | Shared AppButton for existing primary and destructive text actions; consistent white bold 16px labels, geometry and disabled/loading feedback. Retry retains message-only behavior. | Existing compact/full-width placement remains caller-owned. |
| F4 shared roles | Extended existing colors; consumed typography/spacing/radius and repeated row-elevation roles; shared buttons/fields use the existing identity. | No redesign or theme framework introduced; page-specific composition remains local. |
| F5 cards | Shared 16px row titles/14px captions and regular notes; movie posters use 2:3 in rows and credits, people portraits retain 3:4. Compact grid captions remain intentional. | Runtime enlarged-text/crop checks pending. |
| F6 fields | Shared 16px field typography, padding, radius/border, readable placeholders, persistent names and 48px minimum height. OTP and notes behavior preserved. | Runtime enlarged-text checks pending. |
| F7 responsive grids | Search, Explore and Collections share measured inner-content widths and 16px gap. Odd final items stay half-width; collection pastels derive from stable IDs. | Layout-event tests verify sizing rules; browser/native resize and scrollbar rendering have not been measured. |
| F8 states | Shared EmptyState and equivalent FullPageLoader usage; existing paging spinners remain. Home, Collections and collection detail now show persistent failures with Retry, separately from legitimate empty results. Collection row status/error text uses semantic caption colors. | Successful/empty/guest behavior and save protections are covered by regression tests; runtime walkthrough pending. |
| F9 404 payload | Lossless IDAT recompression reduced PNG from 532,815 to 531,267 bytes (1,548 bytes, 0.29%). Every non-IDAT chunk is byte-preserved; decoded RGBA SHA256 is identical. | Larger savings would require a separate visual/palette decision; artwork was not redrawn or quantized. |

## Verification

- Final iteration frontend Jest: 30 suites, 336 tests passed; includes auth, search, collections, notes, navigation, details and routes.
- TypeScript `--noEmit` passed; `git diff --check` passed.
- Impeccable mechanical detector returned `[]`; this does not establish runtime accessibility compliance.
- Static web export passed for all 16 routes using process-only nonsecret placeholders, after the initial no-env attempt failed at existing environment decoding. This is a build smoke check; no live-service validation or deployment was performed.
- No browser, screen-reader, enlarged-text or iOS/Android walkthrough was performed. Earlier audit/404 screenshots do not establish application-wide runtime quality.

The plan/code review loop and verification evidence are recorded in `docs/superpowers/plans/iteration-*-report.md` (local workflow records) and [progress](design-fixes-progress.md).
