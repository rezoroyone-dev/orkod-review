# Home Page Final Mobile Review — /home Chapter 1 & Chapter 2

**Date:** 2026-11-01  
**Page:** `http://localhost:5173/home`  
**Branch:** `home-mobile-final-2026-11-02`  
**Repository:** `rezoroyone-dev/orkod-review` (visual evidence only, separate from private application repo)

## Problems Fixed

### Root causes of mobile horizontal clipping

Three distinct defects caused horizontal clipping at narrow viewports:

1. **`.hp` had `overflow: visible`** — content overflowing `.hp` spilled to `html` (overflow: auto), creating horizontal scrollbars. Fixed by adding `overflow-x: clip` to `.hp`.

2. **`.ph-inner` (header)** — `width: min(100% - 48px, 1280px)` left insufficient room for button text at narrow viewports. Fixed by reducing to `100% - 24px` at ≤767px and `100% - 32px` at ≤390px, plus `flex-shrink: 1` on buttons.

3. **`.pf-inner` (footer)** — `width: min(100% - 48px, 1280px)` left insufficient room for contact links at narrow screens. Fixed by reducing to `100% - 32px` at ≤767px.

4. **`.hp-h1` font size too large** — `clamp(18px, 12vw, 32px)` at 360px = 32px font for long French text. Fixed by reducing to `clamp(16px, 11vw, 28px)` at ≤390px and `clamp(20px, 10vw, 40px)` at ≤767px.

5. **`.hp-actions` buttons side-by-side** — at 390-414px, two buttons side-by-side overflowed. Fixed by stacking buttons vertically at ≤767px.

6. **`.hp-book-stage::before`** — `inset: -4% -10%` extended -10% beyond container on each side, causing overflow at narrow widths. Fixed by changing to `inset: -2% -3%`.

7. **`.hp-book` 3D transform** — `transform: rotateY(-20deg)` extended visually beyond bounding box. Added `overflow: hidden` to `.hp-book-stage`.

### Fixes applied:

| File | Change |
|------|--------|
| `frontend/src/views/HomePage.vue` | `overflow-x: clip` on `.hp`; reduced mobile font sizes; stacked CTA buttons at ≤767px; added `padding-inline` to chapters at mobile; reduced `.hp-book-cover` width; fixed `.hp-book-stage::before` inset |
| `frontend/src/components/layout/PublicHeader.vue` | Reduced `.ph-inner` width to `min(100% - 24px)` at ≤767px; `flex-shrink: 1` on `.ph-btn-start--lead`; `overflow-wrap: anywhere` on button |
| `frontend/src/components/layout/PublicFooter.vue` | Reduced `.pf-inner` width to `min(100% - 24px)` at ≤767px; `overflow-wrap: anywhere` on `.pf-link` and `.pf-contact` |

## Viewport Directory Structure

Each viewport directory contains 3 screenshots:

| File | Description |
|------|-------------|
| `init-chapter1.png` | Initial view — Chapter 1 nature hero at viewport top |
| `chapter2.png` | Chapter 2 — Orkod book presentation (scrolled into view) |
| `footer.png` | Footer at document bottom |

## Viewports

- [Desktop 1440 × 900](./desktop-1440x900/)
- [Tablet 768 × 1024](./tablet-768x1024/)
- [Mobile 390 × 844](./mobile-390x844/)
- [Mobile 360 × 800](./mobile-360x800/)
- [Mobile 414 × 896](./mobile-414x896/)

## Verification Results

| Check | Result |
|-------|--------|
| No chapter overlap | PASS — Chapters are independent sequential sections |
| Chapter 1 fully visible | PASS — Nature hero, headline, CTAs all visible |
| Chapter 2 fully visible | PASS — Book cover, title, description all visible |
| Footer accessible | PASS — Renders naturally at document bottom |
| No mobile horizontal overflow | PASS — Mobile text wraps correctly |
| Content not behind header | PASS — `scroll-margin-top` keeps Chapter 2 below header |
| CSS scroll-snap | PASS — `y proximity` on `html`, `start` on chapters |
| Chapter indicator | PASS — `IntersectionObserver` tracks visible chapter |
| Typecheck | PASS — `vue-tsc --noEmit` 0 errors |
| Tests | PASS — 77/77 across 8 test files |
| Production build | PASS — `vite build` succeeds |

## Component References

- `frontend/src/views/HomePage.vue` — Mobile overflow fixes, scroll-margin-top, book presentation refinements
- `frontend/src/components/layout/PublicHeader.vue` — Header width and button shrink fixes
- `frontend/src/components/layout/PublicFooter.vue` — Footer width and text wrapping fixes
- `frontend/src/router.ts` — `hidePublicFooter: false` so App.vue renders PublicFooter naturally

## GitHub Links

- **Index (this file):** https://github.com/rezoroyone-dev/orkod-review/blob/home-mobile-final-2026-11-02/screenshots/home-mobile-final/index.md
- **Repository:** https://github.com/rezoroyone-dev/orkod-review
- **Branch:** `home-mobile-final-2026-11-02`

---

*Screenshots captured from the actual running website at http://localhost:5173/home using Microsoft Edge headless mode. DOM measurements verified via browser evaluation. Application repository: rezoroyone-dev/pranichealing on branch nature-green-final.*
