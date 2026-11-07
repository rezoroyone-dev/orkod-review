# ORKOD /start final image presentation fix

App: `rezoroyone-dev/pranichealing` `nature-green-final` @ `19597537e405333087e58f8b44f2f17b366bee8d` (`fix(start): chrome-free 4:5 body capture and balanced portrait preview frames`). Pushed; `main` untouched; no 3D model/Conditions/catalogue/auth/routes redesign.

## 1) Body image — chrome-free, actual HumanBody3D only
- Captured **only the `canvas`** from `/body` (`HumanBody3D` actual render) with site/public header, nav, logo/donation/login, bx-bar, selectors, callouts, and controls hidden; deep-green stage `#102b1e`. Full human body head-to-feet, centered; **actual 7 organ colours/anatomy preserved**; no invented/redrawn anatomy. Attribution remains in app (`/public/models/anatomy/ATTRIBUTION.md`, existing).
- Automated PNG inspection: top strip near-deep-green (`corner (16,43,30)`, low non-chrome variance), figure spans ~25–1220 of 1250px (head-to-feet). Assets: `body-image.png` 1000×1250 (4:5), mobile 800×1000.
- [body desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/body-image.png) · [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/body-image-mobile.png)

## 2) Quiz image — readable, full 6 answers
- **Real questionnaire content preserved** (Q1 + 6 real choices from existing quiz data/locales). Portrait composition, full question + all 6 answers visible/readable, no destructive crop; ~92% internal width/height fill. Auth gate **not removed**. 1000×1250 (4:5) + 800×1000 mobile.
- [quiz desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/quiz-image.png) · [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/quiz-image-mobile.png)

## 3) Balanced previews (`StartJourney.vue`)
- **Matching portrait-oriented 4:5 preview frames** for both cards (`aspect-ratio: 4/5`, responsive `max-height` clamps, minimal padding 4–5px). Both assets 1000×1250/800×1000 (4:5). `img` `width/height 100%`, `object-fit:contain`; `srcset` 800w/1000w, `sizes` responsive (`min(560px,46vw)` desktop). Rendered fill vs preview box: **~97–98% width / ~97% height** (1440: 0.978/0.968; 390: 0.971/0.968). Full content visible; no distortion. `currentSrc`/natural dims verified (mobile assets selected at tested breakpoints with `nw/nh` matching rendered).

## 4) `/start` verification (EN/FR/AR/ID × 1440×900,768×1024,390×844,360×800)
**0 overflow, 0 page errors, 0 failed requests, both images loaded, localized alts present, 01→`/body`, 02→`/quiz`, Skip→`/home`. AR `dir=rtl, lang=ar`.** Interactions: 01→`/body`, 02→`/login?redirect=/quiz` (auth gate preserved), Skip→`/home`.

| Evidence | Raw |
|---|---|
| EN 1440 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/start_en_1440.png) |
| EN 768 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/start_en_768.png) |
| EN 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/start_en_390.png) |
| EN 360 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/start_en_360.png) |
| AR 1440 RTL | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/start_ar_1440.png) |
| AR 390 RTL | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/start_ar_390.png) |
| FR 390 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/start_fr_390.png) |
| ID 360 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/start_id_360.png) |
| verify.json | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-presentation-fix-2026-11-07/verify.json) |

## 5) Tests
`make typecheck` **PASS** · `make test` **9 files/91 tests PASS** · `make build` **PASS** (non-destructive, PWA 160 entries) · `make verify` **PASS**. Lint baseline pre-existing/read-only.

*Automated pixel/DOM inspection confirms no header chrome on body assets and full-figure/content signals; I cannot human-view PNG pixels.*
