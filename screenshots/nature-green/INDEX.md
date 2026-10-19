# Nature-Green Redesign — Visual Review (Final)

Screenshots from the **final verification run** (`verify-final.mjs` against the
live site at `https://localhost`, captured 2026-10-19). These are the
published nature-green redesign screenshots.

Application source code is **not** published here. This branch contains the
review screenshots and this index only.

## Files

| File | Viewport | What it shows |
| --- | --- | --- |
| `01-language-gate.png` | 1440×900 | Language-selection gate over the nature wash — four locale rows + search |
| `02-start-neutral.png` | 1440×900 | `/start` in its resting state — two entry panels, no preview revealed |
| `03-start-left-preview.png` | 1440×900 | `/start` with the **left** panel active — "I know why I'm sick" preview revealed |
| `04-start-right-preview.png` | 1440×900 | `/start` with the **right** panel active — "I don't know why I'm sick" preview revealed |
| `05-home-chapter-1.png` | 1440×900 | Homepage **chapter 01** — editorial intro + arched nature photo |
| `06-home-chapter-2.png` | 1440×900 | Homepage **chapter 02** — the book, service rows, gold booking CTA |
| `07-home-chapter-3.png` | 1440×900 | Homepage **chapter 03** — share care (family + donations) over the nature wash |
| `08-body-desktop.png` | 1440×900 | `/body` 3D body explorer, desktop — dark stage, organ selector rail, detail panel |
| `09-body-mobile.png` | 390×844 | `/body` 3D body explorer, mobile — stacked selector + detail strip |
| `10-quiz.png` | 1440×900 | `/quiz` — questionnaire step with answer options |
| `11-booking.png` | 1440×900 | `/booking` — booking landing |
| `12-home-arabic.png` | 1440×900 | Homepage in **Arabic (RTL)** — mirrored layout |
| `13-start-arabic.png` | 1440×900 | `/start` in **Arabic (RTL)** — mirrored entry panels |
| `14-mobile-home.png` | 390×844 | Homepage chapter 01 on mobile |
| `14b-mobile-home-ch2.png` | 390×844 | Homepage chapter 02 on mobile — nav-rail clearance |
| `15-mobile-start.png` | 390×844 | `/start` on mobile — framed touch previews, dark-green top-right skip pill |
| `16-body-selected.png` | 1440×900 | `/body` with the **kidneys selected** — camera focus + terracotta coordinator callout |

## Verification note (honest scope)

The automated checks cover DOM geometry, computed styles, pixel samples, overflow
matrices, colour scans and console errors — they are **not** a substitute for
human visual judgement. Image viewing was unavailable during capture, so these
PNGs are provided specifically for your eyes.

Final-round fixes visible in this set include: a solid dark-green `/start` mobile
skip pill (clear contrast, 44px tap target, no overlap), the corrected desktop
`/start` preview framing, and the kidney selection indicator rendered in a
coordinated terracotta accent (no unintended purple).
