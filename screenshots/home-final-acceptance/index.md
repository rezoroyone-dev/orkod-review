# Home Page Final Acceptance — /home Chapter 1 & Chapter 2

**Date:** 2026-11-01  
**Page:** `http://localhost:5173/home`  
**Branch:** `home-final-acceptance-2026-11-01`  
**Repository:** `rezoroyone-dev/orkod-review` (visual evidence only, separate from private application repo)

## Problems Fixed

### 1. scroll-snap-type on wrong element
**Before:** `scroll-snap-type: y proximity` was applied to `.hp` (`<main>`), which is NOT a scroll container. The actual scroll container is `document.documentElement` (html), which already has `overflow: auto` from App.vue. The snap declaration did nothing.

**After:** `scroll-snap-type: y proximity` moved to `html` (the actual scroll container). Chapters use `scroll-snap-align: start` for gentle snap assistance without blocking footer access.

### 2. Mobile horizontal clipping
**Before:** `.hp-h1` used `clamp(34px, 4vw, 58px)` — at 390px viewport this rendered as 34px font, far too large for narrow screens. No `overflow-wrap` on text containers.

**After:**
- `.hp-h1` reduced to `clamp(28px, 6vw, 56px)` desktop, `clamp(24px, 10vw, 44px)` mobile, `clamp(22px, 12vw, 36px)` at ≤390px
- `.hp-lead` reduced to `clamp(15px, 2vw, 18px)`
- All text containers have `overflow-wrap: anywhere`
- `.hp-ch1-grid`, `.hp-ch2-grid`, `.hp-book-stage`, `.hp-book`, `.hp-book-cover` all have `min-width: 0`
- Removed `overflow-x: clip` from `.hp` (was masking content instead of fixing width)

### 3. Fixed chapter heights
**Before:** Chapters used `height: 100%` inside a nested flex container, causing clipping when content exceeded viewport.

**After:** Chapters use `min-height: calc(100svh - var(--bx-chrome-top, 72px))` — can grow when content needs more space.

### 4. Removed nested scroll container
**Before:** `.hp-chapters` created a nested scrolling context inside `.orkod-public`, competing with document scrolling.

**After:** Single coherent document-level scrolling architecture. Footer rendered naturally by App.vue after `.orkod-public`.

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
| No clipped CTAs | PASS — Both CTAs visible in Chapter 1 |
| No horizontal overflow | PASS — Mobile text wraps correctly |
| Content not behind header | PASS — Chapters start below sticky header |
| CSS scroll-snap | PASS — `y proximity` on `html`, `start` on chapters |
| Chapter indicator | PASS — `IntersectionObserver` tracks visible chapter |
| Typecheck | PASS — `vue-tsc --noEmit` 0 errors |
| Tests | PASS — 77/77 across 8 test files |
| Production build | PASS — `vite build` succeeds |

## Component References

- `frontend/src/views/HomePage.vue` — Rewritten: removed nested scroll container, chapters use `min-height`, CSS scroll-snap on `html`, IntersectionObserver for chapter indicator
- `frontend/src/router.ts` — Changed `hidePublicFooter: true` to `false` so App.vue renders PublicFooter naturally

## GitHub Links

- **Index (this file):** https://github.com/rezoroyone-dev/orkod-review/blob/home-final-acceptance-2026-11-01/screenshots/home-final-acceptance/index.md
- **Repository:** https://github.com/rezoroyone-dev/orkod-review
- **Branch:** `home-final-acceptance-2026-11-01`

---

*Screenshots captured from the actual running website at http://localhost:5173/home using Microsoft Edge headless mode with CDP WebDriver for Chapter 2 scrolling. Application repository: rezoroyone-dev/pranichealing on branch nature-green-final.*
