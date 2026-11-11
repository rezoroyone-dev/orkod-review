# ORKOD /start — Background & Edge Polish — Before & After Screenshots

**Branch:** `visual-review/start-background-edge-polish-2026-11-11`  
**Repository:** [rezoroyone-dev/orkod-review](https://github.com/rezoroyone-dev/orkod-review)  
**Application commit:** `9828050` (on `nature-green-final`)

## Issues Fixed

### 1. White Line When Scrolling
Changed `.start-scene` from `height: 100svh` (implicit via layout) to `min-height: 100svh` with explicit `background-color: #F7FAF5`, ensuring the background covers the full scrollable page even when content overflows the viewport.

### 2. White Line on Right Edge
Added `overflow: hidden` to `.start-scene-media` to clip any overflow from `object-fit: cover` scaling on `.start-scene-img`, eliminating the white strip on the right edge. Changed `.start-scene-img` from `height: 100%` to `min-height: 100%` so it stretches properly when `.start-scene` grows.

### 3. Green Heading on White Card
Changed `.start-choice-title` color from `#14532d` (green) to `#18251C` (dark charcoal-green) for premium appearance on white card surfaces.

## Screenshots

### EN — English

| Viewport | Top | Middle | Bottom |
|---|---|---|---|
| 1440×900 | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/en_1440x900_top.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/en_1440x900_top.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/en_1440x900_middle.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/en_1440x900_middle.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/en_1440x900_bottom.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/en_1440x900_bottom.png) |
| 390×844 | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/en_390x844_top.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/en_390x844_top.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/en_390x844_middle.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/en_390x844_middle.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/en_390x844_bottom.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/en_390x844_bottom.png) |

### FR — French

| Viewport | Top | Middle | Bottom |
|---|---|---|---|
| 1440×900 | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/fr_1440x900_top.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/fr_1440x900_top.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/fr_1440x900_middle.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/fr_1440x900_middle.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/fr_1440x900_bottom.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/fr_1440x900_bottom.png) |
| 390×844 | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/fr_390x844_top.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/fr_390x844_top.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/fr_390x844_middle.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/fr_390x844_middle.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/fr_390x844_bottom.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/fr_390x844_bottom.png) |

### AR — Arabic

| Viewport | Top | Middle | Bottom |
|---|---|---|---|
| 1440×900 | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/ar_1440x900_top.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/ar_1440x900_top.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/ar_1440x900_middle.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/ar_1440x900_middle.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/ar_1440x900_bottom.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/ar_1440x900_bottom.png) |
| 390×844 | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/ar_390x844_top.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/ar_390x844_top.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/ar_390x844_middle.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/ar_390x844_middle.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/ar_390x844_bottom.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/ar_390x844_bottom.png) |

### ID — Indonesian

| Viewport | Top | Middle | Bottom |
|---|---|---|---|
| 1440×900 | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/id_1440x900_top.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/id_1440x900_top.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/id_1440x900_middle.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/id_1440x900_middle.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/id_1440x900_bottom.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/id_1440x900_bottom.png) |
| 390×844 | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/id_390x844_top.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/id_390x844_top.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/id_390x844_middle.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/id_390x844_middle.png) | [before](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/before/id_390x844_bottom.png) / [after](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-background-edge-polish-2026-11-11/after/id_390x844_bottom.png) |

## File Count

- 20 before screenshots (4 locales × 5 viewports)
- 20 after screenshots (4 locales × 5 viewports)
- 1 index.md

Total: 41 files
