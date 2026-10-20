# Nature-Green Redesign — Visual Review (Round 9)

Screenshots from the **Round 9** verification run (`verify-final.mjs` against the
live site at `https://localhost`, captured 2026-10-20). These are the newest
captures; they supersede earlier review sets.

Application source code is **not** published here. This branch contains the
review screenshots and this index only.

## What changed in Round 9

- **/start previews now read as backgrounds, not framed screenshots.** The body
  capture is full-bleed with a soft elliptical edge feather (no visible dark
  rectangle); the questionnaire is a translucent full-half wash with no hard
  horizontal boundary. Each heading sits in a clear text-safe zone above the
  artwork, over a top-weighted veil rather than a wash over the whole page.
- **/start mobile:** each choice owns an independent, edge-feathered preview
  window inside its own panel — nothing bleeds between sections. "Skip to home"
  is now a plain, slightly translucent text link in the bottom-right corner
  (previously a solid green pill), with space reserved so it clears the second
  choice.
- **Body explorer:** the selected-organ label now sits beside the anatomy in the
  side margin, joined by a thin leader line — it no longer covers the organs.
  Idle region markers are much subtler (clearer on hover/focus/selection). The
  Mandrake model, default camera framing and the terracotta kidney accent are
  unchanged.
- **Booking:** a single available specialty now sits centred deliberately rather
  than stranded in the first grid cell (no invented data).
- Homepage chapters 1 and 3 are unchanged; chapter 2 keeps the honest
  "in preparation / not yet on sale" book state.

## Files

| File | Viewport | What it shows |
| --- | --- | --- |
| `01-language-gate.png` | 1440×900 | Language-selection gate over the nature wash — four locale rows + search |
| `02-start-neutral.png` | 1440×900 | `/start` resting state — two entry panels, no preview revealed |
| `03-start-left-preview.png` | 1440×900 | `/start` **left** active — body preview as a feathered background, heading clear of the anatomy |
| `04-start-right-preview.png` | 1440×900 | `/start` **right** active — questionnaire as a translucent full-half background, no hard boundary |
| `05-home-chapter-1.png` | 1440×900 | Homepage **chapter 01** — editorial intro + arched nature photo |
| `06-home-chapter-2.png` | 1440×900 | Homepage **chapter 02** — the book (honest availability) + service rows + gold booking CTA |
| `07-home-chapter-3.png` | 1440×900 | Homepage **chapter 03** — share care (family + donations) over the nature wash |
| `08-body-desktop.png` | 1440×900 | `/body` 3D body explorer, desktop — dark stage, organ selector rail, detail panel |
| `09-body-mobile.png` | 390×844 | `/body` 3D body explorer, mobile — stacked selector + detail strip |
| `10-quiz.png` | 1440×900 | `/quiz` — questionnaire step with answer options |
| `11-booking.png` | 1440×900 | `/booking` — specialty step (Step 1 of 4), single card centred |
| `12-home-arabic.png` | 1440×900 | Homepage in **Arabic (RTL)** — mirrored layout |
| `13-start-arabic.png` | 1440×900 | `/start` in **Arabic (RTL)** — mirrored entry panels |
| `14-mobile-home.png` | 390×844 | Homepage chapter 01 on mobile |
| `14b-mobile-home-ch2.png` | 390×844 | Homepage chapter 02 on mobile — nav-rail clearance |
| `15-mobile-start.png` | 390×844 | `/start` on mobile — independent feathered previews, bottom-right skip text link |
| `16-body-selected.png` | 1440×900 | `/body` with the **kidneys selected** — camera focus, terracotta accent, side-margin label |

## Verification note (honest scope)

The automated checks cover DOM geometry, computed styles, pixel samples, overflow
matrices, colour scans and console errors — they are **not** a substitute for
human visual judgement. Image viewing was unavailable during capture, so these
PNGs are provided specifically for your eyes.

Round 9 asserts added to `verify-final.mjs`: both `/start` previews are
full-bleed in their panel (`coversPanel`) and carry an edge feather mask
(`feathered`); the kidneys callout label does not cover the body centre
(`pillOverCentre:false`) while the dot stays inside the stage canvas; the mobile
skip link is bottom-anchored and clears the preview windows.
