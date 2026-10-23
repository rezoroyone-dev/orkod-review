# Orkod — Body Explorer Final Layout Polish (Round 30)

Branch: `visual-review/nature-green-round-30`  
Base: `visual-review/nature-green-round-29`  
App HEAD: `c8013f5` (no app files staged/committed/pushed)

## Defect
The interaction instructions text (`Drag to rotate • Scroll to zoom • Click to select`) overlapped the attribution (`Anatomie : BodyParts3D (CC BY 4.0) · Corps : Mandrake (CC BY 4.0)`) at the bottom of the 3D stage in the R29 screenshots.

## Fix (minimal, no redesign)
`frontend/src/components/body/HumanBody3D.vue`:
- Moved attribution to the **bottom-left** of the stage.
- Moved the interaction hint to the **bottom-center** with increased horizontal padding.
- On **≤1280px** stage widths, the hint wraps and sits above the attribution (`bottom: 42px`) to keep both readable without overlap.
- Added a tighter breakpoint at **≤520px** (`bottom: 38px`) for small stages.
- Preserved the existing **mobile attribution strip** behavior (`@media (max-width: 1023px)` moves credit to a static caption strip under the stage unchanged).
- Fixed CSS nesting issue introduced during edit (closed the 640px media block properly).

No changes to layout, model, organ rail, selected panel, brain positioning, camera, Meshopt, single-WebGL context, or locales.

## Screenshots
All in `screenshots/nature-green-round-30/`:

| File | Viewport | State |
|---|---|---|
| `body-default-1024x768.png` | 1024×768 | Default |
| `body-selected-heart-1024x768.png` | 1024×768 | Heart selected |
| `body-default-1280x800.png` | 1280×800 | Default |
| `body-selected-heart-1280x800.png` | 1280×800 | Heart selected |
| `body-default-1440x900.png` | 1440×900 | Default |
| `body-selected-heart-1440x900.png` | 1440×900 | Heart selected |
| `body-default-390x844.png` | 390×844 | Default |
| `body-selected-heart-390x844.png` | 390×844 | Heart selected |
| `body-default-360x800.png` | 360×800 | Default |
| `body-selected-heart-360x800.png` | 360×800 | Heart selected |

## Verification
| Check | Result |
|---|---|
| `npx vue-tsc --noEmit` | **PASS** |
| `eslint src/components/body/HumanBody3D.vue` | **PASS** |
| `r29-verify-body.mjs` (5 viewports) | **PASS** — 7 organs + full-body row, selection, callout, Escape, no overflow, no console errors |
| `audit-body.mjs` | **PASS** 47/0 (EN/AR desktop+mobile, selection, keyboard, reset, framing, console clean) |
| `r29-brain-rtl.mjs` | **PASS** — brain centered in cranial cavity (relY 0.37–0.38), single WebGL canvas, AR UI mirrored/model not mirrored |
| `r30-check-overlap.mjs` (1024/1280/1440/390/360, default+selected) | **PASS** — all 10 cases, hint/credit separated or in preserved mobile strip layout, no overlap, 7 organs intact, no horizontal overflow, no console errors |
| `vitest run src/tests/BodyExplorer.interaction.test.ts` | **PASS** 6/6 |
| `vite build` | **PASS** |

**Confirmations:** Instructions and attribution never overlap. Both readable. No controls/anatomy obscured. No horizontal overflow or console errors. All seven organs selectable. Brain position, camera, Meshopt, single-WebGL, RTL/model non-mirroring, mobile strip preserved. No redesign of three-column layout/rail/panel. No unrelated visual changes.
