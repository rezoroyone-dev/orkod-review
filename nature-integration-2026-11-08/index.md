# ORKOD Premium Nature Image Integration (2026-11-08)

- **Application:** `rezoroyone-dev/pranichealing`, branch `nature-green-final` @ `70d7a5f463e9c89dd3b23b48a08846786e330381`
- **Scope:** evidence-only (screenshots + index). No app source.
- **Images integrated (user-approved, nature-only, no people/faces/silhouettes/statues/human figures):**
  1. `01-orkod-home-hero-waterfall-lotus-garden.png/webp (+mobile)` — **Home hero** (Asian garden/waterfall/lotus/bridge/pavilion). Rule of Thirds: scenic interest biased right; left third kept quieter for headline/CTAs via `object-position` + gradient veil. Intentional mobile crop.
  2. `02-orkod-book-section-pond-golden-hour.png/webp (+mobile)` — **Orkod Book / Home Chapter 2 atmosphere** (pond/garden/golden hour). **Real Orkod Book cover** (`orkod-book-cover.png`, existing product asset) displayed prominently in foreground; generated background not presented as the product; crop/veil keep cover/copy readable.
  3. `03-orkod-supporting-botanical-waves.png/webp` — **supporting/botanical, kept available for selective future use**; not added to content pages / not forced everywhere.
- **Preserved:** `LanguageGate` accepted nature image unchanged; `Start` keeps actual ORKOD body + localized quiz previews; `/body` 3D model centrepiece unchanged (no decorative human/medical imagery); `Conditions`/`Quiz` warm cream/sage readability surfaces; `Practitioners`/`Doctors`/`Booking`/`Donations` kept clean/trustworthy (no invented people/portraits/credentials). Originals preserved; WebP optimized locally; provenance recorded in `frontend/public/images/nature/ASSETS.md` + `SOURCES.json` (no attribution removed, no hotlinks).

## Verification (actual)
- `npm run typecheck` (vue-tsc): **exit 0**
- Safe suite (9 files): **91 tests passed, exit 0** — `i18n.parity, home.presentation, body-architecture, BodyExplorer.interaction, a11y.public, PublicFeatures.integrity, locale.persistence, features, Router.unit` (`home.presentation` assertion updated to the new approved hero asset).
- `npm run lint`: **exit 1 (pre-existing repo debt, honest)** — `122 problems (70 errors, 52 warnings)`, unrelated.
- `npx vite build`: **exit 0**
- `make verify` (chained typecheck+safe tests+build, completed): **exit 0**

## Screenshots (actual browser captures, EN/FR/AR/ID, 1440×900/768×1024/390×844/360×800)
### Home hero
| Locale | 1440×900 | 768×1024 | 390×844 | 360×800 |
|---|---|---|---|---|
| EN | [img](./home/en-home-hero-1440x900.png) | [img](./home/en-home-hero-768x1024.png) | [img](./home/en-home-hero-390x844.png) | [img](./home/en-home-hero-360x800.png) |
| FR | [img](./home/fr-home-hero-1440x900.png) | [img](./home/fr-home-hero-768x1024.png) | [img](./home/fr-home-hero-390x844.png) | [img](./home/fr-home-hero-360x800.png) |
| AR | [img](./home/ar-home-hero-1440x900.png) | [img](./home/ar-home-hero-768x1024.png) | [img](./home/ar-home-hero-390x844.png) | [img](./home/ar-home-hero-360x800.png) |
| ID | [img](./home/id-home-hero-1440x900.png) | [img](./home/id-home-hero-768x1024.png) | [img](./home/id-home-hero-390x844.png) | [img](./home/id-home-hero-360x800.png) |

### Home Chapter 2 / Book
| Locale | 1440×900 | 768×1024 | 390×844 | 360×800 |
|---|---|---|---|---|
| EN | [img](./home/en-home-ch2-1440x900.png) | [img](./home/en-home-ch2-768x1024.png) | [img](./home/en-home-ch2-390x844.png) | [img](./home/en-home-ch2-360x800.png) |
| FR | [img](./home/fr-home-ch2-1440x900.png) | [img](./home/fr-home-ch2-768x1024.png) | [img](./home/fr-home-ch2-390x844.png) | [img](./home/fr-home-ch2-360x800.png) |
| AR | [img](./home/ar-home-ch2-1440x900.png) | [img](./home/ar-home-ch2-768x1024.png) | [img](./home/ar-home-ch2-390x844.png) | [img](./home/ar-home-ch2-360x800.png) |
| ID | [img](./home/id-home-ch2-1440x900.png) | [img](./home/id-home-ch2-768x1024.png) | [img](./home/id-home-ch2-390x844.png) | [img](./home/id-home-ch2-360x800.png) |

### BookShop page
| Locale | 1440×900 | 768×1024 | 390×844 | 360×800 |
|---|---|---|---|---|
| EN | [img](./book/en-book-1440x900.png) | [img](./book/en-book-768x1024.png) | [img](./book/en-book-390x844.png) | [img](./book/en-book-360x800.png) |
| FR | [img](./book/fr-book-1440x900.png) | [img](./book/fr-book-768x1024.png) | [img](./book/fr-book-390x844.png) | [img](./book/fr-book-360x800.png) |
| AR | [img](./book/ar-book-1440x900.png) | [img](./book/ar-book-768x1024.png) | [img](./book/ar-book-390x844.png) | [img](./book/ar-book-360x800.png) |
| ID | [img](./book/id-book-1440x900.png) | [img](./book/id-book-768x1024.png) | [img](./book/id-book-390x844.png) | [img](./book/id-book-360x800.png) |

## Notes
- Captured via headless Chromium/SwiftShader; I cannot visually inspect PNG pixels in this environment — please review the actual images for contrast/CTA visibility/focal point, “no people” in decorative backgrounds, and that Book shows the real Orkod Book cover (not generic books in the background). Locale set via `orkod.locale`; AR uses RTL page direction.
