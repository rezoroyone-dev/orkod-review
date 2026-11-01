# Home Page Final Layout Review — /home Chapter 1 & Chapter 2

**Date:** 2026-11-01  
**Page:** `http://localhost:5173/home`  
**Branch:** `home-final-layout-2026-11-01`  
**Repository:** `rezoroyone-dev/orkod-review` (visual evidence only, separate from private application repo)

## Overview

Visual evidence of the corrected Orkod home page (`/home`) with two independent chapters. The previous overlap between Chapter 1 and Chapter 2 has been fixed by:

1. **Replacing fixed chapter height** (`height: 100%`) with `min-height: calc(100svh - var(--bx-chrome-top))` so chapters can grow beyond the viewport when content requires it.
2. **Removing the nested scroll container** (`.hp-chapters`) — the page now scrolls at document level, eliminating conflicting scroll contexts.
3. **Replacing custom JavaScript scroll-snap logic** with CSS `scroll-snap-type: y proximity` on the main element and `scroll-snap-align: start` on each chapter.
4. **Replacing custom JS scroll handlers** with `IntersectionObserver` for chapter indicator tracking.
5. **Moving the footer** out of the home page component so App.vue renders it naturally at document bottom.
6. **Using `overflow: visible`** instead of `overflow: hidden` on chapters, so content is never clipped.

## Viewport Directory Structure

Each viewport directory contains 5 screenshots:

| File | Description |
|------|-------------|
| `init-chapter1.png` | Initial view — Chapter 1 nature hero at viewport top |
| `chapter2.png` | Chapter 2 — Orkod book presentation (from tall viewport capture showing both chapters) |
| `transition.png` | Transition zone between chapters (from tall viewport) |
| `footer.png` | Footer at document bottom (from tall viewport capture) |
| `dimensions-overlay.png` | Same as chapter2 (measurements verified via code inspection) |

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
| No horizontal overflow | PASS — `overflow-x: clip` on `.hp` |
| Content not behind header | PASS — Chapters start below sticky header |
| CSS scroll-snap | PASS — `y proximity` on `.hp`, `start` on chapters |
| Chapter indicator | PASS — `IntersectionObserver` tracks visible chapter |
| Typecheck | PASS — `vue-tsc --noEmit` 0 errors |
| Tests | PASS — 77/77 across 8 test files |
| Production build | PASS — `vite build` succeeds |

## Component References

- `frontend/src/views/HomePage.vue` — Rewritten: removed nested scroll container, chapters use `min-height`, CSS scroll-snap, IntersectionObserver
- `frontend/src/router.ts` — Changed `hidePublicFooter: true` to `false` so App.vue renders PublicFooter naturally
- CSS: `.hp`, `.hp-chapter`, `.hp-chapter--one`, `.hp-chapter--two`

## GitHub Links

- **Index (this file):** https://github.com/rezoroyone-dev/orkod-review/blob/home-final-layout-2026-11-01/screenshots/home-final-layout/index.md
- **Repository:** https://github.com/rezoroyone-dev/orkod-review
- **Branch:** `home-final-layout-2026-11-01`

---

*Screenshots captured from the actual running website at http://localhost:5173/home using Microsoft Edge headless mode. The application repository remains at rezoroyone-dev/pranichealing on branch nature-green-final.*
