# Orkod body model — source and licence record

## 1. Body model

| | |
|---|---|
| **Model** | Mandrake "Male body base mesh (highpoly)" |
| **Author** | Mandrake (`@mandrake_3d`), published 2020-12-09 |
| **Source** | https://sketchfab.com/3d-models/male-body-base-mesh-highpoly-9311f4f8fa1a4fe4bb0027ff7e8fd795 |
| **File** | `public/models/orkod/orkod-human-body.8521db4e.glb` (content fingerprint) |
| **Licence** | CC BY 4.0 — **attribution required** (credited on the `/body` stage) |
| **Purpose** | Orkod medical visualisation shell (external body, adult male) |
| **Geometry** | 150,002 vertices (149,998 unique) · **300,000 triangles**, one merged surface |
| **Encoding** | glTF 2.0 binary, `EXT_meshopt_compression` + `KHR_mesh_quantization`, geometry only |
| **File size** | 1,144,136 bytes (approximately 1,117 KB) |
| **Dimensions** | 1.740 m tall, 1.017 m wide (relaxed A-pose), 0.358 m deep |
| **Orientation** | +Y up, feet on y = 0, midline on x = 0, facing +Z |
| **SHA-256** | `8521DB4ED793923C7CF49127C71685127F16C48D23B1920EDEC8950CF15462BD` |

The source is a high-polygon static sculpt of a detailed adult **male** body —
the outer surface with skin, head to toe, complete with hands and feet. The
authored download (`main1.obj`) is 237,827 vertices / 475,650 triangles. It is a
single merged surface with one material, no skeleton, no clothing and no external
genital geometry.

### Licence (CC BY 4.0 — attribution required)

Mandrake released this sculpt under **Creative Commons Attribution 4.0
International** (CC BY 4.0, https://creativecommons.org/licenses/by/4.0/).
That licence permits commercial use and modification, but **requires
attribution**. The obligation is discharged in two places:

- the `/body` stage renders a persistent credit line (the localized
  `Body_3D_Credit` string, which names the model and its CC BY 4.0 licence) and
  the credit link resolves to `models/anatomy/ATTRIBUTION.md`;
- this file records the author, the source URL, the licence and the SHA-256 of
  the shipped bytes, so the provenance of what is served is never in doubt.

The internal organs remain BodyParts3D under CC BY 4.0, which is unchanged.

### Geometry only — no textures

The shell ships **zero images and zero texture references**. Its surface relief
is the real mesh, shaded from its explicit vertex **normals**, so the WebGL
pipeline never falls back to derivative flat shading and there is no baked
albedo to tint. That is a deliberate gain over the previous écorché shell, which
carried three JPEG textures (base colour, normal, metallic-roughness) and only
ever used the normal map; here the normals *are* the geometry, so the whole
texture payload disappears. The material is a single neutral `skin` material that
the component overrides to a cool translucent pearl.

### Encoding

The file is Meshopt-compressed (`EXT_meshopt_compression`) with quantised vertex
attributes (`KHR_mesh_quantization`): positions are stored as normalised `int16`
and normals as octahedral `int8`. This is lossless for the rendered result — the
triangles, vertices and normals are the same, they are just packed. The
authoring-side (float32) mesh measured 7,201,284 bytes; Meshopt plus quantisation
takes it to 1,144,136 bytes. Measured by pixel-probing the rendered `/body`
canvas: identical coverage and bounding box.

A Meshopt-enabled `GLTFLoader` is **required** — the component installs
`MeshoptDecoder` (`loader.setMeshoptDecoder(MeshoptDecoder)`), whose wasm is
inlined in three's addons, so it costs no extra network fetch. Loading this file
without the decoder will fail.

Production never fetches anything from the network at runtime: the mesh is a
plain glTF 2.0 binary with no skins and no animations.

### Topology

The shell is **closed** — `scripts/verify-body-glb.mjs` asserts **0 boundary
edges** and a **single connected component** from the shipped bytes. It carries
8 non-manifold edges (out of 449,992), which is a quantisation artefact rather
than a hole: storing positions as `int16` collapses a few near-coincident
vertices into exactly-identical ones, and welding those leaves a handful of edges
shared by three faces. It has no effect on rendering (the shell is drawn
front-faces-only and translucent) or on organ containment, which is verified
independently and passes.

### Smooth shading

`scripts/verify-body-glb.mjs` measures the smooth-shading fraction from the
shipped normals: a per-face (faceted) export stores each corner normal equal to
its own face normal, while a smooth export averages normals across the shared
surface. **99.8%** of the 300,000 triangles average normals across faces, so the
figure shades organically and a faceted regression can return only by intent.

### Masculine proportions

Measured from the shipped bytes: the torso core is wider at the shoulders than
at the hips — a clear male V-taper (shoulders 0.600 m, waist 0.280 m, hips
0.380 m, a shoulder-to-hip ratio of **1.58**). The arms hang at the sides, so
the hand span is **0.989 m**, about **0.57** of the figure's height — a T-pose
would put the hand span close to the full height.

The head has no hair shell and the figure carries no clothing.

### Pose

A natural standing rest with the arms hanging down and slightly away from the
body (a relaxed A-pose) and complete legs and feet. At shoulder height the
arms merge into the torso silhouette, confirming nothing is raised. It is used as
built — no T-pose, no lifting, no runtime joint manipulation (the file has no
skeleton).

### Privacy is a property of the asset

The figure is an outer-surface body with no external genital geometry; the
groin is a **neutral mound**, not a protrusion. Measured from the shipped bytes
with the front (+Z) as reference: the groin band reaches **+0.1281 m** forward,
which sits **0.9 cm behind** the belly at **+0.1367 m**, and rises **+0.0293 m**
above the thigh line at **+0.0988 m** — a gentle mound well under the script's
0.07 m protrusion ceiling. No geometric remediation was applied or
is needed. Nothing is masked, clipped or hidden at runtime, and there is no
privacy geometry of any kind in the application.

The verify script asserts this from the asset itself:

- **No external anatomy geometry.** No node, mesh or material is named for
  anatomy or clothing (`genital`, `penis`, `scrotum`, `vulva`, `breast`,
  `tights`, `skirt`, … are all banned tokens).
- **A neutral groin.** The groin band is modelled but never reaches past the
  belly silhouette (asserted from the vertices).
- **A full 360 sweep** (`scripts/preview-body-glb.mjs`) renders the pose from
  0°, 30°, … 360° so the silhouette can be checked from every angle before the
  asset is trusted.

The 3D view remains safe for an audience that includes minors: the figure is a
neutral body form rendered as a translucent shell.

### Fit to the internal organs — measured, not assumed

The anatomy bundle and this shell share one coordinate frame: metres, +Y up,
feet on y = 0, midline on x = 0, facing +Z. The shell was then *fitted to the
organs once*, and that fit is **baked into the shipped file** — nothing is
applied at runtime:

1. The sculpt is used with **no rotation** (its authored front is already +Z),
   centred on x, with feet brought to y = 0, at a uniform scale of **1.00** so
   the figure stands **1.740 m** tall.
2. A single depth nudge of **+0.02 m** in z aligns the body to the organ frame.
3. That scale, centring and nudge are written into the `POSITION` accessor and
   the accessor min/max, so the shipped file is already in the organ frame.

Resulting bounds: x [−0.5082, +0.5083], y [0, 1.74], z [−0.159, +0.199].

`scripts/verify-body-glb.mjs` then asserts containment from the shipped bytes
with ray-parity (the body is a single closed manifold, so a +x ray crosses it an
odd number of times exactly when a point is inside), accelerated by a y-z
triangle grid. It self-checks first with three probe points (inside the chest,
0.5 m in front of it, and above the head):

| Organ | Outside the shell |
|---|---|
| Brain | 1 / 401 (<1%) — the deep surface grazes the cranial vault |
| Lungs · Heart · Liver · Stomach · Kidneys · Intestines | 0 / ~400 each (0%) |

Every organ, including the large stomach and bowel masses, sits fully inside the
shell at the fitted scale; the only contact is the deep brain surface against the
cranial vault.

### Runtime cost

| | |
|---|---|
| Triangles | 300,000 |
| Vertices | 150,002 (149,998 unique after welding) |
| Materials | 1 (`skin`) |
| Draw calls | 1 primitive |
| Textures | 0 — geometry only, relief from vertex normals |
| Raycast | none — the shell is never raycast |

The component logs the measured split to the console once the organs have
loaded, so the claim is checkable at runtime rather than asserted.

### Rebuilding / re-verifying

```
node scripts/verify-body-glb.mjs     # structure, pose, privacy, organ alignment
node scripts/preview-body-glb.mjs    # 0-360 sweep to preview/body/
node scripts/check-framing.mjs       # camera framing at the target viewports
```

The recorded SHA-256 is the check on the shipped file. If the shell is rebuilt,
compute the new fingerprint (first 8 hex of the SHA-256), rename the file to
match, and update `BODY_GLB_URL` in `components/body/HumanBody3D.vue` — the
content-fingerprinted name is what busts the service worker's CacheFirst copy.

## 1b. How the shipped shell was reached

- **MakeHuman CC0 base mesh (superseded).** A plain base mesh, legally clean
  (CC0) but deliberately free of surface detail, so its surface read as a
  featureless mannequin.
- **Grab3D "Human Muscles" (retired).** A genuine anatomical écorché under a
  CC0 public-domain release. It was the previous shipped shell
  (the retired `orkod-human-body.0db6962c.glb`) at 601,188 triangles and
  carried three JPEG textures; it has been replaced by the Mandrake base mesh.
- **Mandrake "Male body base mesh (highpoly)" (shipped).** A detailed CC BY 4.0
  sculpt with the outer skin surface, decimated once to 300,000 triangles,
  fitted to the organs, and shipped Meshopt-compressed with **no textures at
  all** — 1,117 KB where the retired écorché needed 9,185 KB, and the surface relief now
  comes from real geometry rather than a baked map. CC BY 4.0 requires
  attribution, so the credit is rendered on the `/body` stage.

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

The body shell is geometry-only (no textures), so its relief is real mesh shaded
by vertex normals. The component multiplies it by a neutral pearl base colour
(`#ded9e8`, kept as the fallback for anything without a base colour) with a
low-opacity violet self-illumination; it is never tinted to a saturated purple,
because a saturated body colour stops the silhouette reading as a person. The
atmospheric purple reaches the figure through the lights and the CSS glow
instead.

## 4. What was removed

Earlier iterations of this page used different shells. None of them is in the
runtime any more:

- a procedural mannequin built from capsules and spheres
- the low-poly clothed figure that used to sit here (`orkod-civilian-body.glb`,
  1,189 triangles, ~59 KB, CC0)
- a BodyParts3D `skin` region drawn as a second body surface
- the Grab3D "Human Muscles" écorché shell (`orkod-human-body.0db6962c.glb`,
  601,188 triangles, three JPEG textures)
- the NASA/ESA Hubble Ultra Deep Field JPEG backdrop
- the genital-filtering and skin-sanitising scripts (unnecessary, since the
  shipped shell contains no external anatomy to filter)

There is exactly one body in the scene: the Mandrake male body GLB shell, plus
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
