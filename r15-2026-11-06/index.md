# Orkod Visual Review — nature-green r15 (2026-11-06)

**App branch:** `nature-green-final` @ `9ab6879` (+ this session’s fixes)
**Review branch:** `visual-review/nature-green-r15-2026-11-06`
**Base URL:** `https://localhost` (Caddy → Vite dev, self-signed)
**Locale:** `en` (RTL set verified separately in Arabic)

## Audit summary (automated, real browser/Edge headless)
- Routes checked: 19 public routes × 5 viewports (1440×900, 768×1024, 414×896, 390×844, 360×800) + RTL Arabic (home/start/body/contact @ 1440).
- **Horizontal overflow (>2px):** 0
- **Page errors:** 0
- **Raw i18n keys:** 0
- **Console errors (actionable):** 0 reproducible (a transient Pinia timing warning appeared once during the long run on `/practitioners` at 1440 and was not reproducible on retry/navigation; no product fix applied).
- **Auth gates:** `/quiz` → `/login?redirect=/quiz`, `/booking` → `/login?redirect=/booking` (preserved). Confirmed.
- **Body (`/body`):** canvas renders at 1440 and 390; all 7 organs selectable (Brain, Lungs & breath, Heart, Liver, Stomach, Intestines, Kidneys) + Left/Right Hand controls present; selection shows detail/callout; keyboard activation verified (Heart). No overflow.
- **RTL (ar):** `dir=rtl`, `lang=ar`, overflow 0 on home/start/body/contact.

## Fix applied this session (app repo)
- **`/donate` → `/donations` redirect** (`frontend/src/router.ts`). The public route is `/donations`; `/donate` previously 404’d. Verified redirect to `/donations` (h1 “Donate a session to those in need”).

## Key screenshots
| Page | Desktop 1440×900 | Mobile 390×844 |
|---|---|---|
| Home | [home-1440x900.png](home-1440x900.png) | [home-390x844.png](home-390x844.png) |
| Start | [start-1440x900.png](start-1440x900.png) | [start-390x844.png](start-390x844.png) |
| Body | [body-1440x900.png](body-1440x900.png) / [body-interact-1440x900.png](body-interact-1440x900.png) | [body-390x844.png](body-390x844.png) / [body-interact-390x844.png](body-interact-390x844.png) |
| Conditions | [conditions-1440x900.png](conditions-1440x900.png) | [conditions-390x844.png](conditions-390x844.png) |
| Booking gate | [booking-gate-1440x900.png](booking-gate-1440x900.png) | [booking-gate-390x844.png](booking-gate-390x844.png) |
| Donations | [donations-1440x900.png](donations-1440x900.png) | [donations-390x844.png](donations-390x844.png) |
| /donate redirect | [donate-1440x900.png](donate-1440x900.png) | — |
| Symptoms | [symptoms-1440x900.png](symptoms-1440x900.png) | [symptoms-390x844.png](symptoms-390x844.png) |
| Practitioners | [practitioners-1440x900.png](practitioners-1440x900.png) | [practitioners-390x844.png](practitioners-390x844.png) |
| Doctors | [doctors-1440x900.png](doctors-1440x900.png) | [doctors-390x844.png](doctors-390x844.png) |
| Book | [book-1440x900.png](book-1440x900.png) | [book-390x844.png](book-390x844.png) |
| Family | [family-1440x900.png](family-1440x900.png) | [family-390x844.png](family-390x844.png) |
| Academy | [academy-1440x900.png](academy-1440x900.png) | [academy-390x844.png](academy-390x844.png) |
| Community | [community-1440x900.png](community-1440x900.png) | [community-390x844.png](community-390x844.png) |
| Consultations | [consultations-1440x900.png](consultations-1440x900.png) | [consultations-390x844.png](consultations-390x844.png) |
| Assistant | [assistant-1440x900.png](assistant-1440x900.png) | [assistant-390x844.png](assistant-390x844.png) |
| Contact | [contact-1440x900.png](contact-1440x900.png) | [contact-390x844.png](contact-390x844.png) |
| Login | [login-1440x900.png](login-1440x900.png) | [login-390x844.png](login-390x844.png) |
| RTL Home | [rtl-home-1440x900.png](rtl-home-1440x900.png) | — |
| RTL Start | [rtl-start-1440x900.png](rtl-start-1440x900.png) | — |
| RTL Body | [rtl-body-1440x900.png](rtl-body-1440x900.png) | — |
| RTL Contact | [rtl-contact-1440x900.png](rtl-contact-1440x900.png) | — |

Full set: 102 PNGs in this folder + [audit-report.json](audit-report.json).

## Known / not changed
- Repo-wide lint debt remains pre-existing (documented baseline). Targeted lint on changed files: clean.
- Backend-dependent integration tests remain environmental when backend not on host `:9091`.
- `/donate` alias added as a safe redirect; no other accepted feature redesigned.
