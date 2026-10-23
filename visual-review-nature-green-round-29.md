# Orkod â€” Nature Green Design Review (Round 29)

Branch: `visual-review/nature-green-round-29`  
Base: `visual-review/nature-green-round-28` (R28 nav/snap approved, imagery A/B published)  
App HEAD at review time: `c8013f5` (working tree intentionally uncommitted; R27 security findings remain outstanding/report-only)

## What shipped this round

### 1) Homepage hero â€” approved Option A ("The Road")
- Asset: Wikimedia Commons `File:The Road - Seems like it's the way to the heaven on earth.jpg` (bertvthul, CC0 Public Domain). Downloaded/reprocessed by `frontend/scripts/gen/art_direct_round29.py`.
- Replacements (with backups in `frontend/public/images/nature/_originals/`): `home-forest.jpg` 1920Ã—1080 q78 (494 KB), `home-forest.webp` 489 KB, `home-forest-mobile.jpg` 1080Ã—1620 q76 (342 KB), `home-forest-mobile.webp` 291 KB.
- Grade: subtle shadow-green, +6% contrast, +4% saturation, +2% brightness, warm 0.35, vignette 0.16, unsharp. Mobile portrait crop anchored to the lit path (left 32%). `HomePage.vue` uses `<picture>` (mobile WebP+JPEG source, desktop WebP source + JPEG fallback), explicit width/height, `fetchpriority="high"`.
- Served verification: desktop served `home-forest.webp` (1920Ã—1080), mobile served `home-forest-mobile.webp` (1080Ã—1620); **local vs served SHA-256 matched** (`DAB5FD5221A7BFA0`, `D950E8C4009D943C`). No console errors.

### 2) Section 02 â€” reprocessed "Beech and ferns" (natural brightness, no blur)
- Asset: `File:Beech and ferns in Gullmarsskogen.jpg` (W.carter, CC0). Reprocessed without blur: shadow-green 0.16, +10% contrast, +2% saturation, +6% brightness (mean lum 74â†’95, max 220â†’255), vignette 0.20.
- Replacements: `ch2-forest.jpg` 1920Ã—1080 q80 (722 KB), `ch2-forest.webp` 751 KB. Served `ch2-forest.webp` verified; **SHA-256 matched** (`CF06B54F32D65ED5`).
- HomePage: `<picture>` with WebP source; `.hp-hero-veil` lightened (0.6 left); localized `.hp-book-veil` radial pools (24%/82%); removed `brightness(0.96)` CSS filter â†’ `saturate(1.02) contrast(1.02)`. No book-cover redesign.

### 3) `/body` explorer â€” premium nature-green redesign (primary)
- **Stage-first** composition in `frontend/src/views/public/BodyExplorer3D.vue` (3 columns: anatomy navigator / 3D stage / insight panel), with a refined header (back, eyebrow, title, reset). `HumanBody3D.vue` unchanged in model/camera/attribution/brain-fix logic.
- **Anatomy navigator**: elegant vertical list with a "Full body" row (separate class, does **not** affect the official 7-item test contract), organ items numbered `01â€“07`, soft illuminated active capsule with organ-color hairline, accessible names/focus/touch targets.
- **3D stage**: subtle framed glow behind figure, calm stage caption, thin framed ring. Single WebGL canvas, preserved Meshopt decoding, **brain in upper cranial cavity** (anchor relY 0.37â€“0.38, centered), no duplicate contexts, accurate organ positioning, smooth camera focus.
- **Insight panel**: editorial card with organ-color accent, "Read more" â†’ organ page, "Book consultation" â†’ booking; richer empty state listing all 7 organs (clickable). Leader-line callout (dot on organ â†’ pill in margin, no overlap) on wide stages, hidden on mobile.
- **RTL**: mirrors UI (navigator right, panel left) via locale class while **keeping the 3D model un-mirrored**; AR mobile column collapse bug fixed.
- **i18n**: added `Body_3D_Whole_Body`, `Body_3D_Organ_Selected`, `Body_3D_Start_Here` to `en`/`fr`/`ar`/`id`. All 4 locales verified.
- **Preserved**: language-gate composition + photograph, premium green/gold book-cover design, exactly two homepage sections, minimal `01`/`02` nav, smooth snap scrolling, all 7 organs, brain fix, attribution, no RTL mirroring of model, no duplicate WebGL contexts.

## Screenshots (this branch)
All files in `screenshots/nature-green-round-29/`:

| Shot | Notes |
|---|---|
| `homepage-ch01-desktop.png` / `homepage-ch01-mobile.png` | Approved hero (Option A "The Road"), WebP served. |
| `homepage-ch02-desktop.png` / `homepage-ch02-mobile.png` | Reprocessed beech/ferns, natural brightness, no blur. |
| `homepage-rail-ch01-desktop.png` / `homepage-rail-ch01-mobile.png` | Minimal numbered rail state on chapter 01. |
| `homepage-rail-ch02-desktop.png` / `homepage-rail-ch02-mobile.png` | Minimal numbered rail state on chapter 02. |
| `body-default-desktop.png` / `body-default-mobile.png` | Redesigned `/body` explorer, default state. |
| `body-selected-brain-desktop.png` | Brain selected â€” cranial positioning intact. |
| `body-selected-heart-desktop.png` | Heart selected with detail panel + callout. |
| `body-selected-lungs-desktop.png` | Lungs selected (correctly distinct). |
| `language-gate-desktop.png` / `language-gate-mobile.png` | Language gate unchanged. |
| `login-desktop.png` / `login-mobile.png` | Login. |
| `donations-desktop.png` / `donations-mobile.png` | Donations. |

## Verification (automated + browser)
| Check | Result |
|---|---|
| `npx vue-tsc --noEmit` | **PASS** (exit 0) |
| `eslint` (touched: `BodyExplorer3D.vue`, `HomePage.vue`) | **PASS** (exit 0) |
| `scripts/locale-parity.mjs` | **PASS** (0 missing refs, 0 unreferenced) |
| `scripts/raw-key-scan.mjs` | **PASS** (all public routes, no raw keys) |
| `scripts/static-color-scan.cjs` | **PASS** (PUBLIC 0 / ADMIN 17 / UNUSED 6 â€” pre-existing admin/unused) |
| `scripts/check-framing.mjs` | **PASS** (full body framed on 390Ã—844 / 834Ã—1112 / 1280Ã—800 / 1440Ã—900 / short viewports) |
| `C:\Users\abdol\AppData\Local\Temp\opencode\r29-verify-body.mjs` | **PASS** (5 viewports: organs 7 + full-body row, selection, callout, Escape, overflow, console) |
| `C:\Users\abdol\AppData\Local\Temp\opencode\audit-body.mjs` | **PASS** (47/0 â€” desktop+mobile EN/AR, brain/heart/lungs selection, callout on desktop, hidden on mobile, RTL, keyboard, reset, framing, console clean) |
| `C:\Users\abdol\AppData\Local\Temp\opencode\audit-journeys.mjs` | **PASS** (47/0) |
| `C:\Users\abdol\AppData\Local\Temp\opencode\audit-routes.mjs` | **PASS** (315/0) |
| `C:\Users\abdol\AppData\Local\Temp\opencode\asset-usage.mjs` | **INFO** (479 images / 181 referenced / 298 unreferenced â€” includes historical `preview/**`) |
| `npx vite build` (frontend, no `postbuild.mjs` copy) | **PASS** (exit 0, PWA 147 precache entries) |
| `npx vitest run src/tests/BodyExplorer.interaction.test.ts` | **PASS** (6/6) |
| Brain anchor (desktop) | **relY 0.37â€“0.38, relX 0.50** â€” upper cranial cavity, centered, not across face |
| WebGL contexts | **1** on all tested viewports; no duplicates |
| RTL (`ar`) | **mirrored UI** (navigator right / panel left), **model un-mirrored**, no overflow, canvas renders |

## Manifests / assets
- `frontend/public/images/nature/ASSETS.md` rewritten (hero rows, reprocessed ch2, `_originals/` recoverable).
- `frontend/public/images/nature/SOURCES.json` updated (`home-forest` added, ch2 updated, `verifiedVia` records).
- Originals preserved in `frontend/public/images/nature/_originals/`.

## Notes
- No Go backend/DB changes. No `README.md`/`Makefile` modified. No files staged/committed/pushed from the app repo. Only this review repo updated.
- Image viewing unavailable in environment; visual claims limited to measured DOM/geometry, served headers/paths, SHA-256, and Playwright assertions.
- Pre-existing items (unrelated): admin/purple tokens, plaintext test creds, Go handler findings, Vitest backend `ECONNREFUSED <ipv4>:9091` (backend not started), global `window.onerror` null-events (resource-level, site-global).

