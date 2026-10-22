# Nature Green - Round 26 (tablet band, French short phones, resize crop, initial JS)

Branch `visual-review/nature-green-round-26`, based on `main`. Two application files changed:
`frontend/src/views/HomePage.vue` and `frontend/vite.config.mts`. No redesign, no copy change,
no new dependency, no new WebGL context, no scroll snapping, no backend/database change.

This round fixed the 768-960px homepage band, the French chapter-02 crowding on short phones,
and the within-mode resize crop; then removed 670kB of three.js from the initial download of
every non-`/body` route and made the body models cache hits on repeat visits.

## What was wrong

- **Tablet band (768..960px).** Non-snap chapters were content-height while `.orkod-public` keeps
  `min-height: calc(100svh - chrome)`. At 768x1024 the chapter deck ended at y=423 but the footer
  only began at y=1024: a **~361px** pale `#F7FAF5` band under the dark chapter. Shorter viewports
  leaked 76px (960x800), 34px (1024x768 reduced) and ~2px (1280x800 reduced).
- **French short phones.** At 390x844 the chapter-02 CTA ended at y=838, 5.7px from the edge; at
  360x800 it ended at y=848, ~48px below the fold. en/ar fit.
- **Same-mode resize.** 390x844 -> 360x800 kept the old scroll offset while chapter 01 reflowed
  from 844 to 800px, so chapter 02 sat at `top=-44` and the book cover at `top=24.5`: its top
  32.5px was under the 57px fixed header until the next scroll.
- **Initial JS.** three.js lived in the shared `vendor` chunk, which every page modulepreloaded:
  1,093.92kB raw / 316.48kB gzip on the gate, home, book, donations, etc., although only the lazy
  `/body` route imports it (~670kB raw of that chunk).
- **/body repeats.** The 1.1MB body shell + 5.4MB organ bundle + 242KB manifest were re-fetched on
  every visit; the service worker had no runtime rule for `/models/`.

## The fix

`HomePage.vue`:

1. At `min-width:768px`, non-snap `.hp-chapter` now uses
   `min-height: calc(100svh - var(--bx-chrome-top,72px))`, `display:flex`, `align-items:center`,
   mirroring the snapped desktop layout. The existing `.hp-wrap` already caps and centres itself.
2. Mobile chapter 02 gets `min-height: 100svh` (mobile chapters scroll under the fixed header, so
   it must cover the full viewport), removing the last pale strip above the footer.
3. Chapter-02 short-phone rhythm now trims at `max-height:860px` (eyebrow 14->9, badge 18->12,
   body 16->10, actions 32->16, grid gap 28->20, stage 10->6, cover 196->190) with a second
   `max-height:810px` tier (12px more). Type sizes and the 52px CTA are untouched.
4. `onViewportResize()`: width-only resizes (never in snap mode) re-align the current chapter after
   a 220ms debounce, only when its top is 1..56px from the viewport top. Height-only resizes
   (mobile URL bar) and free scrolling are left alone.

`vite.config.mts`:

5. `node_modules/three` -> `vendor-three`, still precached for offline `/body` but no longer
   modulepreloaded by other routes.
6. Workbox runtime cache: `/models/` -> `CacheFirst` (`body-models-cache`, 12 entries, 30 days).

## Measured results

### Tablet band

| viewport | ch2 top..bottom | ch2 height | gap before footer | before |
| --- | --- | --- | --- | --- |
| 768x1024 en | 61..1024 | 963 | **0** | 361 |
| 820x1180 en | 61..1180 | 1119 | **0** | ~360 |
| 960x800 en | 61..800 | 739 | **0** | 76 |
| 1024x768 reduced | 61..768 | 707 | **0** | 34 |
| 1280x800 reduced | 72..800 | 728 | **0** | ~2 |
| 1440x900 snap (control) | 72..900 | 828 | 0 | 0 |

The centred column matches the snapped composition: at 768x1024 the ch2 grid is 361..724 inside
61..1024. Header clearance, desktop snap behaviour and chapter-01 layout are unchanged.

### Chapter 02 on small phones (fresh load + real rail click)

| case | chapter height | cover top..bottom | CTA | CTA bottom | gap |
| --- | --- | --- | --- | --- | --- |
| 390x844 fr | 844 | 68.5..346.2 | 151x52 | 716.7 | **127.3** (was 5.7) |
| 360x800 fr | 894.5 | 68.5..346.2 | 151x52 | 782.5 | **17.5** (was 48 below fold) |
| 390x844 en | 844 | 68.5..346.2 | 173x52 | 691.2 | 152.8 |
| 360x800 en | 816.7 | 68.5..346.2 | 173x52 | 704.7 | 95.3 |
| 390x844 ar | 844 | 68.5..346.2 | 154x52 | 662.1 | 181.9 |
| 360x800 ar | 800 | 68.5..346.2 | 154x52 | 662.1 | 137.9 |
| 390x844 id | 844 | 68.5..346.2 | 149x52 | 691.2 | 152.8 |
| 360x800 id | 816.7 | 68.5..346.2 | 149x52 | 704.7 | 95.3 |

Nothing is clipped, the CTA keeps its 52px height, the cover clears the header by 11.5px, and
`390x844` now fills the viewport (footer gap 0) while `360x800` keeps natural scroll.

### Same-mode resize (390x844 -> 360x800, French)

- Before: chapter 02 top -44, cover top 24.5 (32.5px under the header).
- After: chapter 02 top **0**, cover top **68.5**, CTA 730.5..782.5 (gap 17.5).

### Initial JavaScript (production build, `vite preview`, service worker blocked)

| metric | before | after | saved |
| --- | --- | --- | --- |
| /home initial JS, decoded | 2,184,474 B | 1,514,084 B | **670,390 B (-30.7%)** |
| /home initial JS, over the wire (brotli) | 649,428 B | 478,892 B | **170,536 B (-26.3%)** |

`index.html` now preloads only entry, vendor, vuetify and date-fns. `/body` loads the same total as
before (seven JS requests, including `vendor-three`): the split moves three.js to the route that
uses it. The build's >1000kB warning is gone (vendor 421.41kB / 145.69 gzip; vendor-three 670.39kB
/ 170.54 gzip). PWA precache remains 144 entries (7,694.69KiB) and anatomy models are still not
precached.

### /body repeat visits (production build, SW enabled, 390x844)

- First load: GLB 1,144,436 B + anatomy.json 51,536 B + organs.bin.gz 5,696,012 B (7,081,806 B).
- Second and third loads: all three responses `fromServiceWorker=true`, `transferSize=0`
  (4..153ms), so a returning visitor avoids 7.08MB of model traffic.
- The first visit is unchanged by design: the organ geometry is required to draw the seven organs
  (Meshopt-simplified, int16-quantized, gzip, 5,695,712 B on disk). Further reduction means
  decimating the curated mesh, which is a visual-quality decision, not a runtime fix.

## Captures

Every shot is machine-checked before the shutter; the script aborts instead of saving a shot whose
assertions fail.

### r26-01-gate-mobile-390-en

390x844. Language gate, h1 at y=160, no overflow.

![r26-01-gate-mobile-390-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-01-gate-mobile-390-en.png)

### r26-02-gate-desktop-1440-en

1440x900. Language gate, centred card.

![r26-02-gate-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-02-gate-desktop-1440-en.png)

### r26-03-start-mobile-390-en

390x844. Journey chooser with two panels.

![r26-03-start-mobile-390-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-03-start-mobile-390-en.png)

### r26-04-start-desktop-1440-en

1440x900. Journey chooser, desktop.

![r26-04-start-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-04-start-desktop-1440-en.png)

### r26-05-home-chapter01-desktop-1440-en

Fresh load, indicator 01/02. Byte-identical to the Round 25/24/23 capture.

![r26-05-home-chapter01-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-05-home-chapter01-desktop-1440-en.png)

### r26-06-home-chapter02-mobile-390-en

390x844. Chapter 02 fills the viewport (footer gap 0); cover 68.5..346.2, CTA gap 152.8px.

![r26-06-home-chapter02-mobile-390-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-06-home-chapter02-mobile-390-en.png)

### r26-07-home-chapter02-mobile-360-en

360x800. Cover 68.5..346.2, CTA gap 95.3px, natural scroll retained.

![r26-07-home-chapter02-mobile-360-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-07-home-chapter02-mobile-360-en.png)

### r26-08-home-chapter02-tablet-768-en

**The tablet fix.** 768x1024: chapter 02 now spans 61..1024, footer gap 0 (was a 361px pale band);
cover 390.3..698, 329.3px clear of the 61px header.

![r26-08-home-chapter02-tablet-768-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-08-home-chapter02-tablet-768-en.png)

### r26-09-home-chapter02-desktop-1280-en

1280x800. Cover 278.2..597.3, 206.2px clear. Differs from Round 25 only by <=10/255 channel
values on 0.12% of pixels (render dither); identical geometry.

![r26-09-home-chapter02-desktop-1280-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-09-home-chapter02-desktop-1280-en.png)

### r26-10-home-chapter02-reduced-motion-1024-en

1024x768 with `prefers-reduced-motion: reduce`: chapter 61..768, footer gap 0 (was 34px);
cover 262.3..570, 201.3px clear.

![r26-10-home-chapter02-reduced-motion-1024-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-10-home-chapter02-reduced-motion-1024-en.png)

### r26-11-body-desktop-1440-en

1440x900. Body explorer, default state, seven organs listed.

![r26-11-body-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-11-body-desktop-1440-en.png)

### r26-12-body-heart-desktop-1440-en

1440x900. Heart selected: callout shown, detail strip reads "Heart".

![r26-12-body-heart-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-12-body-heart-desktop-1440-en.png)

### r26-13-body-mobile-390-ar

390x844, Arabic RTL. No horizontal overflow; the 3D body is not mirrored. Byte-identical to R25.

![r26-13-body-mobile-390-ar](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-13-body-mobile-390-ar.png)

### r26-14-symptoms-desktop-1440-en

1440x900. Symptoms index with live data. Byte-identical to R25.

![r26-14-symptoms-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-14-symptoms-desktop-1440-en.png)

### r26-15-book-desktop-1440-en

1440x900. Book page: "not yet on sale", no buy controls, booking link.

![r26-15-book-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-15-book-desktop-1440-en.png)

### r26-16-donations-desktop-1440-en

1440x900. Live donation form (backend reachable) and the no-card note. Byte-identical to R25.

![r26-16-donations-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-16-donations-desktop-1440-en.png)

### r26-17-quiz-gate-desktop-1440-en

1440x900. `/quiz` gates to `/login?redirect=/quiz`. Byte-identical to R25.

![r26-17-quiz-gate-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-17-quiz-gate-desktop-1440-en.png)

### r26-18-not-found-desktop-1440-en

1440x900. 404 page; its "Go Home" button was clicked in the audit and lands on `/`.
Byte-identical to R25.

![r26-18-not-found-desktop-1440-en](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-18-not-found-desktop-1440-en.png)

### r26-19-home-chapter02-mobile-390-fr

**The French fix, 390x844.** CTA bottom 716.7, 127.3px from the edge (was 5.7px); chapter fills
the viewport.

![r26-19-home-chapter02-mobile-390-fr](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-19-home-chapter02-mobile-390-fr.png)

### r26-20-home-chapter02-mobile-360-fr

**The French fix, 360x800.** CTA bottom 782.5, 17.5px from the edge (was ~48px below the fold);
chapter 894.5px, natural scroll.

![r26-20-home-chapter02-mobile-360-fr](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-20-home-chapter02-mobile-360-fr.png)

### r26-21-home-chapter02-mobile-390-ar

390x844, Arabic RTL. Cover clears the header by 11.5px, CTA gap 181.9px.

![r26-21-home-chapter02-mobile-390-ar](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-21-home-chapter02-mobile-390-ar.png)

### r26-22-home-chapter02-mobile-360-id

360x800, Indonesian. CTA gap 95.3px.

![r26-22-home-chapter02-mobile-360-id](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-22-home-chapter02-mobile-360-id.png)

### r26-23-home-chapter02-resized-390-360-fr

**The resize fix.** Loaded at 390x844, then resized to 360x800 before the shutter. Chapter 02
top 0 (was -44), cover 68.5 (was 24.5, i.e. 32.5px under the header), CTA gap 17.5px.

![r26-23-home-chapter02-resized-390-360-fr](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-26/screenshots/nature-green-round-26/r26-23-home-chapter02-resized-390-360-fr.png)

## Verification

Full numbers: [`verification.txt`](verification.txt) and machine-readable
[`captures.json`](captures.json).

- `vue-tsc --noEmit`: clean; ESLint on `HomePage.vue`: clean
- `verify-r24.mjs`: **148/148**; `audit-journeys.mjs`: **47/47**; `audit-body.mjs`: **47/47**
- `audit-routes.mjs`: **315/315**; `audit-perf.mjs`: **26/26** (CLS 0.0000..0.0006)
- `check-framing.mjs`: all six viewports OK; `locale-parity.mjs`: 1262 keys each, 0 missing;
  `raw-key-scan.mjs`: PASS on 22 routes; static colour scan: public 0 violations
- vitest: 149 pass / 2 fail / 110 skipped; the failures are the unchanged backend-only suites
  (`ECONNREFUSED` on :9091, backend deliberately not started)
- `vite build`: pass in 23.62s, no chunk-size warning (postbuild copy intentionally skipped)
- Device/viewport/geometry evidence: see tables above and `captures.json`

## Residual limitations

- The first `/body` visit still transfers 7.08MB of model data (required for the seven-organ
  figure); repeat visits are now cache hits. A smaller first load needs an asset-pipeline rebuild.
- The `/models/` CacheFirst cache is URL-keyed and the anatomy files are not fingerprinted;
  rebuilding them requires bumping `body-models-cache` (documented in `vite.config.mts`).
- No visual inspection of these PNGs is performed or claimed. The evidence is DOM geometry, hit
  tests, layout arithmetic, pixel statistics/hashes and browser assertions.

## Preservation

- Round 21, 22, 23, 24 and 25 preview directories and review branches untouched.
- No application repository change was staged, committed, pushed or deployed; `README.md`,
  `Makefile`, database, Go backend and Docker stack untouched.
- The dev server and backend were not restarted.
