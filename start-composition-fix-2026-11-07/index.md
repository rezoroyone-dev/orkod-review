# ORKOD /start preview composition fix (nature-green-final @ a183764)

App commit: `a183764d688d53d8f7d153795e01a0dda594d50b` (see git) — `fix(start): enlarge/crop body and quiz preview composition for clarity`. No 3D model/Conditions/catalogue/auth/routes redesign.

## Images
- **Body**: recaptured from actual ORKOD `/body` 3D model (UI chrome hidden, WebGL). Cropped to full human figure (head-to-feet), composed to dominate on a clean deep-green background (`#102b1e`). Actual anatomy/7 organ colors preserved; no invented/redrawn anatomy. Desktop 1200×1619 (figure ~86% width), mobile 860×1159.
- **Quiz**: real ORKOD questionnaire content preserved (Q1 + 6 real choices from `quiz.ts`/locales). Cropped excessive blank space; question/choices large/readable. Desktop 1320×880 (~93% width fill), mobile 860×1100 single-column portrait (all 6 choices, ~92% width fill). Auth gate not removed.

| | Raw |
|---|---|
| Body | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/body-image.png) / [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/body-image-mobile.png) |
| Quiz | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/quiz-image.png) / [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/quiz-image-mobile.png) |

## `/start` layout changes (`StartJourney.vue`)
- Preview containers enlarged (`clamp(300px,38vh,430px)` desktop; larger mobile clamps), reduced side margin/padding (10px/6px desktop, 6–8px tablet/mobile), `img` fills container (`width/height 100%`, `object-fit:contain`). Body preview uses deep-green frame background to match capture. `srcset/sizes/width/height` updated. Two numbered cards, text, links, Skip, 4 locales, localized alt text, nature-green identity preserved.

## Verification (EN/FR/AR/ID × 1440×900, 768×1024, 390×844, 360×800 = 16)
**0 overflow, 0 page errors, 0 failed requests, both images loaded, card 01→`/body`, card 02→`/quiz` (auth flow preserved), Skip present.** AR: `dir=rtl, lang=ar`. Measured rendered image fill vs preview box: **~97% width / ~96% height** (EN/AR 1440/390 samples). Interactions: 01→`/body`, 02→`/login?redirect=/quiz`, Skip→`/home`.

| Evidence | Raw |
|---|---|
| EN 1440 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/start_en_1440.png) |
| EN 768 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/start_en_768.png) |
| EN 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/start_en_390.png) |
| EN 360 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/start_en_360.png) |
| AR 390 RTL | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/start_ar_390.png) |
| FR 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/start_fr_390.png) |
| ID 360 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/start_id_360.png) |
| verify.json | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-composition-fix-2026-11-07/verify.json) |

`make typecheck` PASS; `make test` 9 files/91 tests PASS; `make build` PASS (non-destructive); `make verify` PASS. Lint baseline pre-existing (read-only).

