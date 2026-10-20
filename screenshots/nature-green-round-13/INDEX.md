# Orkod — Nature-Green Round 13 screenshots

Screenshot-only review set (no source code). Captured against the live
site at https://localhost with the harness `frontend/scripts/verify-final.mjs`
(25 shots) plus three supplementary page captures. See `verification-notes.txt`.

Round 13 changes visible here: the homepage is now **two** full-screen nature
sections (Begin your journey / The Orkod Book) on new original artwork, the
header leads with a single "Get started" action, and the questionnaire/booking
are gated behind sign-in (the two `*-gate` shots show the login gate).

| File | What it shows |
| --- | --- |
| `01-language-gate.png` | Language selection gate (1440x900) |
| `02-start-neutral.png` | /start neutral — two choices, nature scene |
| `03-start-left-preview.png` | /start left hover — translucent body preview |
| `04-start-right-preview.png` | /start right hover — translucent questionnaire preview |
| `05-home-chapter-1.png` | Homepage section 01 — Begin your journey (forest hero) |
| `06-home-chapter-2.png` | Homepage section 02 — The Orkod Book (editorial) |
| `08-body-desktop.png` | /body default full-body framing |
| `09-body-mobile.png` | /body mobile (390x844) |
| `10-quiz-gate.png` | /quiz gated — redirected to /login with a gate notice |
| `10-quiz.png` | /quiz guided questionnaire (signed in) |
| `11-booking-gate.png` | /booking gated — redirected to /login |
| `11-booking.png` | /booking landing (signed in) |
| `11b-donations.png` | /donations |
| `12-home-arabic.png` | Homepage Arabic RTL |
| `13-start-arabic.png` | /start Arabic RTL |
| `14-mobile-home.png` | Mobile homepage section 01 |
| `14b-mobile-home-ch2.png` | Mobile homepage section 02 (settled at viewport top) |
| `15-mobile-start.png` | Mobile /start (fold + skip clearance) |
| `16-body-selected.png` | /body selected state |
| `17-body-brain.png` | /body brain selected (face not covered) |
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
