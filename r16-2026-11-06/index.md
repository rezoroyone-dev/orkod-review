# Orkod Visual Review — nature-green r16 (2026-11-06)

**App:** 
ature-green-final @ ad4041 (no new app code committed this round)
**Review branch:** isual-review/nature-green-r16-2026-11-06

## Scope (Round 16)
Body visual accuracy (source assignments + rendered ROI sampling + per-organ canvas captures), interaction/perf measurement, systematic navigation crawl (19 routes), /donate→/donations redirect re-verified.

## Navigation integrity
- Crawl: 19 routes, visible links/actions. **1 flagged:** /models/anatomy/ATTRIBUTION.md on /body — “unknown Vue route” to the crawler but a **valid static asset (HTTP 200)**. **No broken internal routes/CTAs/incorrect redirects found.** /donate → /donations confirmed. Intentional auth gates preserved (/quiz,/booking).

## Body — source-of-truth color assignments (verified)
rontend/src/data/anatomy.ts / REGION_COLORS + HumanBody3D.vue apply REGION_COLORS to organ/hand materials.
| Organ | Expected | Assigned |
|---|---:|---:|
| Brain | #a89aa2 | #a89aa2 |
| Lungs | #f2a6c0 | #f2a6c0 |
| Heart | #d93a3f | #d93a3f |
| Liver | #8f2f2f | #8f2f2f |
| Stomach | #f2b03c | #f2b03c |
| Intestines | #c98d86 | #c98d86 |
| Kidneys | #c0572e | #c0572e |
| Hands (L/R) | #b8c4b8 | #b8c4b8 (leftHand/ightHand) |

DOM/interaction: all 7 organs + Left/Right Hand present and selectable; selection shows detail/callout; keyboard activation (Heart) verified. Front/back/callout placement — see captures (human review; see limitation).

## Body — rendered pixel sampling (headless swiftshader, ROI, green-stage/near-neutral filtered)
Headless WebGL (swiftshader) + lighting/emissive/blending mute saturation; **exact on-screen hex cannot be asserted from headless sampling alone**. Per-organ ROI/canvas captures are provided for human visual verification.

| Organ | Expected | Top saturated ROI samples (hex, sat, n) |
|---|---:|---|
| Brain | #a89aa2 | (no saturated buckets above threshold in ROI) |
| Lungs & breath | #f2a6c0 | #4e6a5e (0.27,24); #4f6b60 (0.26,3); #4d675b (0.25,3) |
| Heart | #d93a3f | #4e6a5d (0.27,8); #557061 (0.24,1); #4f675b (0.23,2) |
| Liver | #8f2f2f | #557061 (0.24,1); #4f665a (0.23,1); #546a5f (0.21,18) |
| Stomach | #f2b03c | #4e685d (0.25,3); #4e675d (0.24,5); #546d63 (0.22,3) |
| Intestines | #c98d86 | #4f685e (0.24,1); #4f665b (0.23,3); #536a5e (0.22,11) |
| Kidneys | #c0572e | #4f675c (0.24,6); #4f685e (0.24,2); #536b62 (0.23,5) |
| Left Hand | #b8c4b8 | #52695f (0.22,1); #546b60 (0.21,1); #5a7066 (0.20,1) |
| Right Hand | #b8c4b8 | #597167 (0.22,8); #5a7369 (0.21,17); #6e837a (0.17,2484) |

## Performance (measured, 1440×900)
- Canvas present: ~**2.7s** from nav start; settled wait total: ~**5.7s** (includes fixed waits).
- Selection response (click → ~350ms settle, detail present): ~**1.57–2.91s** per interaction in this run (includes Full body reset/camera + fixed waits; not a pure input latency). Repeated Heart/Brain selections remained responsive (detail shown). JS heap ~80/105 MB (Chromium performance.memory).
- **No demonstrated regression** fixed; no model replacement.

## Artifacts
- Per-organ canvas: ody-canvas-*.png, ROI: ody-roi-*.png, nav: 
av-audit.json, perf/color data: ody-color-report-v2.json, ody-color-report-v3.json, ody-roi-report.json.

## Limitations
- **No image-perception** in this model: rendered color/proportions/callout aesthetics cannot be visually certified here; source assignments verified and captures published for human review.
- Headless swiftshader sampling underestimates vivid organ color; treat ROI table as sampling evidence, not ground truth.
