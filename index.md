# ORKOD /start — Background & Edge Polish — Before & After Screenshots

**Branch:** `visual-review/start-background-edge-polish-2026-11-11`  
**Repository:** [rezoroyone-dev/orkod-review](https://github.com/rezoroyone-dev/orkod-review)  
**Application commit:** `9828050` (on `nature-green-final`)

## Issues Fixed

### 1. White Line When Scrolling
Changed `.start-scene` to `min-height: 100svh` with explicit `background-color: #F7FAF5`, ensuring the background covers the full scrollable page without white gaps.

### 2. White Line on Right Edge
Added `overflow: hidden` to `.start-scene-media` to clip `object-fit: cover` overflow from `.start-scene-img`. Changed `.start-scene-img` to `min-height: 100%` so it stretches to cover the full scrollable area.

### 3. Green Heading Color
Changed `.start-choice-title` color from `#14532d` (green) to `#18251C` (dark charcoal-green) for premium appearance on white card surfaces.

## Screenshots

All viewports: 1440×900, 1366×768, 768×1024, 390×844, 360×800  
All locales: EN, FR, AR, ID

### EN — English

| Viewport | Top | Middle | Bottom |
|---|---|---|---|
| 1440×900 | [before](before/en_1440x900_top.png) / [after](after/en_1440x900_top.png) | [before](before/en_1440x900_middle.png) / [after](after/en_1440x900_middle.png) | [before](before/en_1440x900_bottom.png) / [after](after/en_1440x900_bottom.png) |
| 1366×768 | [before](before/en_1366x768_top.png) / [after](after/en_1366x768_top.png) | [before](before/en_1366x768_middle.png) / [after](after/en_1366x768_middle.png) | [before](before/en_1366x768_bottom.png) / [after](after/en_1366x768_bottom.png) |
| 390×844 | [before](before/en_390x844_top.png) / [after](after/en_390x844_top.png) | [before](before/en_390x844_middle.png) / [after](after/en_390x844_middle.png) | [before](before/en_390x844_bottom.png) / [after](after/en_390x844_bottom.png) |
| 360×800 | [before](before/en_360x800_top.png) / [after](after/en_360x800_top.png) | [before](before/en_360x800_middle.png) / [after](after/en_360x800_middle.png) | [before](before/en_360x800_bottom.png) / [after](after/en_360x800_bottom.png) |

### FR — French

| Viewport | Top | Middle | Bottom |
|---|---|---|---|
| 1440×900 | [before](before/fr_1440x900_top.png) / [after](after/fr_1440x900_top.png) | [before](before/fr_1440x900_middle.png) / [after](after/fr_1440x900_middle.png) | [before](before/fr_1440x900_bottom.png) / [after](after/fr_1440x900_bottom.png) |
| 390×844 | [before](before/fr_390x844_top.png) / [after](after/fr_390x844_top.png) | [before](before/fr_390x844_middle.png) / [after](after/fr_390x844_middle.png) | [before](before/fr_390x844_bottom.png) / [after](after/fr_390x844_bottom.png) |

### AR — Arabic

| Viewport | Top | Middle | Bottom |
|---|---|---|---|
| 1440×900 | [before](before/ar_1440x900_top.png) / [after](after/ar_1440x900_top.png) | [before](before/ar_1440x900_middle.png) / [after](after/ar_1440x900_middle.png) | [before](before/ar_1440x900_bottom.png) / [after](after/ar_1440x900_bottom.png) |
| 390×844 | [before](before/ar_390x844_top.png) / [after](after/ar_390x844_top.png) | [before](before/ar_390x844_middle.png) / [after](after/ar_390x844_middle.png) | [before](before/ar_390x844_bottom.png) / [after](after/ar_390x844_bottom.png) |

### ID — Indonesian

| Viewport | Top | Middle | Bottom |
|---|---|---|---|
| 1440×900 | [before](before/id_1440x900_top.png) / [after](after/id_1440x900_top.png) | [before](before/id_1440x900_middle.png) / [after](after/id_1440x900_middle.png) | [before](before/id_1440x900_bottom.png) / [after](after/id_1440x900_bottom.png) |
| 390×844 | [before](before/id_390x844_top.png) / [after](after/id_390x844_top.png) | [before](before/id_390x844_middle.png) / [after](after/id_390x844_middle.png) | [before](before/id_390x844_bottom.png) / [after](after/id_390x844_bottom.png) |

## Contact Sheet

[CONTACT_SHEET_start-background-edge-polish.png](CONTACT_SHEET_start-background-edge-polish.png)

Composite showing EN desktop top/bottom, EN mobile top/bottom, AR desktop top/bottom, FR mobile top/bottom, ID mobile top/bottom.

## File Count

- 20 before screenshots + 20 after screenshots + 1 contact sheet + 1 index.md = 42 files
