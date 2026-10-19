# Nature-Green Redesign — Visual Review (Round 7)

Screenshots from the **latest Round 7 corrective verification run**
(`verify-final.mjs` against the live site at `https://localhost`, 2026-10-19
18:46–18:47 UTC+0 capture time). These supersede all earlier rounds — every
image below was regenerated in this run, not carried over.

Application source code is **not** published here. This branch contains review
screenshots and this index only.

## Files

| File | Viewport | What it shows |
| --- | --- | --- |
| `02-start-neutral.png` | 1440×900 | `/start` in its resting state — two entry panels, no preview revealed |
| `03-start-left-preview.png` | 1440×900 | `/start` with the **left** panel active — "I know why I'm sick" preview revealed |
| `04-start-right-preview.png` | 1440×900 | `/start` with the **right** panel active — "I don't know why I'm sick" preview revealed |
| `15-mobile-start.png` | 390×844 | `/start` on mobile — framed touch previews, fixed top-right skip pill |
| `05-home-chapter-1.png` | 1440×900 | Homepage **chapter 01** — editorial intro + arched nature photo |
| `06-home-chapter-2.png` | 1440×900 | Homepage **chapter 02** — the book, service rows, gold booking CTA |
| `07-home-chapter-3.png` | 1440×900 | Homepage **chapter 03** — share care (family + donations) over the nature wash |
| `08-body-desktop.png` | 1440×900 | `/body` 3D body explorer, desktop — dark stage, organ selector rail, detail panel |
| `09-body-mobile.png` | 390×844 | `/body` 3D body explorer, mobile — stacked selector + detail strip |
| `16-body-selected.png` | 1440×900 | `/body` with the **kidneys selected** — camera focus + leader-line callout, gold highlight |
| `12-home-arabic.png` | 1440×900 | Homepage in **Arabic (RTL)** — mirrored layout |
| `13-start-arabic.png` | 1440×900 | `/start` in **Arabic (RTL)** — mirrored entry panels |

## Verification note (honest scope)

The automated Round 7 checks cover DOM geometry, computed styles, pixel samples,
overflow matrices, colour scans and console errors — they are **not** a
substitute for human visual judgement. Image viewing was unavailable during
capture, so these PNGs are provided specifically for your eyes.

Round 7 corrective fixes visible in this set include: corrected `/start`
framing so the desktop quiz preview fills its panel without colliding with the
skip link, a fixed top-right mobile skip pill that never covers content,
verified kidney selection (purple → terracotta, forced fully opaque with a
boosted champagne highlight and an anatomically-anchored callout), the
high-DPI body-canvas fix, and the homepage chapter-02 nav-rail clearance.
Image viewing was unavailable during capture, so these PNGs are provided
specifically for your eyes.
