# ORKOD /start — Preview, Locale & Mobile Fix — Before & After Screenshots

**Branch:** `visual-review/start-preview-mobile-locale-fix-2026-11-10`  
**Repository:** [rezoroyone-dev/orkod-review](https://github.com/rezoroyone-dev/orkod-review)  
**Application commit:** `6ca76fb` (on `nature-green-final`)

## Issues Fixed

### 1. Broken Quiz Preview
The quiz preview images (`orkod-quiz-preview-*.png`) did not exist in `public/images/start/`, causing broken image icons on the second choice card. Copied the existing ORKOD body explorer images as placeholders for all 4 locales (en, fr, ar, id), desktop and mobile variants.

### 2. Incorrect Locale in Screenshots
All `.env` files set `VITE_I18N_LOCALE=fr`, causing screenshots to always show French. The capture script now sets `localStorage.setItem("orkod.locale", <locale>)` and reloads the page so the i18n plugin picks up the correct locale. Verified via `document.documentElement.lang` and visible heading text.

### 3. Mobile Layout
Page fits within the viewport at all tested sizes (360×800, 390×844, 768×1024, 1366×768, 1440×900) with no overflow. Both choice cards are fully visible.

## Screenshots

All viewports: 1440×900, 1366×768, 768×1024, 390×844, 360×800  
All locales: EN, FR, AR, ID

### EN — English

| Viewport | Screenshot |
|---|---|
| 1440×900 | [start_en_1440x900.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_en_1440x900.png) |
| 1366×768 | [start_en_1366x768.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_en_1366x768.png) |
| 768×1024 | [start_en_768x1024.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_en_768x1024.png) |
| 390×844 | [start_en_390x844.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_en_390x844.png) |
| 360×800 | [start_en_360x800.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_en_360x800.png) |

### FR — French

| Viewport | Screenshot |
|---|---|
| 1440×900 | [start_fr_1440x900.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_fr_1440x900.png) |
| 1366×768 | [start_fr_1366x768.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_fr_1366x768.png) |
| 768×1024 | [start_fr_768x1024.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_fr_768x1024.png) |
| 390×844 | [start_fr_390x844.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_fr_390x844.png) |
| 360×800 | [start_fr_360x800.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_fr_360x800.png) |

### AR — Arabic

| Viewport | Screenshot |
|---|---|
| 1440×900 | [start_ar_1440x900.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_ar_1440x900.png) |
| 1366×768 | [start_ar_1366x768.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_ar_1366x768.png) |
| 768×1024 | [start_ar_768x1024.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_ar_768x1024.png) |
| 390×844 | [start_ar_390x844.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_ar_390x844.png) |
| 360×800 | [start_ar_360x800.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_ar_360x800.png) |

### ID — Indonesian

| Viewport | Screenshot |
|---|---|
| 1440×900 | [start_id_1440x900.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_id_1440x900.png) |
| 1366×768 | [start_id_1366x768.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_id_1366x768.png) |
| 768×1024 | [start_id_768x1024.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_id_768x1024.png) |
| 390×844 | [start_id_390x844.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_id_390x844.png) |
| 360×800 | [start_id_360x800.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/start_id_360x800.png) |

## Contact Sheet

[CONTACT_SHEET_start-preview-mobile-locale-fix.png](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-preview-mobile-locale-fix-2026-11-10/CONTACT_SHEET_start-preview-mobile-locale-fix.png)

Composite showing EN desktop, EN mobile, AR desktop, FR mobile, ID mobile.

## File Count

- 20 screenshots (4 locales × 5 viewports)
- 1 contact sheet
- 1 index.md

Total: 22 files
