# Orkod — Organ & Condition Reference and Public Journey Review (Round 32)

Branch: `visual-review/conditions-round-32`  
Base: `visual-review/nature-green-round-31`  
Source: current Orkod working tree (uncommitted in the application repository)

## What shipped

### Complete organ / condition reference
- New public route `/conditions` (`frontend/src/views/public/ConditionsPage.vue`) with:
  - safety notice and “not a diagnosis” language;
  - search across system, organ and condition names;
  - ten system filters with counts and clear filters;
  - result count, organ cards, full condition lists and review flags;
  - links from 3D-modelled organs to `/body?organ=…` and organ pages;
  - source attribution and responsible-use section;
  - empty state, responsive layout, RTL support and screenshots.
- Complete supplied dataset in `frontend/src/data/conditions.ts`: **10 systems, 91 organ entries, 327 conditions, 4 ambiguous entries flagged** rather than silently corrected.
- Seven 3D organ mappings only: brain, lungs, heart, liver, stomach, intestines, kidneys.
- Cross-links:
  - `/body?organ=heart` selects the heart and surfaces “View associated conditions” → `/conditions?system=circulation#system-circulation`;
  - `/organs/heart` shows 8 associated conditions and links back to the reference;
  - `/symptoms` has a conditions CTA;
  - footer and mobile navigation expose the reference.
- Four locales (`en`, `fr`, `ar`, `id`) updated with 1308 keys each; Arabic renders RTL without mirroring the 3D anatomy stage.
- Search normalization covers case, accents, whitespace, `œ → oe`, `æ → ae` and curly apostrophes.

### Consent enforcement
- Public booking now requires explicit consent server-side (`toSchedule` returns `errCodeConsentRequired` before time validation).
- The booking form sends `consent` and keeps Confirm disabled until the checkbox is selected.
- Generic booking still ignores privileged client-supplied fields and summary payloads exclude attendee PII.

### Accessibility and mobile fixes found during review
- Condition “not modelled in 3D” text contrast raised to the muted design token (`#5D7163`), clearing 84 serious axe findings.
- Language button accessible name now includes the visible locale code.
- Mobile drawer moved outside the `backdrop-filter` header so it is full viewport height instead of collapsing to the header height.
- Removed an invalid separator child from the drawer’s `role="list"`; the account section now uses a styled divider on the first account entry.
- Mobile drawer verified reachable down to the final `/contact` entry.

## Screenshots

All files are in `screenshots/conditions-round-32/`.

| Screenshot | Notes |
|---|---|
| `conditions-1440-top.png` | Desktop reference, hero, safety notice, all systems. |
| `conditions-1440-search.png` | Accent-insensitive search for `epilepsie`. |
| `conditions-1440-rtl.png` | Arabic RTL reference. |
| `conditions-768.png` | Tablet layout. |
| `conditions-390.png` | Mobile layout. |
| `conditions-320.png` | Narrow mobile layout. |
| `conditions-body-heart.png` | `/body?organ=heart` selection and reference link. |
| `conditions-organ-heart.png` | `/organs/heart` associated conditions. |
| `conditions-mobile-menu.png` | Mobile drawer containing the Conditions entry. |
| `desktop-home.png` | Public homepage after header/drawer fix. |
| `desktop-body.png` | 3D body stage. |
| `desktop-symptoms.png` | Symptoms index with reference CTA. |
| `desktop-conditions.png` | Desktop reference from the journey matrix. |
| `desktop-practitioners.png` | Practitioner directory. |
| `desktop-book.png` | Book page. |
| `mobile-home.png` | Homepage at 390×844. |
| `mobile-body.png` | 3D body at 390×844. |
| `mobile-symptoms.png` | Symptoms at 390×844. |
| `mobile-conditions.png` | Reference at 390×844. |
| `mobile-practitioners.png` | Practitioners at 390×844. |
| `mobile-book.png` | Book page at 390×844. |

## Verification

| Check | Result |
|---|---|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** (PWA 150 precache entries) |
| Selected Vitest suite (11 files: conditions, i18n parity, router, body, a11y, moderation, locales, home, public features, topic content) | **PASS** (95/95 tests) |
| `scripts/verify-conditions.mjs` | **PASS** (327 conditions, 10 systems, 91 organs, 4 flags; search/filter/deep links; 1440/768/390/320; EN + AR; symptoms, footer and mobile menu entry points; axe serious/critical = 0) |
| `scripts/verify-release.mjs` | **PASS** (25 public routes at 1440 and 390; language gate → start → home; sticky header; full-height drawer and last-entry navigation; no raw keys, page errors or overflow) |
| Focused Go tests (`TestPublicBooking*`, `TestReviewFromRequest*`, `TestPublicDoctor*`) | **PASS** (run against disposable PostgreSQL test container) |
| `go build ./... && go vet ./handlers ./config` | **PASS** |
| `npm run lint` | **FAIL — pre-existing only** (39 errors / 52 warnings in legacy scripts, admin components and tests; no errors reported in the new condition files) |

Browser checks used Microsoft Edge through `playwright-core` at `https://localhost`, with self-signed TLS ignored. The dev server service-worker error noise was filtered; all other page and console errors were treated as failures.

## Notes and limits

- No database schema changes or migrations were made. No application-repository commit, push or deployment was performed; this review repository is the only published output.
- Image viewing is unavailable in the execution environment. Visual claims are limited to measured DOM geometry, computed styles, screenshots captured by the browser, and automated assertions.
- `/quiz`, `/booking` and `/specialty/heart` correctly redirect to `/login?redirect=…` for guests. `/start` and `/login` intentionally use the bare shell without the public header.
- The repository snapshot itself was not re-synced in this round; code paths refer to the application working tree.
