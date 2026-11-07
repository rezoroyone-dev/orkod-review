# ORKOD /start preview CONTAINER display fix (portrait 4:5)

App: `rezoroyone-dev/pranichealing` `nature-green-final` @ `4c2d20b16766245f96f06554b5010d49bfb80ac5` (`fix(start): make preview containers true 4:5 portraits (remove landscape max-height caps)`). Pushed 0↔0; `main` untouched. No content/model/catalogue/auth/routes changes.

## Problem fixed (display, not content)
Source images were already good (chrome-free actual 3D model, real 6-choice quiz, #102b1e). The **preview containers** rendered landscape because `max-height: clamp(320px,42vh,460px)` overrode `aspect-ratio:4/5` (measured before fix: 1440 `538×378 ar 1.423`, 768 `692.6×399.4 ar 1.734`).

## Change (`frontend/src/views/StartJourney.vue` only)
- `.start-choice-preview` now drives size by width with `aspect-ratio:4/5; height:auto; width:calc(100% - 16px); box-sizing:border-box`; **removed conflicting `max-height` landscape caps** (desktop/tablet/mobile). Padding minimal (4–5px). `img` remains `width/height 100%; object-fit:contain` inside the portrait container.

## Actual rendered container measurements (proof, not image aspect)
All preview containers (both cards) render **exactly `ar 0.8` (w/h = 4:5)**:

| Locale | Viewport | Preview container (w×h) | ar (w/h) | natural | src | href |
|---|---:|---:|---:|---:|---|---|
| EN | 1440×900 | 538×672.5 | **0.8** | 560×700 | body/quiz-explorer/preview-mobile | /body,/quiz |
| EN | 768×1024 | 692.6×865.7 | **0.8** | 743×929 | mobile | /body,/quiz |
| EN | 390×844 | 340×425 | **0.8** | 366×457 | mobile | /body,/quiz |
| EN | 360×800 | 310×387.5 | **0.8** | 336×420 | mobile | /body,/quiz |
| AR (RTL) | 1440×900 | 538×672.5 | **0.8** | 560×700 | mobile | /body,/quiz |
| AR (RTL) | 390×844 | 340×425 | **0.8** | 366×457 | mobile | /body,/quiz |
| FR | 390×844 | 340×425 | **0.8** | 366×457 | mobile | /body,/quiz |
| ID | 360×800 | 310×387.5 | **0.8** | 336×420 | mobile | /body,/quiz |

0 horizontal overflow (`scrollWidth<=clientWidth`), `dir/lang` correct (AR rtl/ar), Skip present, 01→`/body`, 02→`/quiz` (auth gate preserved). Interactions verified: 01→`/body`, 02→`/login?redirect=/quiz`, Skip→`/home`. Full-page screenshots captured.

## Full-page screenshots (fresh)
| | Raw |
|---|---|
| EN 1440 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/start_en_1440.png) |
| EN 768 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/start_en_768.png) |
| EN 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/start_en_390.png) |
| EN 360 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/start_en_360.png) |
| AR 1440 RTL | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/start_ar_1440.png) |
| AR 390 RTL | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/start_ar_390.png) |
| FR 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/start_fr_390.png) |
| ID 360 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/start_id_360.png) |
| verify.json | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-container-fix-2026-11-07/verify.json) |

## Verification
`make typecheck` PASS · `make test` 9 files/91 tests PASS · `make build` PASS (non-destructive) · `make verify` PASS. Body/quiz assets unchanged (body still chrome-free 4:5 1000×1250, `#102b1e`).
