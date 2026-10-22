# Nature Green - Round 24 (mobile book cover cropping at 360x800)

Branch `visual-review/nature-green-round-24`, based on `main`. One application file changed:
`frontend/src/views/HomePage.vue`. No redesign, no copy change, no new dependency, no
backend/database change.

## What was wrong

Round 23 trimmed chapter 02's top padding on short phones to win room for the CTA. At
360x800 that meant `padding-top: 24px`, so the 3D book started at **y = 40** while the
sticky header occupies **y = 0..57**. The top **16.9 px** of the cover - the whole top edge,
including its bevel - sat behind the header. Hit-testing the cover's top centre returned the
header's "Start your journey" button instead of the book. At 390x844 the regular rule
(`padding-top: 75.96px`) put the cover at y = 102, so only 360-class short phones were hit.

## The fix

Scoped to `@media (max-width: 767px) and (max-height: 830px)` - the same short-phone rule
Round 23 introduced:

| rule | Round 23 | Round 24 |
| --- | --- | --- |
| `.hp-chapter--two` top padding | `24px` | `calc(var(--bx-chrome-top, 57px) + 7px)` = 64px |
| `.hp-book-stage` padding | `18px` | `10px` |
| `.hp-book-cover` width | `210px` (clamp floor) | `196px` |

The section now starts just below the header, the stage keeps a thin frame of air, and the
cover renders 6.7% smaller on short viewports so the CTA keeps its bottom gap. Book art, cloth
texture, bevel, gold print, spine/pages, backdrop and forest grading are untouched - only the
rendered size changes. The 390x844 rules are not touched at all.

## Measured geometry (fresh load + real rail click)

| viewport | cover bbox (y) | header bottom | clearance | CTA bottom / gap |
| --- | --- | --- | --- | --- |
| 360x800 en | 72.4 .. 359.1 | 57 | **15.4 px** | 770.3 / **29.7 px** |
| 375x812 en | 72.4 .. 359.1 | 57 | 15.4 px | 744.8 / 67.2 px |
| 390x844 en | 102.1 .. 409.8 | 57 | 45.1 px | 812.8 / 31.2 px (unchanged) |
| 360x800 ar | 72.4 .. 359.1 | 57 | 15.4 px | 715.7 / 84.3 px |
| 390x844 ar | 102.1 .. 409.8 | 57 | 45.1 px | 783.7 / 60.3 px (unchanged) |
| 1280x800 en | 278.2 .. 597.3 | 72 | 206.2 px | CTA 173x52 (unchanged) |
| 1440x900 en | 308.0 .. 668.5 | 72 | 236.0 px | CTA 173x52 (unchanged) |

At 360x800 the cover bbox is 192.8 x 286.6 px (was 206.5 x 307.7) and spans x = 62.2..255,
so it is not clipped at either side either. The clearance check is conservative: the
axis-aligned bbox of the rotated book is strictly below the header rect, so no painted pixel
can hide underneath it. The button stays **173x52** (154x52 for the shorter Arabic label),
well above the 44px touch minimum.

### Resize drift (pre-existing, now smaller)

Changing viewport height keeps the document scroll offset, so a snapped section drifts by the
height delta until the next scroll re-snaps. At 360x800, shrinking to 780 px without
re-snapping leaves the cover 4.6 px behind the header (Round-23 CSS: **36.9 px** behind).
The indicator stays 02/02 and the next snap restores the 15.4 px clearance. No re-snap logic
was added - out of scope, and it risks jumps when mobile browser chrome shows/hides.

## Captures

### r24-01-home-chapter02-mobile-360

360x800, en. **The fix.** Whole cover visible, 15.4 px below the header, CTA 29.7 px above the bottom edge.

![r24-01-home-chapter02-mobile-360](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-24/screenshots/nature-green-round-24/r24-01-home-chapter02-mobile-360.png)

### r24-02-home-chapter02-preview-390

390x844, en. Reference: composition unchanged (cover 102.1..409.8, CTA 31.2 px above the edge).

![r24-02-home-chapter02-preview-390](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-24/screenshots/nature-green-round-24/r24-02-home-chapter02-mobile-390.png)

### r24-03-home-chapter02-mobile-360-arabic

360x800, Arabic RTL. Same clearance; book is not mirrored.

![r24-03-home-chapter02-mobile-360-arabic](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-24/screenshots/nature-green-round-24/r24-03-home-chapter02-mobile-360-arabic.png)

### r24-04-home-chapter02-mobile-390-arabic

390x844, Arabic RTL. Byte-identical to the Round-23 capture.

![r24-04-home-chapter02-mobile-390-arabic](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-24/screenshots/nature-green-round-24/r24-04-home-chapter02-mobile-390-arabic.png)

### r24-05-home-chapter02-desktop-1280

1280x800 desktop. No change.

![r24-05-home-chapter02-desktop-1280](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-24/screenshots/nature-green-round-24/r24-05-home-chapter02-desktop-1280.png)

### r24-06-home-chapter02-desktop-1440

1440x900 desktop. Byte-identical to the Round-22 desktop capture.

![r24-06-home-chapter02-desktop-1440](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-24/screenshots/nature-green-round-24/r24-06-home-chapter02-desktop-1440.png)

### r24-07-home-chapter01-desktop-1440

Fresh load, 1440x900: indicator 01/02 (Round-23 fix preserved, pixel-identical).

![r24-07-home-chapter01-desktop-1440](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-24/screenshots/nature-green-round-24/r24-07-home-chapter01-desktop-1440.png)

### r24-08-home-chapter01-mobile-360

Fresh load, 360x800: indicator 01/02.

![r24-08-home-chapter01-mobile-360](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-24/screenshots/nature-green-round-24/r24-08-home-chapter01-mobile-360.png)

## Verification

Full numbers: [`verification.txt`](verification.txt).

- **148/148** browser assertions pass across 360x800, 375x812, 390x844, 1280x800, 1440x900,
  en + ar: fresh-load indicator, rail clicks both ways, PageDown/PageUp, wheel, resizes,
  reduced motion, cover-vs-header clearance, viewport containment, no horizontal overflow,
  CTA gap/size, no console errors
- `vue-tsc --noEmit`: clean
- ESLint on `HomePage.vue`: clean
- vitest: 16 files / 149 tests pass (incl. `home.presentation.test.ts` 4/4); the 25 failing
  files and 2 failing auth tests are the unchanged backend-only suites (`ECONNREFUSED` on
  :9091, backend deliberately not started)
- `vite build`: pass (PWA, 143 precached entries)
- Pixel hashes: desktop chapter 02 identical to Round 22; 390 Arabic chapter 02 identical to
  Round 23; 1440 chapter 01 fresh load identical to Round 23

## Preservation

- Round 21, 22 and 23 preview directories and review branches untouched (17 / 3 / 7 / 8 files).
- Context: [Round 23 index](https://github.com/rezoroyone-dev/orkod-review/blob/visual-review/nature-green-round-23/screenshots/nature-green-round-23/index.md)
- No application repository change was staged, committed, pushed or deployed; `README.md`,
  `Makefile`, database and Go backend untouched.

> **Honesty note.** No visual inspection of these PNGs was performed or is claimed. The
> evidence is DOM geometry, hit tests, pixel hashes and browser assertions.

