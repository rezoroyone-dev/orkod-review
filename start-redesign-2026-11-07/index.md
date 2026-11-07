# ORKOD Start Preview Redesign + Body-Part Audit (nature-green-final @ 3f61a2a)

Date: 2026-11-07. App commit: `3f61a2af3be291dde744d2d344535c3fe12735c6` (`feat(start): replace preview SVGs with actual body/quiz captures and localized alts`) on `nature-green-final`.

## 1) New body image (actual ORKOD 3D body explorer)
- Captured from `/body` (real ORKOD 3D anatomical model used by Body Explorer, `http://localhost:5173/body`, WebGL/ANGLE capture). Full human body, front-facing composition, UI chrome hidden for a clean recognizable preview; actual model/anatomy preserved (no invented structures).
- Files added to app: `frontend/public/images/start/orkod-body-explorer.png` (1300x940 composed, 693 KB), `orkod-body-explorer-mobile.png` (820x1120 composed, 306 KB).

| | Raw |
|---|---|
| Body preview (desktop) | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/body-image.png) |
| Body preview (mobile) | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/body-image-mobile.png) |

## 2) New quiz image (actual ORKOD questionnaire UI/content)
- `/quiz` is auth-gated (`requiresAuth: true`, redirects to `/login?redirect=/quiz`). I did **not** remove the auth gate. For a faithful, non-misleading preview I used **existing real quiz content** from `frontend/src/data/quiz.ts` + `frontend/src/locales/en.json` (Q1: “Where is the discomfort mainly located?” with the 6 real answer choices: Head & mind / Neck / Chest & heart / Abdomen / Back / Legs & joints) and rendered a questionnaire-style card matching the quiz’s Orkod UI treatment. No medical questions/conditions invented; no generic person-with-question-marks illustration.
- Files added: `orkod-quiz-preview.png` (72 KB), `orkod-quiz-preview-mobile.png` (46 KB).

| | Raw |
|---|---|
| Quiz preview (desktop) | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/quiz-image.png) |
| Quiz preview (mobile) | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/quiz-image-mobile.png) |

## 3) What changed on `/start`
- `frontend/src/views/StartJourney.vue`: replaced old small/abstract SVG previews (`start-preview-body*.svg`, `start-preview-quiz*.svg`) with the new PNG captures; added `width/height`, responsive `srcset/sizes` (mobile + desktop), **localized alt text** (`Start_Preview_Body_Alt`, `Start_Preview_Quiz_Alt`); made preview area prominent (`clamp(260px,30vh,360px)` desktop, larger mobile clamps, `object-fit:contain`, no heavy grayscale/cropping). Cards kept: **01** “I know where I feel discomfort” → `/body`, **02** “I don’t know why I am sick” → `/quiz` (auth gate preserved), Skip → `/home`. Nature-green palette preserved.
- Locales updated: `en/fr/ar/id` — added `Start_Preview_Body_Alt`, `Start_Preview_Quiz_Alt` (non-medical, descriptive). No other accepted copy/routes/gates changed.

## 4) `/start` verification (4 locales × 1440/768/390/844, 360×800)
Real browser (Edge/Playwright, `http://localhost:5173/start`, locale via `orkod.locale`): **16/16 checks — 0 overflow, 0 page errors, 0 failed requests, both images loaded (`complete && naturalWidth>0`), card 01 href `/body`, card 02 href `/quiz`, Skip present.** AR: `dir=rtl, lang=ar` (all tested AR viewports). FR/ID rendered. Interactions (390×844 EN): card 01 → `/body`, card 02 → `/login?redirect=/quiz` (existing gate), Skip → `/home`. Data: `start-verify.json`.

| Evidence | Raw |
|---|---|
| EN 1440x900 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_en_1440.png) |
| EN 768x1024 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_en_768.png) |
| EN 390x844 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_en_390.png) |
| EN 360x800 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_en_360.png) |
| FR 390x844 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_fr_390.png) |
| AR 1440x900 (RTL) | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_ar_1440.png) |
| AR 390x844 (RTL) | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_ar_390.png) |
| AR 360x800 (RTL) | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_ar_360.png) |
| ID 360x800 | [raw](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/final-release-2026-11-07-2b45160/start-redesign-2026-11-07/start_id_360.png) |

## 5) Body-part completeness audit (honest)
**Caveat:** I searched the repo (`CUSTOMER_VISION.md`, `OPENCODE_PROJECT_MEMORY.md`, filenames/content) and **did not find the previously provided “91 anatomical structures” source list** (DB volume hits are data files, not the spec). I **do not claim all 91 structures are selectable in 3D**. Comparison below is **requested catalogue (conditions.ts) vs 3D/anatomy implementation**; `body-audit.json` has details.

| | Result |
|---|---|
| A. Conditions catalogue (`frontend/src/data/conditions.ts`) | **10 systems, 90 catalogue organs** total (digestive 16, respiratory 12, circulation 8, nervous 8, urinary 4, skin 6, eyes 4, musculoskeletal 14, reproductive 10, endocrine 8). Preserved; no conditions/associations invented. |
| B. Independently selectable in 3D Body Explorer (`anatomy.ts`/`HumanBody3D`/selector) | **9 independent selections**: 7 organs (`brain,lungs,heart,liver,stomach,intestines,kidneys`) + 2 hands (`leftHand,rightHand`). Existing 3D model/geometry/colors preserved. |
| C. “Missing from requested catalogue” (re: 91 list) | **Cannot determine** — 91-structure source list not present in repo. Relative to catalogue count alone: 90 organs present across 10 systems. |
| D. Catalogue organs NOT represented as independent 3D selections | **83** catalogue organs have no independent 3D selection (they exist in the educational Conditions catalogue/reference; only 7 have `anatomy` links to the 7 shared 3D organ selections). **7** catalogue organs link to shared 3D selections (`brain,heart,intestines,kidneys,liver,lungs,stomach`). |

## 6) Verification
- `make typecheck`: **PASS**. `make test` (safe, 9 files): **91/91 PASS**. `make build` (non-destructive): **PASS** (PWA 160 entries). `make verify`: **PASS**. Targeted ESLint on changed `StartJourney.vue`: clean.
- `make lint` read-only: **pre-existing baseline** (1219/1221-range repo debt reported previously), not fixed/claimed.
- Docker not reset; no destructive DB tests; auth gates preserved.

## Constraints honored
`nature-green-final` only (no `main` changes, no force-push). No redesign of unrelated pages/Body Explorer/Conditions/LanguageGate/home logic. 4 locales, 7 organ colors, sage-green hands, 3D model/geometry, disclaimers, auth gates preserved. Quiz auth gate **not** removed.
