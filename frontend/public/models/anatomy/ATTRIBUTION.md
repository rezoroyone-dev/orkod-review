# Anatomy data attribution

The anatomical data in this directory is derived from **BodyParts3D**, (c) The
Database Center for Life Science.

- License: **CC Attribution 4.0 International** — https://creativecommons.org/licenses/by/4.0/
- BodyParts3D license page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Source geometry: `isa_BP3D_4.0_obj_99.zip` (BodyParts3D 4.0, adult male reference anatomy
  based on the TARO MRI, 2,234 OBJ meshes)

The data was further processed by the **Human-Atlas** viewer
(https://github.com/slorksmo/Human-Atlas, MIT-licensed app code): axes/units converted to
metres/Y-up, geometry simplified with meshoptimizer, normals quantized to signed 16-bit,
and geometry packed into binary chunks. The curated bundle in this directory selects the
skin shell, the labelled organ concepts (heart, lungs, liver, stomach, kidneys, brain,
small/large intestine) and the full axial skeleton into a smaller, app-specific layout.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical
illustration refinements. It is not a complete model of every possible human anatomical
structure or variation. This interface is educational and is not a clinical tool.

## Body shell

The external body shell shown on `/body` is a separate asset, not part of the
BodyParts3D bundle:

- Model: **Mandrake "Male body base mesh (highpoly)"** — https://sketchfab.com/3d-models/male-body-base-mesh-highpoly-9311f4f8fa1a4fe4bb0027ff7e8fd795
- Author: Mandrake (`@mandrake_3d`), published 2020-12-09
- License: **CC Attribution 4.0 International** — https://creativecommons.org/licenses/by/4.0/
- **CC BY 4.0 requires attribution.** The credit is rendered on the `/body`
  stage (the localized `Body_3D_Credit` string, which names the model and its
  licence), and the full record — author, source URL, licence and the SHA-256 of
  the shipped bytes — is kept in `public/models/ORKOD-ASSETS.md`.
- File: `public/models/orkod/orkod-human-body.8521db4e.glb`.

The BodyParts3D `skin` region is present in the data bundle but is never built
or drawn; the Mandrake shell is the only external body surface in the scene.
