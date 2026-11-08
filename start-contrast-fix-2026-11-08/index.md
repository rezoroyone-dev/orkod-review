# Start choice label contrast fix — evidence (2026-11-08)

- Application: `rezoroyone-dev/pranichealing`, branch `nature-green-final`, fix commit **`3370cfc`** (baseline `ec851a1`).
- Issue: small uppercase category labels above the two `/start` choice cards had very low contrast on light card backgrounds.
- Confirmed on settled live page after fonts/animations (headless Edge, networkidle + font readiness + delay): `.start-choice-kicker` computed color before fix was effectively unreadable on light card; targeted fix changed it to `rgb(72, 96, 79)` / `#48604F` (contrast **6.86:1** vs white/light card, WCAG AA).
- Scope: `frontend/src/views/StartJourney.vue` `.start-choice-kicker` only (`color: #48604F; text-shadow: none`). Layout/dimensions/numbering/wording/previews/images/interactions/hover-focus preserved. No Home Ch2, Body Explorer, 3D, auth gates, or medical content changes.
- **Agent visual pixel inspection: not performed.** Screenshots are genuine local captures (PNG, expected viewport dimensions).

## before-baseline

| Locale | 1440×900 | 390×844 |
|---|---|---|
| EN | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/before-baseline/en-start-1440x900.png) | [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/before-baseline/en-start-390x844.png) |
| FR | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/before-baseline/fr-start-1440x900.png) | [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/before-baseline/fr-start-390x844.png) |
| AR | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/before-baseline/ar-start-1440x900.png) | [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/before-baseline/ar-start-390x844.png) |
| ID | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/before-baseline/id-start-1440x900.png) | [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/before-baseline/id-start-390x844.png) |

## after

| Locale | 1440×900 | 390×844 |
|---|---|---|
| EN | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/after/en-start-1440x900.png) | [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/after/en-start-390x844.png) |
| FR | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/after/fr-start-1440x900.png) | [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/after/fr-start-390x844.png) |
| AR | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/after/ar-start-1440x900.png) | [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/after/ar-start-390x844.png) |
| ID | [desktop](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/after/id-start-1440x900.png) | [mobile](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/start-contrast-fix-2026-11-08/start-contrast-fix-2026-11-08/after/id-start-390x844.png) |


