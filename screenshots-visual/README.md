# ORKOD Visual Review — Post-Recovery

**Date:** 2026-10-28  
**Branch:** `visual-review-2026-10-28`  
**Dev server:** http://localhost:5173  
**Browser:** Headless Edge (Chromium) — `--use-gl=angle --use-angle=swiftshader`

Targeted visual corrections after the recovery audit. All seven files were intact and functional; this branch shows the before/after of the applied visual refinements.

## /start — StartJourney.vue

**Fixes applied:**
- Replaced the question-mark placeholder (`⍰`) on the quiz choice with the real `start-preview-quiz.jpg` preview image
- Boosted the body preview image from `opacity: 0.55` + `grayscale(0.15)` to `opacity: 0.85` + `grayscale(0.05)` so the anatomical figure is recognizable and correctly framed
- Removed 4 unused variable declarations (cleaned by ESLint)

| Viewport | Screenshot |
|---|---|
| Desktop (1440x900) | [start-desktop.png](start/start-desktop.png) |
| Mobile (390x844) | [start-mobile.png](start/start-mobile.png) |
| Mobile-narrow (360x800) | [start-mobile-narrow.png](start/start-mobile-narrow.png) |

## /home — HomePage.vue

**Fixes applied:**
- Added `padding-bottom: clamp(64px, 10vh, 120px)` to `.hp-chapters` so the footer never sits too tight against chapter 2's content
- Added a `scrollend` fallback (120ms timer) for browsers without `scrollend` event support, preventing the "halfway-between-chapters" problem
- Chapters now meet cleanly (0px gap between chapter 1 and chapter 2 on scroll)

| Viewport | Full page |
|---|---|
| Desktop (1440x900) | [home-desktop.png](home/home-desktop.png) |
| Mobile (390x844) | [home-mobile.png](home/home-mobile.png) |
| Mobile-narrow (360x800) | [home-mobile-narrow.png](home/home-mobile-narrow.png) |

## /body — BodyExplorer3D.vue + HumanBody3D.vue

**Fixes applied:**
- Lightened the 3D stage background from `#04120B` (near-black) to `#0c1e18` (deep slate) so anatomy reads with detail at all zoom levels
- Updated `orkod-public.orkod-stage` and `.v-application.app-stage` in `App.vue` to match (`#0c1e18`)
- All lighting and organ colors preserved untouched

| View | Screenshot |
|---|---|
| Body default (desktop viewport) | [body-desktop.png](body/body-desktop.png) |
| Body default (mobile) | [body-mobile.png](body/body-mobile.png) |
| Body default (mobile-narrow) | [body-mobile-narrow.png](body/body-mobile-narrow.png) |
| Brain | [body-brain.png](body/body-brain.png) |
| Lungs | [body-lungs.png](body/body-lungs.png) |
| Heart | [body-heart.png](body/body-heart.png) |
| Liver | [body-liver.png](body/body-liver.png) |
| Stomach | [body-stomach.png](body/body-stomach.png) |
| Intestines | [body-intestines.png](body/body-intestines.png) |
| Kidneys | [body-kidneys.png](body/body-kidneys.png) |

## Verification Results

| Check | Result |
|---|---|
| Typecheck (`vue-tsc --noEmit`) | PASS |
| Build (`vite build`) | PASS (62s) |
| Tests (31 selected) | ALL PASS |
| `/start` — single heading, both cards, both CTAs | PASS |
| `/start` — quiz uses image not question mark | PASS |
| `/start` — no horizontal overflow | PASS |
| `/home` — both chapter headings visible | PASS |
| `/home` — chapters meet cleanly (0px gap) | PASS |
| `/home` — footer below chapter 2 | PASS |
| `/home` — no horizontal overflow | PASS |
| `/body` — 3D renders (`human3d--ready`) | PASS |
| `/body` — stage bg is `#0c1e18` not black | PASS |
| `/body` — all 7 organs selectable with callouts | PASS |
| Console errors | 0 |
