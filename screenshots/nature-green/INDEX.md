# Nature-Green Visual Review — Round 11 Screenshots

Latest automated capture run (Round 11, 2026-10-20) of the ORKOD public site,
served at https://localhost, 1440×900 desktop unless noted. Each PNG is a
full-viewport screenshot taken by `verify-final.mjs`; all probes in that run
passed (see the honest-limits note at the bottom).

## Requested views

| File | View |
|---|---|
| `01-language-gate.png` | Language selection screen (EN/AR/FR/ID, search, keyboard highlight) |
| `02-start-neutral.png` | `/start` neutral state — both panels at rest (body silhouette ~0.08, quiz hidden) |
| `03-start-left-preview.png` | `/start` body preview on hover — figure flowed below the copy, full panel width, feathered |
| `04-start-right-preview.png` | `/start` questionnaire preview on hover — real quiz capture, four-edge feathered, 0.78 |
| `15-mobile-start.png` | `/start` on mobile (390×844, touch) — resting translucency, no card chrome |
| `05-home-chapter-1.png` | Homepage chapter 01 — "Start your journey" |
| `06-home-chapter-2.png` | Homepage chapter 02 — book & services (booking honesty visible) |
| `07-home-chapter-3.png` | Homepage chapter 03 — family & donations |
| `08-body-desktop.png` | 3D body explorer, desktop default state (no selection, hint shown) |
| `09-body-mobile.png` | 3D body explorer, mobile (390×844) |
| `16-body-selected.png` | Selected-organ view — kidneys, detail panel + callout dot in torso band |
| `17-body-brain.png` | Organ: Brain selected |
| `18-body-heart.png` | Organ: Heart selected |
| `19-body-lungs.png` | Organ: Lungs & breath selected |
| `20-body-liver.png` | Organ: Liver selected |
| `21-body-stomach.png` | Organ: Stomach selected |
| `22-body-intestines.png` | Organ: Intestines selected |
| `10-quiz.png` | Questionnaire (`/quiz`) — real question step |
| `11-booking.png` | Booking page (`/booking`) — gold only on payment, honest placeholders |
| `12-home-arabic.png` | Homepage in Arabic (RTL) |
| `13-start-arabic.png` | `/start` in Arabic (RTL) |

## Additional captures from the same run

| File | View |
|---|---|
| `11b-donations.png` | Donations page (`/donations`) |
| `14-mobile-home.png` | Homepage mobile, chapter 01 (390×844) |
| `14b-mobile-home-ch2.png` | Homepage mobile, chapter 02 (observer-settled indicator `02 / 03`) |
| `14c-mobile-home-ch3.png` | Homepage mobile, chapter 03 (indicator `03 / 03`) |

## Notes

- Round 11 changes under review: `/start` text-safe body layout (copy on top,
  figure below at full panel width, rest 0.08 / hover 0.9), feathered quiz
  capture, brain/face compositing fix (brain opacity 0.30), invisible-at-rest
  hotspot dots, subtle selector hover, mobile card-chrome removal.
- Captured by the automated harness (DOM geometry + computed-style assertions
  all green: overflow matrix, purple scan, raw-key scan, 0 console errors).
- Honest limit: the screenshots were **not** reviewed by a human or a vision
  model before publishing — that is exactly what this review is for.
- Screenshots only — no application source code is included in this directory.
