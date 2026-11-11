# ORKOD /start — Quiz Preview + Mobile Fix — Before & After Screenshots

**Branch:** `visual-review/start-quiz-mobile-correction-2026-11-10`  
**Repository:** [rezoroyone-dev/orkod-review](https://github.com/rezoroyone-dev/orkod-review)  
**Application commit:** `0a8b569` (on `nature-green-final`)

## Issues Fixed

### 1. Quiz Preview Image
The second choice card (Short Test → /quiz) was displaying the Body Explorer anatomy illustration. Replaced with dedicated quiz-themed previews (question mark icon + checklist) for all 4 locales (en, fr, ar, id), desktop (1000×1250) and mobile (800×1000) variants. Quiz card is now visually distinct from the Body Explorer card.

### 2. Mobile Layout Clipping
Changed `.start-scene` from `height: 100svh` to `min-height: 100svh` so the page naturally scrolls instead of cutting off content. Reduced mobile preview height (32vh → 26vh) and card padding. Added scroll-hint indicator. Both choice cards remain accessible with fully visible buttons.

### 3. Responsive Verification
Tested at 1440×900, 1366×768, 768×1024, 390×844, 360×800 across EN/FR/AR/ID. All locales verified via `document.documentElement.lang` and visible heading text. Page naturally scrolls on smaller screens — both cards accessible with buttons fully visible.

## Screenshots

### EN — English

| Viewport | Screenshot |
|---|---|
| 1440×900 | [start_en_1440x900.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_en_1440x900.png) |
| 1366×768 | [start_en_1366x768.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_en_1366x768.png) |
| 768×1024 | [start_en_768x1024.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_en_768x1024.png) |
| 390×844 | [start_en_390x844.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_en_390x844.png) |
| 360×800 | [start_en_360x800.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_en_360x800.png) |

### FR — French

| Viewport | Screenshot |
|---|---|
| 1440×900 | [start_fr_1440x900.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_fr_1440x900.png) |
| 1366×768 | [start_fr_1366x768.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_fr_1366x768.png) |
| 768×1024 | [start_fr_768x1024.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_fr_768x1024.png) |
| 390×844 | [start_fr_390x844.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_fr_390x844.png) |
| 360×800 | [start_fr_360x800.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_fr_360x800.png) |

### AR — Arabic

| Viewport | Screenshot |
|---|---|
| 1440×900 | [start_ar_1440x900.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_ar_1440x900.png) |
| 1366×768 | [start_ar_1366x768.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_ar_1366x768.png) |
| 768×1024 | [start_ar_768x1024.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_ar_768x1024.png) |
| 390×844 | [start_ar_390x844.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_ar_390x844.png) |
| 360×800 | [start_ar_360x800.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_ar_360x800.png) |

### ID — Indonesian

| Viewport | Screenshot |
|---|---|
| 1440×900 | [start_id_1440x900.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_id_1440x900.png) |
| 1366×768 | [start_id_1366x768.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_id_1366x768.png) |
| 768×1024 | [start_id_768x1024.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_id_768x1024.png) |
| 390×844 | [start_id_390x844.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_id_390x844.png) |
| 360×800 | [start_id_360x800.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/start_id_360x800.png) |

## Contact Sheet

[CONTACT_SHEET_start-quiz-mobile-correction.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-quiz-mobile-correction-2026-11-10/CONTACT_SHEET_start-quiz-mobile-correction.png)

Composite showing EN desktop, EN mobile, AR desktop, FR mobile, ID mobile.

## File Count

- 20 screenshots (4 locales × 5 viewports)
- 1 contact sheet
- 1 index.md

Total: 22 files
