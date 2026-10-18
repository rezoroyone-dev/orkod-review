# ORKOD — nature-green visual review (round 2)

Refreshed live captures of the running app (https://localhost), taken with
`frontend/scripts/verify-final.mjs` (Playwright + Edge), rendering viewport
1440×900 unless noted.

Round 2 covers the targeted corrections from the previous review: `/start`
preview assets framed to the real panel (desktop + mobile), homepage chapter 01
navigation clearance, chapter 02 book/spread balance, chapter 03 nature imagery,
and the reduced `/body` organ-focus zoom.

| File | Page / state | Viewport |
| --- | --- | --- |
| `01-language-gate.png` | Language gate (nature photo + circular logo + search) | 1440×900 |
| `02-start-neutral.png` | `/start` resting state — both panels, nature wash, botany | 1440×900 |
| `03-start-left-preview.png` | `/start` — left panel hover (`/body` preview) | 1440×900 |
| `04-start-right-preview.png` | `/start` — right panel hover (`/quiz` preview) | 1440×900 |
| `05-home-chapter-1.png` | `/home` chapter 01 "Start your journey" (arch photo, rail clearance) | 1440×900 |
| `06-home-chapter-2.png` | `/home` chapter 02 "The book & services" (larger cover, balanced spread) | 1440×900 |
| `07-home-chapter-3.png` | `/home` chapter 03 "Share care" (visible nature imagery) | 1440×900 |
| `08-body-desktop.png` | `/body` body explorer — 7-organ selector bar + 3D figure | 1440×900 |
| `09-body-mobile.png` | `/body` body explorer | 390×844 (dsf 2, touch) |
| `10-quiz.png` | `/quiz` question + answer options | 1440×900 |
| `11-booking.png` | `/booking` (gold reserved for the payment action) | 1440×900 |
| `12-home-arabic.png` | `/home` Arabic (RTL) — nav physically mirrored to the left | 1440×900 |
| `13-start-arabic.png` | `/start` Arabic (RTL) — Skip link mirrored | 1440×900 |
| `14-mobile-home.png` | `/home` chapters + bottom pill navigation | 390×844 (dsf 2, touch) |
| `15-mobile-start.png` | `/start` stacked panels (mobile preview crops) | 390×844 (dsf 2, touch) |

Notes:

- These are unedited browser captures of the real application; no mockups.
- `/doctors` and `/doctors/:id` are not included: no data is seeded, so they
  render their intentional empty states.
- The `/start` hover previews are now panel-shaped captures of `/body` and
  `/quiz` (714×900 desktop, 390×422 mobile) — see
  `frontend/scripts/capture-start-previews.mjs`.
