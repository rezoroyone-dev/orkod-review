# ORKOD /start — Background & Edge Polish — Before & After Screenshots

**Branch:** `visual-review/start-edge-body-selection-2026-11-11`  
**Repository:** [rezoroyone-dev/orkod-review](https://github.com/rezoroyone-dev/orkod-review)  
**Application commit:** `f57c816` (on `nature-green-final`)

## Changes Made

### 1. /start — White line on right edge fix

Changed `.start-scene-img` from `height: 100%` to `min-height: 100%` so the background image covers the full scrollable page without overflowing horizontally. Added `overflow: hidden` to `.start-scene-media` to clip any overflow from `object-fit: cover`. Added `background-color: #F7FAF5` to `.start-scene` so any remaining gaps show the page background instead of white.

### 2. Header color fix

Changed `.start-choice-title` color from `#14532d` (green) to `#18251C` (dark charcoal-green) for premium appearance on white card surfaces.

### 3. Body Explorer — White selection glow

Changed selected organ and hand emissive color from organ-color-tinted to pure white (`#ffffff`), so the selected part stands out clearly against dimmed background.

## Screenshots

### /start — Before & After

| Viewport | Before | After |
|---|---|---|
| 1440×900 | [en_1440x900_top.png](en_1440x900_top.png) / [after/en_1440x900_top.png](after/en_1440x900_top.png) | [en_1366x768_top.png](en_1366x768_top.png) / [after/en_1366x768_top.png](after/en_1366x768_top.png) |
| 1366×768 | [en_1366x768_top.png](en_1366x768_top.png) / [after/en_1366x768_top.png](after/en_1366x768_top.png) | [en_1366x768_middle.png](en_1366x768_middle.png) / [after/en_1366x768_middle.png](after/en_1366x768_middle.png) |
| 768×1024 | [en_768x1024_top.png](en_768x1024_top.png) / [after/en_768x1024_top.png](after/en_768x1024_top.png) | [en_768x1024_middle.png](en_768x1024_middle.png) / [after/en_768x1024_middle.png](after/en_768x1024_middle.png) |
| 390×844 | [en_390x844_top.png](en_390x844_top.png) / [after/en_390x844_top.png](after/en_390x844_top.png) | [en_390x844_middle.png](en_390x844_middle.png) / [after/en_390x844_middle.png](after/en_390x844_middle.png) |
| 360×800 | [en_360x800_top.png](en_360x800_top.png) / [after/en_360x800_top.png](after/en_360x800_top.png) | [en_360x800_middle.png](en_360x800_middle.png) / [after/en_360x800_middle.png](after/en_360x800_middle.png) |

### Body Explorer — Selected Organ/Hands

| Organ | Desktop | Mobile |
|---|---|---|
| Brain | [body_brain_desktop.png](body_brain_desktop.png) | [body_brain_mobile.png](body_brain_mobile.png) |
| Lungs | [body_lungs_desktop.png](body_lungs_desktop.png) | [body_lungs_mobile.png](body_lungs_mobile.png) |
| Heart | [body_heart_desktop.png](body_heart_desktop.png) | [body_heart_mobile.png](body_heart_mobile.png) |
| Liver | [body_liver_desktop.png](body_liver_desktop.png) | [body_liver_mobile.png](body_liver_mobile.png) |
| Stomach | [body_stomach_desktop.png](body_stomach_desktop.png) | [body_stomach_mobile.png](body_stomach_mobile.png) |
| Intestines | [body_intestines_desktop.png](body_intestines_desktop.png) | [body_intestines_mobile.png](body_intestines_mobile.png) |
| Kidneys | [body_kidneys_desktop.png](body_kidneys_desktop.png) | [body_kidneys_mobile.png](body_kidneys_mobile.png) |
| Left Hand | [body_leftHand_desktop_selected.png](body_leftHand_desktop_selected.png) | [body_leftHand_mobile.png](body_leftHand_mobile.png) |
| Right Hand | [body_rightHand_desktop_selected.png](body_rightHand_desktop_selected.png) | [body_rightHand_mobile.png](body_rightHand_mobile.png) |

## Contact Sheet

[CONTACT_SHEET_start-background-edge-polish.png](CONTACT_SHEET_start-background-edge-polish.png)

## File Count

- 20 before screenshots + 20 after screenshots
- 18 Body Explorer screenshots (9 organs/hands × 2 viewports)
- 1 contact sheet
- 1 index.md
- Total: 42 files
