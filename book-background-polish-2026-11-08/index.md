# ORKOD Final Book Background Polish (2026-11-08)

- **Application:** `nature-green-final` @ `95e76ea74a0eab98df47db3b39b45e6a6760d24f` (pushed). Home hero unchanged.
- **Change (small, genuine):** desktop book atmosphere uses a cropped source `02-orkod-book-section-pond-golden-hour-desktop.webp` (extracted from the approved pond/golden-hour image, top/left area, resized to original aspect) to remove the **visible bottom-right generic book stack** that competed with the real product. Mobile uses the preserved `-mobile.webp` crop. Applied to **Home Chapter 2** (`HomePage.vue`) and **BookShop** (`BookShopPage.vue`) with adjusted `object-position`/veil to keep pond/garden/golden sunlight atmosphere and left copy readable.
- **Preserved:** approved Home hero; existing mobile composition where workable; **real Orkod Book cover** remains the only recognizable book product (foreground, unchanged asset/status); Book availability status unchanged; no other pages redesigned.

## Verification
- `make typecheck`/`npm run typecheck`: **exit 0**
- safe suite (9 files): **91 tests passed, exit 0**
- `npx vite build`: **exit 0**
- `make verify` (completed): **exit 0**

## Before/after (actual browser captures, EN/FR/AR/ID, 1440×900 desktop + 390×844 mobile)
| Locale | Home Ch2 desktop before | after | Home Ch2 mobile before | after | Book desktop before | after | Book mobile before | after |
|---|---|---|---|---|---|---|---|---|
| EN | [b](./before/en-home-ch2-1440x900-before.png) | [a](./after/en-home-ch2-1440x900-after.png) | [b](./before/en-home-ch2-390x844-before.png) | [a](./after/en-home-ch2-390x844-after.png) | [b](./before/en-book-1440x900-before.png) | [a](./after/en-book-1440x900-after.png) | [b](./before/en-book-390x844-before.png) | [a](./after/en-book-390x844-after.png) |
| FR | [b](./before/fr-home-ch2-1440x900-before.png) | [a](./after/fr-home-ch2-1440x900-after.png) | [b](./before/fr-home-ch2-390x844-before.png) | [a](./after/fr-home-ch2-390x844-after.png) | [b](./before/fr-book-1440x900-before.png) | [a](./after/fr-book-1440x900-after.png) | [b](./before/fr-book-390x844-before.png) | [a](./after/fr-book-390x844-after.png) |
| AR | [b](./before/ar-home-ch2-1440x900-before.png) | [a](./after/ar-home-ch2-1440x900-after.png) | [b](./before/ar-home-ch2-390x844-before.png) | [a](./after/ar-home-ch2-390x844-after.png) | [b](./before/ar-book-1440x900-before.png) | [a](./after/ar-book-1440x900-after.png) | [b](./before/ar-book-390x844-before.png) | [a](./after/ar-book-390x844-after.png) |
| ID | [b](./before/id-home-ch2-1440x900-before.png) | [a](./after/id-home-ch2-1440x900-after.png) | [b](./before/id-home-ch2-390x844-before.png) | [a](./after/id-home-ch2-390x844-after.png) | [b](./before/id-book-1440x900-before.png) | [a](./after/id-book-1440x900-after.png) | [b](./before/id-book-390x844-before.png) | [a](./after/id-book-390x844-after.png) |

Headless SwiftShader captures; please visually confirm the generic book stack is gone on desktop and the real Orkod Book cover remains the only recognizable product.
