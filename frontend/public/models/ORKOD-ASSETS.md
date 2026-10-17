# Orkod body model — source and licence record

## 1. Body model

| | |
|---|---|
| **Model** | Grab3D "Human Muscles" (écorché) |
| **Source** | https://grab3d.com/models/anatomy/human-muscles/ |
| **File** | `public/models/orkod/orkod-human-body.0db6962c.glb` (content fingerprint) |
| **Licence** | CC0 1.0 — **public domain, no attribution required** (credited anyway) |
| **Purpose** | Orkod medical visualisation shell (external body, adult male) |
| **Geometry** | 323,048 vertices · 601,188 triangles, one merged surface |
| **Encoding** | glTF 2.0 binary with `EXT_meshopt_compression` (geometry only) |
| **File size** | 9,405,612 bytes (approximately 9,185 KB; was 23,683,556 bytes) |
| **Dimensions** | 1.728 m tall, 1.017 m wide (arms held slightly away), 0.291 m deep |
| **Orientation** | +Y up, feet on y = 0, midline on x = 0, facing +Z |
| **SHA-256** | `0DB6962C607C96CBDDFAA90DE957BA826178E0A7D224E8C34CA6B985B68417D4` |

The source is the full-quality static download of a detailed adult **male**
anatomical figure with the skin removed, showing the superficial muscle layer
from head to toe (an écorché study). The figure stands naturally with the arms
hanging slightly away from the body, and it is complete: head, both arms and
hands, both legs and feet. It is a single mesh with a single textured material,
no skeleton, no clothing and no external genital geometry — the model stops at
the muscle layer.

The full 601k-triangle download is kept at full density: **no decimation and no
smoothing** were applied, because the anatomical muscle relief *is* the point of
this shell. What changed is only how the bytes are stored: the vertex and index
buffers are Meshopt-compressed (`EXT_meshopt_compression`, via
`gltf-transform meshopt --level high`), which is lossless for the rendered
result — the triangles, vertices and normals are the same, they are just packed.
Measured before/after by pixel-probing the rendered `/body` canvas: identical
colour, luminance, coverage and bounding box. The three JPEG textures are
unchanged. This takes the file from 22.6 MB to 9.0 MB.

The surface carries explicit vertex **normals**, so the WebGL pipeline shades it
from real normals rather than falling back to derivative flat shading.
`scripts/verify-body-glb.mjs` asserts the smooth-shading fraction, so a faceted
regression can return only by intent (note: that script parses raw glTF accessors
and needs a Meshopt-aware update before it can re-read the compressed bytes).

The mesh is **not watertight** (it has open boundaries at some UV seams and the
cut edges of the écorché), unlike the previous shell. That is expected for a
sculpted surface and does not affect the visualisation: the shell is rendered
front-faces-only and translucent, and organ containment is verified independently
(see below).

Production never fetches anything from the network at runtime: the mesh is a
plain glTF 2.0 binary with no skins and no animations. The only extension is
`EXT_meshopt_compression`, so the component installs **`MeshoptDecoder`** on the
`GLTFLoader` (`loader.setMeshoptDecoder(MeshoptDecoder)`); the decoder ships
inside three's addons with the wasm inlined, so it costs no extra fetch. A
Meshopt-enabled `GLTFLoader` is required — loading this file without the decoder
will fail. It ships three JPEG textures (base colour, normal and
metallic-roughness) which the loader applies; the component overrides the
metallic-roughness response so the shell reads matte rather than metallic.

### Licence (CC0 1.0 — public domain, no attribution required)

The shipped shell is the Grab3D "Human Muscles" model, released by its author
into the **public domain under Creative Commons Zero 1.0** (CC0 1.0,
https://creativecommons.org/publicdomain/zero/1.0/). CC0 permits commercial use,
modification and redistribution with **no attribution requirement**. The credit
is carried anyway on the `/body` stage (the credit link, which resolves to
`models/anatomy/ATTRIBUTION.md`) and recorded here, so the source of the shipped
bytes is never in doubt. The internal organs remain BodyParts3D under CC BY 4.0,
which is unchanged.

### Masculine proportions

The figure is a natural adult **male** body from a detailed sculpt. Measured from
the shipped bytes (`scripts/verify-body-glb.mjs`): the torso core is wider at the
shoulders than at the hips — a clear male V-taper — and the arms hang away from
the body at about **0.57** of the figure's height (a T-pose would put the hand
span close to the full height).

The head has no hair shell and the figure carries no clothing or genital helper
geometry; it is a single, already-merged surface.

### Pose

The figure is a natural standing rest with the arms hanging down and slightly
away from the body (a relaxed A-pose) and complete legs and feet. It is used as
built — no T-pose, no lifting, no runtime joint manipulation (the file has no
skeleton).

### Privacy is a property of the asset

The figure is an écorché (muscles only, no skin) with no external genital
geometry. Nothing is masked, clipped or hidden at runtime, and there is no
privacy geometry of any kind in the application.

The verify script asserts this from the asset itself:

- **No external anatomy geometry.** No node, mesh or material is named for
  anatomy or clothing (`genital`, `penis`, `scrotum`, `vulva`, `breast`,
  `tights`, `skirt`, … are all banned tokens).
- **No skin and no genital band.** The model has no skin layer; the pelvis is a
  plain muscle surface with no sculpted protrusion.
- **A full 360 sweep** (`scripts/preview-body-glb.mjs`) renders the pose from
  0°, 30°, … 360° so the silhouette can be checked from every angle before the
  asset is trusted.

The 3D view remains safe for an audience that includes minors: the figure is a
muscle relief study with no external anatomy, rendered as a translucent shell.

### Fit to the internal organs — measured, not assumed

The anatomy bundle and this shell share one coordinate frame: metres, +Y up,
feet on y = 0, midline on x = 0, facing +Z. The shell was then *fitted to the
organs once*, and that fit is **baked into the shipped file** — nothing is
applied at runtime:

1. The sculpt is centred on x and z, feet brought to y = 0, and scaled by
   **0.96** so the figure stands **1.728 m** tall.
2. That uniform scale plus centring (no z nudge was needed) is written into the
   `POSITION` accessor and the accessor min/max, so the shipped file is already
   in the organ frame.

`scripts/verify-body-glb.mjs` then asserts containment from the shipped bytes with
ray-parity (the body is a single closed manifold, so a +x ray crosses it an odd
number of times exactly when a point is inside), accelerated by a y-z triangle
grid. It self-checks first with three probe points (inside the chest, 0.5 m in
front of it, and above the head):

| Organ | Outside the shell |
|---|---|
| Brain | 2 / 401 (<1%) — the deep surface grazes the cranial vault |
| Lungs · Heart · Liver · Stomach · Kidneys · Intestines | 0 / ~400 each (0%) |

Every organ, including the large stomach and bowel masses, sits fully inside the
shell at the fitted scale; the only contact is the deep brain surface against the
cranial vault.

### Runtime cost

| | |
|---|---|
| Triangles | 601,188 |
| Vertices | 323,048 |
| Materials | 1 |
| Draw calls | 1 primitive |
| Textures | 3 JPEG (base colour, normal, metallic-roughness) |
| Raycast | none — the shell is never raycast |

The component logs the measured split to the console once the organs have
loaded, so the claim is checkable at runtime rather than asserted.

### Rebuilding / re-verifying

```
npx @gltf-transform/cli meshopt in.glb out.glb --level high   # compress (22.6 -> 9.0 MB)
node scripts/verify-body-glb.mjs     # structure, pose, privacy, organ alignment
node scripts/preview-body-glb.mjs   # 0-360 sweep to preview/body/
node scripts/check-framing.mjs      # camera framing at the target viewports
```

The recorded SHA-256 is the check on the shipped file. If the shell is rebuilt,
compute the new fingerprint (first 8 hex of the SHA-256), rename the file to
match, and update `BODY_GLB_URL` in `components/body/HumanBody3D.vue` — the
content-fingerprinted name is what busts the service worker's CacheFirst copy.

## 1b. How the shipped shell was reached

- **MakeHuman CC0 base mesh (superseded).** A plain base mesh, legally clean
  (CC0) but deliberately free of muscle detail, so its surface read as a
  featureless mannequin.
- **Mandrake "Male body base mesh (highpoly)" (superseded).** A detailed CC BY
  4.0 sculpt, decimated and Humphrey-smoothed into a smooth closed shell. It read
  as a person, but the smoothing erased the surface detail and the model was
  obtained through a redistribution mirror whose provenance was hard to pin down.
- **Grab3D "Human Muscles" (shipped).** A genuine anatomical écorché: a real,
  detailed adult-male muscle form under a genuine CC0 public-domain release. The
  full 601k-triangle download is shipped un-decimated so the muscle relief the
  figure exists for is preserved, and it is fitted to the organs by a single
  baked uniform scale.

## 2. Internal organs

Unchanged by this work. See `models/anatomy/ATTRIBUTION.md`.

BodyParts3D, (c) Database Center for Life Science, CC BY 4.0. Bundled as
`organs.bin.gz` plus `anatomy.json` by `scripts/build-anatomy.mjs`. The bundle's
`skin` region is deliberately never built or drawn: the human body GLB is the
only external body surface in the scene.

### Colour corrections applied to the organ data

`src/data/anatomy.ts` is the single source for organ colours, so it is also where
two colours that fought the black/purple/gold stage were corrected:

| Organ | Was | Now | Why |
|---|---|---|---|
| `intestines` | `#86b96b` (grass green) | `#c98d86` (clay rose) | The intestines are the largest organ mass on screen — they fill the whole lower abdomen — so a green bowel turned the stage green. Real bowel is a pinkish-tan tube, so this is also the more anatomically honest colour. |
| `liver` | `#7d3a24` (dark rust / brown) | `#8f2f2f` (deep crimson) | Liver is dark *red*, not brown; this keeps it medically legible without dragging the palette warm. |
| `skeleton` (toggle layer) | `#cfc4a8` (cream bone) | `#d6d0e4` (neutral pearl) | The optional skeleton layer covered the whole figure in cream on a black stage. |

The other five organ colours (brain, lungs, heart, stomach, kidneys) are
unchanged: they were already correct and already legible against the void.

`skin: 0xe9cbb0` is retained as a dead entry only so the manifest's region names
still resolve. That region is filtered out before anything is built or drawn.

## 3. Page palette

`/body` is black + purple + gold, declared as local custom properties on
`.bx-page` in `BodyExplorer3D.vue`:

| Role | Tokens |
|---|---|
| Black | `#020204` void · `#05050A` · `#08060F` |
| Deep purple | `#160B2A` · `#24103F` · `#32135A` |
| Primary purple | `#6D3BE8` · `#7C4DFF` |
| Soft purple | `#A98BFF` · `#C7B8FF` |
| Gold | `#C9A24E` · `#D7B866` · `#E3CA82` |
| Warm gold highlight | `#F0D58A` |

Purple carries the environment and every active state. Gold is rationed to one
filled button, one callout and one selection emphasis. Nothing on the page is
neon.

These are scoped to this page **on purpose**. The global `$color-gold-strong` and
`$color-turquoise` tokens are both the brand bronze `#966B2E`, and Vuetify's
`primary` is the same bronze — on `/body` those produced brown focus rings and
brown buttons. Changing them globally would have recoloured every other route, so
the body page carries its own palette and never reaches for a global token.

The body shell is the écorché's own muscle albedo, multiplied by a neutral pearl
base colour (`#ded9e8`, kept as the fallback for anything without a base colour)
with a low-opacity violet self-illumination; it is never tinted to a saturated
purple, because a saturated body colour stops the silhouette reading as a person.
The atmospheric purple reaches the figure through the lights and the CSS glow
instead.

## 4. What was removed

Earlier iterations of this page used different shells. None of them is in the
runtime any more:

- a procedural mannequin built from capsules and spheres
- the low-poly clothed figure that used to sit here (`orkod-civilian-body.glb`,
  1,189 triangles, ~59 KB, CC0)
- a BodyParts3D `skin` region drawn as a second body surface
- the NASA/ESA Hubble Ultra Deep Field JPEG backdrop
- the genital-filtering and skin-sanitising scripts (unnecessary, since the
  shipped shell contains no external anatomy to filter)

There is exactly one body in the scene: the Grab3D male muscle GLB shell, plus
the internal organs.

### 4a. Landing photography removed

In hard requirement P1/P4, the unverified human photographs and icon PNGs that
used to decorate the landing page were deleted — the landing is now image-free
(gradients, `mdi-*` icons and CSS compositions only). Removed from
`src/assets/images/landing/`:

- `femme_en_meditation.webp` + `.png` — hero photograph (replaced by the CSS
  "healing aura" composition in `HeroSection.vue`)
- `lavender-bg.jpg` — hero backdrop photograph (replaced by layered gradients)
- `femme_qui_regarde_de_la_fenetre.png` — guidance-panel photograph (replaced by
  a gradient icon avatar in `GuidancePanel.vue`)
- `doctor_icon.png`, `feuille_icon.png`, `ai_icon.png`, `guerisseur_icon.png`,
  `academy_icon.png`, `coeur_icon.png` — service-card PNG icons (replaced by
  `mdi-*` icons in `ServiceCategories.vue`)
- dead files never referenced by any component: `couple.png`,
  `couple_et_famille.png`, `plat.png`, `meditation-calm.jpg`, `therapy-couple.jpg`,
  `wellness-lifestyle.jpg`, `wellness-relax.jpg`

The folder is empty and every replacement is pure CSS/iconography, so the public
site carries no unverified photography and there are no orphaned assets.
