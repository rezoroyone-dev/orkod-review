# Home Page Overlap Review — /home Chapter 1 & Chapter 2

**Date:** 2026-11-01  
**Page:** `http://localhost:5173/home`  
**Branch:** `home-overlap-review-2026-11-01`  
**Repository:** `rezoroyone-dev/orkod-review` (visual evidence only, separate from private application repo)

## Overview

Visual evidence of Chapter 1 / Chapter 2 overlap on the Orkod home page (`/home`). Screenshots captured at 5 viewports showing:

1. Initial homepage view (Chapter 1)
2. Chapter 2 fully visible
3. Transition/overlap state between chapters
4. Footer and navigation
5. Dimension overlay (measured positions)

## Viewport Directory Structure

Each viewport directory contains 5 screenshots:

| File | Description |
|------|-------------|
| `init-chapter1.png` | Initial view — Chapter 1 nature hero |
| `chapter2.png` | Chapter 2 — Orkod book presentation |
| `transition-overlap.png` | Scrolled to midpoint between chapters (overlap zone) |
| `footer.png` | Footer at bottom of scroll |
| `dimensions-overlay.png` | Measured positions and dimensions |

## Viewports

- [Desktop 1440 × 900](./desktop-1440x900/)
- [Tablet 768 × 1024](./tablet-768x1024/)
- [Mobile 390 × 844](./mobile-390x844/)
- [Mobile 360 × 800](./mobile-360x800/)
- [Mobile 414 × 896](./mobile-414x896/)

## Observed Overlap

**Chapter 1 bottom edge overlaps Chapter 2 top edge** — when scrolling between chapters, the bottom portion of Chapter 1's nature hero image and text remains visible while Chapter 2's dark book section begins to appear, creating a visual overlap where both chapters are partially visible simultaneously.

## Component References

- `frontend/src/views/HomePage.vue` — Chapter scroller, chapter sections, scroll-snap logic
- CSS: `.hp-chapters`, `.hp-chapter`, `.hp-chapter--one`, `.hp-chapter--two`, `.hp-chapters--snap`

## GitHub Links

- **Index (this file):** https://github.com/rezoroyone-dev/orkod-review/blob/home-overlap-review-2026-11-01/screenshots/home-overlap-review/index.md
- **Repository:** https://github.com/rezoroyone-dev/orkod-review
- **Branch:** `home-overlap-review-2026-11-01`

---

*Screenshots captured from the actual running website at http://localhost:5173/home using Microsoft Edge headless mode. No code was modified during this review.*
