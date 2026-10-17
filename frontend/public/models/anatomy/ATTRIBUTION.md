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

- Model: **Grab3D "Human Muscles"** (écorché) — https://grab3d.com/models/anatomy/human-muscles/
- License: **CC0 1.0 Universal (public domain)** — https://creativecommons.org/publicdomain/zero/1.0/
- CC0 imposes no attribution requirement; the credit is given for provenance.
- File: `public/models/orkod/orkod-human-body.ed4a8915.glb`. See
  `public/models/ORKOD-ASSETS.md` for the full record.

The BodyParts3D `skin` region is present in the data bundle but is never built
or drawn; the Grab3D shell is the only external body surface in the scene.
