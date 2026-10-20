# Orkod — Nature-Green Round 14 screenshots

Screenshot-only review set (no source code). Captured against the live
site at https://localhost with the harness `frontend/scripts/verify-final.mjs`
(29 shots). See `verification-notes.txt` for the raw probe output.

Round 14 changes visible here:

- **Homepage artwork** — section 01 (Begin your journey) now uses a new,
  realistic nature photograph (`/images/nature/home-forest.jpg`) instead of the
  earlier procedural "game-look" forest; section 02 (The Orkod Book) uses a
  cooler, blurred editorial backdrop.
- **Simplified header** — left: circular logo + a single "Get started" action;
  right: Book, Donate, Language and Login/account. Legacy links moved to the
  mobile drawer / footer. See `07-header-desktop.png` and `07-header-mobile.png`.
- **Login gate rebranded** — the login page (`10-quiz-gate.png`,
  `11-booking-gate.png`) uses a dark-green nature backdrop and Orkod wording
  ("Log in to Orkod" / "Orkod Center — natural healing") instead of the old
  cosmic-blue "Divine Healing" branding.
- **Selected-brain fix** — the brain overlay is now a muted grey-mauve at lower
  opacity, so no bright-white blob appears over the forehead
  (`17-body-brain.png`).

| File | What it shows |
| --- | --- |
| `01-language-gate.png` | Language selection gate (1440x900) |
| `02-start-neutral.png` | /start neutral — two choices, nature scene |
| `03-start-left-preview.png` | /start left hover — translucent body preview |
| `04-start-right-preview.png` | /start right hover — translucent questionnaire preview |
| `05-home-chapter-1.png` | Homepage section 01 — Begin your journey (new forest photo) |
| `06-home-chapter-2.png` | Homepage section 02 — The Orkod Book (editorial) |
| `07-header-desktop.png` | Simplified public header (desktop) |
| `07-header-mobile.png` | Simplified public header (mobile) |
| `08-body-desktop.png` | /body default full-body framing |
| `09-body-mobile.png` | /body mobile (390x844) |
| `10-quiz-gate.png` | /quiz gated — redirected to /login (rebranded login page) |
| `10-quiz.png` | /quiz guided questionnaire (signed in) |
| `11-booking-gate.png` | /booking gated — redirected to /login (rebranded login page) |
| `11-booking.png` | /booking landing (signed in) |
| `11b-donations.png` | /donations |
| `12-home-arabic.png` | Homepage Arabic RTL |
| `13-start-arabic.png` | /start Arabic RTL |
| `14-mobile-home.png` | Mobile homepage section 01 |
| `14b-mobile-home-ch2.png` | Mobile homepage section 02 (settled at viewport top) |
| `15-mobile-start.png` | Mobile /start (fold + skip clearance) |
| `16-body-selected.png` | /body selected state |
| `17-body-brain.png` | /body brain selected (no bright-white blob over forehead) |
| `18-body-heart.png` | /body heart selected |
| `19-body-lungs.png` | /body lungs selected |
| `20-body-liver.png` | /body liver selected |
| `21-body-stomach.png` | /body stomach selected |
| `22-body-intestines.png` | /body intestines selected |
| `23-practitioners.png` | /practitioners directory |
| `24-family.png` | /family |
| `25-book.png` | /book — honest "in preparation" status |

Note: screenshot review is for human inspection; the automated checks cover
DOM geometry, computed styles and pixel samples only.
