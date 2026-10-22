# Nature Green - Round 22 (corrected homepage chapter 02)

Branch `visual-review/nature-green-round-22`, based on `main`.
No application code, styling, data, database or backend was changed.

## The defect being corrected

Round 21 published `r21-16-home-book-section.png` as homepage chapter 02,
but the image actually shows the **language-selection gate**. The homepage is
`/home`; `/` is `LanguageGate` (`src/router.ts:45-55`). The capture navigated to
`/` and therefore photographed the gate. Its index entry was wrong.

This round navigates to `/home`, opens chapter 02 through the page's real
chapter control (`.hp-nav-dot` index 1) and proves the state in the browser
before taking the shutter.

## Pre-capture checks (all machine-checked, all passed)

For each capture the script asserts, in the live page:

1. `location.pathname === "/home"` (homepage route), before and after navigation;
2. no `main.gate` element exists - the language-selection screen is not displayed;
3. exactly two chapter dots exist and the second one carries `.hp-nav-dot--active`,
   `aria-current="step"`, and the indicator reads `02 / 02`;
4. chapter 02 (`#hp-ch2`) is aligned to the viewport top (within 8 px) while
   chapter 01 has been scrolled fully out - i.e. the section physically on screen
   is chapter 02, not merely the indicator;
5. the book heading (`#hp-ch2 .hp-h2`) is non-empty, visible, inside the viewport
   and not covered at its centre (`elementFromPoint` hit-test);
6. the book CTA (`#hp-ch2 .hp-actions a[href="/book"]`) has a label, is visible,
   inside the viewport, not covered, and still points at `/book`.

The script aborts without saving a file if any assertion fails. Full numbers:
[`verification.txt`](verification.txt).

## Captures

### r22-01-home-chapter02-desktop-1440

Homepage `/home`, chapter 02, desktop 1440x900 (English). Chapter 01 scrolled out;
chapter 02 fills 72..900 px; heading at 367..421 px; CTA at 595..647 px.

![r22-01](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-22/screenshots/nature-green-round-22/r22-01-home-chapter02-desktop-1440.png)

### r22-02-home-chapter02-mobile-390

Homepage `/home`, chapter 02, mobile 390x844 (touch, English). Page-scroll mode;
chapter 02 at 0..939 px; heading at 528..561 px; CTA at 786..838 px (inside the
844 px viewport).

![r22-02](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-22/screenshots/nature-green-round-22/r22-02-home-chapter02-mobile-390.png)

## Context from Round 21

- Round 21 index: https://github.com/rezoroyone-dev/orkod-review/blob/visual-review/nature-green-round-21/screenshots/nature-green-round-21/index.md
- Homepage section, still valid for the other pages: [r21-16](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-21/screenshots/nature-green-round-21/r21-16-home-book-section.png) - **known to show the language gate**, superseded by this round.
- Book page: [r21-13](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-21/screenshots/nature-green-round-21/r21-13-book.png) | [r21-14](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-21/screenshots/nature-green-round-21/r21-14-book-mobile-390.png) | [r21-15](https://raw.githubusercontent.com/rezoroyone-dev/orkod-review/visual-review/nature-green-round-21/screenshots/nature-green-round-21/r21-15-book-arabic.png)

## Observed, not changed

At 1440x900 a fresh load of `/home` already shows the chapter indicator at
`02 / 02` while chapter 01 still occupies the viewport; it corrects itself on
scroll or resize. At 390x844 the initial state is correct (`01 / 02`). This
pre-existing indicator quirk is reported, not fixed: Round 22 does not touch
application code. Because of it, the chapter-02 verdict above rests on section
geometry and hit-tests, not on the indicator text alone.

> **Honesty note.** No visual inspection of these PNGs was performed or is
> claimed. The evidence is the in-browser assertions listed above.

