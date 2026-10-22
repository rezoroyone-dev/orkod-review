# Nature Green - Round 23 (homepage initial state + mobile CTA spacing)

Branch `visual-review/nature-green-round-23`, based on `main`.
Only one application file changed: `frontend/src/views/HomePage.vue`.
No redesign, no content change, no new dependency, no backend/database change.

## 1. The rail booted at 02 / 02 on a fresh desktop load

**Root cause (measured).** Snap mode was decided in `onMounted`, so
`.hp-chapters--snap` was applied only after the first render. The first
`syncChapter()` call ran in that same lifecycle step, i.e. against the
*pre-snap* layout:

| layout measured at mount | chapter 01 | chapter 02 | visible strip |
| --- | --- | --- | --- |
| before the snap class (wrong) | 326 px tall, 326 px visible | 462.5 px tall, 462.5 px visible | 788.5 px |
| after the snap class (real) | 828 px tall, 828 px visible | 828 px tall, 0 px visible | 828 px |

The old rule picked the section with the most visible pixels, so chapter 02 won
in the transient layout and the rail latched onto it. No scroll or resize event
followed, so nothing re-measured and the wrong reading stayed until the visitor
interacted. (This is also why Round 22 saw it only at desktop widths: below
961 px snap is off and the mobile CSS gives both sections a min-height from the
start.)

**Fix.** Three parts, all in `HomePage.vue`:

1. Snap mode is decided during setup, so the very first render already has the
   final height/overflow so there is no post-mount layout jump to measure.
2. The active section is read **positionally** - the section whose top is
   closest to the top of the visible strip - instead of by pixel area. Height
   changes during font/image loading can no longer hand the title to a taller
   section; it also fixes the reduced-motion layout, where both content-sized
   sections are partly on screen at load.
3. The first measurement waits for `nextTick` + one animation frame, and a
   `ResizeObserver` (scroller + both sections), `document.fonts.ready` and
   `window.load` re-sync when late layout changes arrive.

**Evidence.** Fresh loads with 250 ms network latency and the cache disabled, sampling
every animation frame from before the app boots:

- 1440x900: indicator trace `[01/02]` - chapter 02 is never shown during load
- 1280x800: indicator trace `[01/02]`
- reduced motion 1440x900: `01/02` at load, `02/02` after a rail click
- rail dots, up/down arrows, wheel, PageDown/PageUp, resizes: 26/26 assertions
  pass (indicator, `aria-current`, active dot and the physically visible chapter
  all agree)

## 2. Mobile chapter-02 CTA sat on the bottom edge

On phones chapter 02 is taller than the viewport, so at its snap point the button
was pinned to the bottom of the screen:

| viewport | CTA before | distance to bottom edge | after | distance |
| --- | --- | --- | --- | --- |
| 390x844 | 786..838 px | **5.9 px** | 760.8..812.8 px | **31.2 px** |
| 360x800 | 806..858 px | **-58.3 px (below the fold)** | 714.3..766.3 px | **33.7 px** |

The section now gives less air above the cover and slightly more below the button;
viewports 830 px or shorter also trim the cover stage's own padding. The button
keeps its exact size (173x52), nothing is hidden or clipped, the page still
scrolls normally and no scroll trap was added. Arabic RTL gets the same padding
(its CTA ends 60.3 px above the edge) and the book cover and availability wording
are untouched.

## Captures

### r23-01-home-chapter01-desktop-1440

Fresh load, 1440x900, before any interaction. Chapter 01 fills the viewport and the rail reads 01 / 02 - the defect this round fixes.

![r23-01-home-chapter01-desktop-1440](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-23/screenshots/nature-green-round-23/r23-01-home-chapter01-desktop-1440.png)

### r23-02-home-chapter01-desktop-1280

Fresh load, 1280x800, before any interaction. Rail reads 01 / 02.

![r23-02-home-chapter01-desktop-1280](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-23/screenshots/nature-green-round-23/r23-02-home-chapter01-desktop-1280.png)

### r23-03-home-chapter02-desktop-1440

Chapter 02 via the real rail control, 1440x900. Unchanged desktop composition.

![r23-03-home-chapter02-desktop-1440](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-23/screenshots/nature-green-round-23/r23-03-home-chapter02-desktop-1440.png)

### r23-04-home-chapter02-mobile-390

Chapter 02, 390x844. CTA now 31.2 px above the bottom edge (was 5.9 px).

![r23-04-home-chapter02-mobile-390](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-23/screenshots/nature-green-round-23/r23-04-home-chapter02-mobile-390.png)

### r23-05-home-chapter02-mobile-360

Chapter 02, 360x800. CTA fully visible at 33.7 px above the edge (it used to fall 58 px below the fold).

![r23-05-home-chapter02-mobile-360](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-23/screenshots/nature-green-round-23/r23-05-home-chapter02-mobile-360.png)

### r23-06-home-chapter02-mobile-390-arabic

Chapter 02, 390x844, Arabic RTL. Same spacing fix; rail and copy mirrored as before.

![r23-06-home-chapter02-mobile-390-arabic](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-23/screenshots/nature-green-round-23/r23-06-home-chapter02-mobile-390-arabic.png)

## Verification

Full numbers: [`verification.txt`](verification.txt).

- `vue-tsc --noEmit`: clean
- ESLint on `HomePage.vue`: clean
- vitest: 16 files / 149 tests pass (incl. `home.presentation.test.ts` 4/4);
  the 25 failing files and 2 failing auth tests are the unchanged backend-only
  suites (`ECONNREFUSED` on :9091, backend deliberately not started)
- `vite build`: pass (PWA, 143 precached entries)
- Round-20 regression suite run into a temp directory (Round-20 captures not
  touched): 16/17 pass; the single failure is the Round-21 superseded
  `900x1413` preview-asset assertion
- fresh-load traces, rail clicks, arrows, wheel, PageDown/PageUp, resizes,
  reduced motion and Arabic RTL: all pass

## Preservation

- Previous rounds untouched: Round 21 and Round 22 screenshots live on their own
  branches; Round 20 captures were regressed into a temp output dir.
- Context: [Round 21 index](https://github.com/rezoroyone-dev/orkod-review/blob/visual-review/nature-green-round-21/screenshots/nature-green-round-21/index.md) | [Round 22 index](https://github.com/rezoroyone-dev/orkod-review/blob/visual-review/nature-green-round-22/screenshots/nature-green-round-22/index.md)
- No application repository change was staged, committed, pushed or deployed.

> **Honesty note.** No visual inspection of these PNGs was performed or is
> claimed. The evidence is the browser assertions above.

