# Nature Green - Round 25 (release-readiness audit + responsive snap fixes)

Branch `visual-review/nature-green-round-25`, based on `main`. One application file changed:
`frontend/src/views/HomePage.vue`. No redesign, no copy change, no new dependency, no
backend/database change, no README/Makefile change.

This round audited the whole public site (journeys, routes, responsive/a11y, the 3D body
explorer, performance, framing, locales, honesty copy) and fixed the reproducible responsive
defects found on the homepage chapter deck.

## What was wrong

The chapter deck decided its snap mode once, at setup, and its rail navigation scrolled the
window with a manual `window.scrollTo()`. Three reproducible defects followed:

- **Breakpoint hybrid.** After 1024 -> 767 resizing, snap stayed ON below its 961px
  threshold: the inner scroller and the document both scrolled (measured `winY=732` with
  `#hp-ch2` at `top=-730`, indicator still `02/02`). After 360 -> 1280, snap stayed OFF on
  desktop: the grid rendered without snap and `#hp-ch2` landed at `top=0.4`, i.e. 71.6px
  behind the 72px header.
- **Tablet band 768..960.** `canSnap()` is `min-width: 961px`, so tablets get the desktop
  grid without snap and had no top padding for the fixed header. After a rail click the
  chapter 02 cover sat at `y=28.8` with the header at `0..61` (**32.2px hidden**); on load,
  chapter 01's eyebrow was at `y=8.6` and its h1 at `y=42.4`, both behind the header.
- **Reduced motion overlap.** The manual window scroll ignored `scroll-margin`. At
  1024x768 the chapter 02 cover cleared the 61px header by **-2.2px** (2.2px behind it).
  The global `[id] { scroll-margin-top: 92px }` (`src/styles/_global.scss:65`) only helps
  native `scrollIntoView`/anchors, not a manual scroll offset.

## The fix

Scoped to `HomePage.vue`:

1. `applySnapPreference()` re-evaluates `canSnap()` on change; `watchSnapPreference()` listens
   to `(min-width: 961px)` and `(prefers-reduced-motion: reduce)`. On a mode change it clears
   `layoutReady`, waits `nextTick` + one frame, restores it and re-aligns the kept chapter
   with `goToChapter(keep, true)`. Listeners are removed on unmount.
2. `goToChapter(idx, instant = false)` uses `behavior = instant || reduce ? 'auto' : 'smooth'`
   and the window branch now calls `el.scrollIntoView({ block: 'start', behavior })`, so the
   real `scroll-margin` applies.
3. CSS: `.hp-chapters .hp-chapter { scroll-margin-top: 0 }` overrides the global 92px inside
   the deck, and at `min-width: 768px` the non-snap deck gets
   `scroll-margin-top: var(--bx-chrome-top, 72px)` (72 / 61 / 57px by real header height).

## Measured geometry (fresh load + real rail click)

| case | chapter 02 cover (y) | header bottom | clearance |
| --- | --- | --- | --- |
| 768x1024 en | 89.8 .. 397.5 | 61 | **28.8 px** (was 32.2 px hidden) |
| 820x1180 en | - | 61 | **30.9 px** |
| 960x800 en | - | 61 | **36.8 px** |
| 1024x768 reduced motion | 99.8 .. 407.5 | 61 | **38.8 px** (was -2.2 px) |
| 1280x800 reduced motion | - | 72 | **49.6 px** |
| 1440x900 reduced motion | - | 72 | **53.3 px** |
| 360x800 en fresh | 72.4 .. 359.1 | 57 | 15.4 px (unchanged) |
| 375x812 en fresh | 72.4 .. 359.1 | 57 | 15.4 px (unchanged) |
| 390x844 en fresh | 102.1 .. 409.8 | 57 | 45.1 px (unchanged) |
| 1280x800 en fresh | 278.2 .. 597.3 | 72 | 206.2 px (unchanged) |
| 1440x900 en fresh | - | 72 | 236.0 px (unchanged) |

Chapter 01 at 768x1024 now starts at `y=61` with its eyebrow at `69.6` instead of
`8.6`/`42.4` behind the header. Resize 1024 -> 767 keeps the cover clear (52.8px);
360 -> 1280 re-enables snap and lands chapter 02 below the header. The Round-24 regression
suite (`verify-r24.mjs`) stays at **148/148**.

### Remaining limitation

Within a mode the scroll offset is preserved, so 767 -> 360 leaves the cover 27.6px above the
viewport until the next scroll re-aligns it (no header overlap, but the top of the book is
cut). No re-align was added inside a mode - it would fight user scrolling and mobile URL-bar
height changes. Cross-mode changes are handled by the new listeners.

## Release-readiness audit

- **Journeys:** language gate (4 rows, filter, empty state, locale persistence, ar RTL),
  `/start` -> `/home`, body panel, quiz panel, 4-step quiz -> "Our suggestion for you" with no
  payment wording, login redirect honoured for same-origin targets and `//evil.example`
  rejected, `/book` (cover 324x468, not yet on sale, no buy/cart controls, `/booking` link),
  live donations form (real `GET /api/public/donations` -> 200) plus mocked disabled and
  mocked enabled feed states. All pass.
- **Body explorer:** 47/47 - 874x724 canvas, seven organs, callouts match the detail titles
  and stay in the viewport, GLB 200, keyboard operable, mobile en/ar no overflow. Canvas
  pixels are non-blank; en vs ar differ by 0.60 mean abs (desktop) / 0.17 (mobile), versus
  3.75 / 4.49 against a mirrored ar - **the body is not mirrored in RTL**.
- **Routes/a11y:** 315/315 - 15 public routes + 3 live detail pages + 404; 8 pages x 5
  viewport/locale combinations checked for overflow, header/h1 collisions, nameless and
  oversized controls, alt text and console errors; visible 2px focus ring on the gate.
- **Performance:** 26/26 - CLS 0.0002..0.0006, no failed/duplicate requests, settled main
  thread 0% (`/start`, `/home`) and 2% (`/body`, desktop and 390). Findings (not changed):
  `/body` fetches the 1.1MB GLB plus **5.4MB** `organs.bin.gz` on mobile load, and the
  production build warns about a 1,093.92kB vendor chunk.
- **Framing:** all 6 viewports frame the whole body (fill 46.7..73.4%, feet 134..222px above
  the stage bottom).
- **Locales:** 1262 keys in each of en/fr/ar/id, 0 referenced keys missing; raw-key scan
  passes on 22 public routes.

## Residual limitations

- **fr copy density on small phones:** chapter 02's CTA ends at `838.3` on 390x844 (5.7px
  from the edge, visible) and at `848` on 360x800 (~48px below the fold, reached by
  scrolling). Nothing is clipped; en/ar fit. Left unchanged - translation length, not a
  layout break.
- Same-mode resize drift above.
- 5.4MB organ geometry on `/body`; >1MB vendor chunk; the mobile 3D ResizeObserver warning
  ("ResizeObserver loop completed with undelivered notifications") is a benign browser
  notice, not an app error, and the 3D code was not touched.

## Captures

Every shot is machine-checked before the shutter; the script aborts instead of saving a shot
whose assertions fail.

### r25-01-gate-mobile-390-en

390x844. Language gate, h1 at y=160, no overflow.

![r25-01-gate-mobile-390-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-01-gate-mobile-390-en.png)

### r25-02-gate-desktop-1440-en

1440x900. Language gate, centred card.

![r25-02-gate-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-02-gate-desktop-1440-en.png)

### r25-03-start-mobile-390-en

390x844. Journey chooser with two panels (h1 is the intentional screen-reader heading).

![r25-03-start-mobile-390-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-03-start-mobile-390-en.png)

### r25-04-start-desktop-1440-en

1440x900. Journey chooser, desktop.

![r25-04-start-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-04-start-desktop-1440-en.png)

### r25-05-home-chapter01-desktop-1440-en

Fresh load, indicator 01/02. Byte-identical to the Round 24/23 capture.

![r25-05-home-chapter01-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-05-home-chapter01-desktop-1440-en.png)

### r25-06-home-chapter02-mobile-390-en

390x844. Cover 102.1..409.8, 45.1px clear of the header, CTA 31.2px above the edge.

![r25-06-home-chapter02-mobile-390-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-06-home-chapter02-mobile-390-en.png)

### r25-07-home-chapter02-mobile-360-en

360x800. Round-24 short-phone composition: cover 72.4..359.1, CTA gap 29.7px.

![r25-07-home-chapter02-mobile-360-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-07-home-chapter02-mobile-360-en.png)

### r25-08-home-chapter02-tablet-768-en

**The tablet fix.** 768x1024, no snap: cover 89.8..397.5, 28.8px clear of the 61px header
(previously 32.2px hidden).

![r25-08-home-chapter02-tablet-768-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-08-home-chapter02-tablet-768-en.png)

### r25-09-home-chapter02-desktop-1280-en

1280x800. Cover 278.2..597.3, 206.2px clear. Byte-identical to Round 24.

![r25-09-home-chapter02-desktop-1280-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-09-home-chapter02-desktop-1280-en.png)

### r25-10-home-chapter02-reduced-motion-1024

**The reduced-motion fix.** 1024x768 with `prefers-reduced-motion: reduce`: cover
99.8..407.5, 38.8px clear (was -2.2px).

![r25-10-home-chapter02-reduced-motion-1024](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-10-home-chapter02-reduced-motion-1024-en.png)

### r25-11-body-desktop-1440-en

1440x900. Body explorer, default state, seven organs listed.

![r25-11-body-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-11-body-desktop-1440-en.png)

### r25-12-body-heart-desktop-1440-en

1440x900. Heart selected: callout shown, detail strip reads "Heart".

![r25-12-body-heart-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-12-body-heart-desktop-1440-en.png)

### r25-13-body-mobile-390-ar

390x844, Arabic RTL. No horizontal overflow; the 3D body is not mirrored.

![r25-13-body-mobile-390-ar](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-13-body-mobile-390-ar.png)

### r25-14-symptoms-desktop-1440-en

1440x900. Symptoms index with live data.

![r25-14-symptoms-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-14-symptoms-desktop-1440-en.png)

### r25-15-book-desktop-1440-en

1440x900. Book page: "not yet on sale", no buy controls, booking link.

![r25-15-book-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-15-book-desktop-1440-en.png)

### r25-16-donations-desktop-1440-en

1440x900. Live donation form (backend reachable) and the no-card note.

![r25-16-donations-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-16-donations-desktop-1440-en.png)

### r25-17-quiz-gate-desktop-1440-en

1440x900. `/quiz` gates to `/login?redirect=/quiz`.

![r25-17-quiz-gate-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-17-quiz-gate-desktop-1440-en.png)

### r25-18-not-found-desktop-1440-en

1440x900. 404 page; its "Go Home" button was clicked in the audit and lands on `/`.

![r25-18-not-found-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-18-not-found-desktop-1440-en.png)

### r25-19-home-chapter02-mobile-390-fr

390x844, French. Cover 102.1..409.8; CTA bottom 838.3, 5.7px from the edge (visible; see the
residual note about fr density).

![r25-19-home-chapter02-mobile-390-fr](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-19-home-chapter02-mobile-390-fr.png)

### r25-20-home-chapter02-mobile-390-ar

390x844, Arabic RTL. Cover 102.1..409.8, CTA gap 60.3px.

![r25-20-home-chapter02-mobile-390-ar](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-25/screenshots/nature-green-round-25/r25-20-home-chapter02-mobile-390-ar.png)

## Verification

Full numbers: [`verification.txt`](verification.txt).

- `vue-tsc --noEmit`: clean; ESLint on `HomePage.vue`: clean
- `verify-r24.mjs`: **148/148**; `audit-journeys.mjs`: all pass
- `audit-body.mjs`: **47/47**; `audit-routes.mjs`: **315/315**; `audit-perf.mjs`: **26/26**
- `check-framing.mjs`: all six viewports OK; `locale-parity.mjs`: 0 referenced keys missing;
  `raw-key-scan.mjs`: PASS on 22 routes
- vitest: 149 pass / 2 fail / 110 skipped; the failures are the unchanged backend-only
  suites (`ECONNREFUSED` on :9091, backend deliberately not started)
- `npm run build`: pass (PWA, 143 precached entries; vendor chunk warning >1000kB)
- Pixel hashes: 1440 chapter 01 and 1280 chapter 02 byte-identical to Round 24

## Preservation

- Round 21, 22, 23 and 24 preview directories and review branches untouched.
- No application repository change was staged, committed, pushed or deployed; `README.md`,
  `Makefile`, database and Go backend untouched.
- No visual inspection of these PNGs is performed or claimed. The evidence is DOM geometry,
  hit tests, layout arithmetic, pixel statistics/hashes and browser assertions.
