# ORKOD Final Release Evidence (nature-green-final @ 2b45160)

Date: 2026-11-07. App repo: `rezoroyone-dev/pranichealing`, branch `nature-green-final`, commit `2b45160e62692b586e757d798ba6f956aef4fdff` (pushed, `0 0` vs `github/nature-green-final`). No redesign; accepted pages/features preserved.

## Focused responsive verification (real browser measurements)
Priority pages: `/` (LanguageGate), `/home`, `/start`, `/body`, `/conditions`.
Viewports (EN): 1440x900, 768x1024, 390x844, 360x800. Checks: horizontal overflow (`scrollWidth>clientWidth+2`), page/console errors (non-NAV), failed requests (excl. favicon), raw i18n keys (`UPPER_SNAKE` patterns), overlap heuristic. **Result: 0 overflow, 0 page errors, 0 failed requests, 0 raw i18n keys across 20 checks.** Batch JSON: `audit/b1_1440.json b1_768.json b1_390.json b1_360.json`.

Arabic RTL (locale via `orkod.locale=ar` / LanguageGate): 1440x900, 768x1024, 390x844, 360x800 for the 5 priority pages. **Result: `dir=rtl`, `rtl=rtl`, `lang=ar`, 0 overflow, 0 raw i18n keys, 0 page errors** across tested RTL batches (`ar3_*`, `arfix_*`). Locale key is `orkod.locale` (`frontend/src/utilities/locale.ts`).

Quick desktop nav (1440x900): `/book /practitioners /doctors /academy /community /consultations /assistant /family /symptoms /donations /contact /login` all HTTP 200, final URLs correct, 0 overflow/raw keys/page errors (`audit/navq.json`).

## Critical flows
- `/donate` -> `/donations` preserved. `/quiz` -> `/login?redirect=/quiz`. `/booking` -> `/login?redirect=/booking`.
- Body explorer functional: Brain/Heart/Left Hand/Right Hand selectable with correct detail/pill titles (`audit/body_evidence.json`). 7 organ colors/geometry/model preserved; sage-green hand highlighting preserved (not changed; not human GPU-aesthetic-confirmed).
- Conditions: 10 systems, search/filter/clear, disclaimer/safety, localized data (`reviewNote` structures present). Home/start accepted layouts preserved; book preparation/not-for-sale preserved.

## Application verification (nature-green-final)
- `make typecheck` (`vue-tsc --noEmit`): PASS.
- `make test` (safe, 9 files incl. Router.unit, no backend/DB): **9 files, 91 tests PASS**. Targeted router+i18n parity: 10/10 PASS.
- `make build` (non-destructive): PASS (Vite+PWA 156 entries, ~9362.47 KiB). `make verify`: PASS.
- `make lint` read-only: **expected pre-existing baseline FAIL** — 1221 problems (1169 errors, 52 warnings), 6 fixable. No mass autofix/suppress/weaken. Backend integration tests/host `:9091` remain environmental.

## Screenshots (inspected: openable, correct dimensions, non-blank variance)
| Evidence | Raw |
|---|---|
| Desktop home 1440 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/desktop_home_1440.png) |
| Mobile home 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/mobile_home_390.png) |
| Mobile Start 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/mobile_start_390.png) |
| Body selected organ (Heart) 1440 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/body_organ_heart_selected_1440.png) |
| Body both hands selected 1440 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/body_both_hands_selected_1440.png) |
| Conditions 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/mobile_conditions_390.png) |
| Arabic RTL home 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/ar_rtl_home_390.png) |
| Arabic RTL start 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/ar_rtl_start_390.png) |
| Arabic RTL body 1440 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/ar_rtl_body_1440.png) |
| Arabic RTL conditions 360 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/ar_rtl_conditions_360.png) |
| Arabic RTL home 768 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/ar_rtl_home_768.png) |
| Arabic LanguageGate/start 1440 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/final-release-2026-11-07/shots/ar_rtl_gate_or_start_1440.png) |

## Genuine remaining blockers
- **Human GPU visual confirmation** of sage-green hand highlight (DOM/functional + real-GPU captures exist; agent cannot perceive pixels).
- **Repo-wide lint debt** (pre-existing 1221 problems) — not release-blocking for this pass, but should be scheduled.
- **Backend integration tests** require host-mapped Go backend/DB context (environmental).
- AR full-site (all routes/locales) was not exhaustively re-certified beyond priority pages + quick desktop nav; priority pages RTL/overflow/raw-key checks passed.
