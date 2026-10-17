/**
 * Builds the curated anatomy asset bundle used by the public 3D Body Explorer.
 *
 * Source data: BodyParts3D (male reference anatomy) processed and redistributed
 * by the Human-Atlas viewer (github.com/slorksmo/Human-Atlas), both CC BY 4.0.
 *
 * The original atlas packs 2,234 parts across 15 binary chunks. We extract the
 * subset the app actually renders — the skin shell, the visible organs and the
 * optional skeleton layer — into two lean binary chunks (organs + skin, and
 * skeleton on its own so it can stay lazy-loaded), plus a small manifest with
 * per-part byte offsets and pre-computed body-area anchor points.
 *
 * Usage:
 *   node scripts/build-anatomy.mjs <source-dir> [output-dir]
 */

import { gunzipSync, gzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SOURCE = resolve(process.argv[2] ?? process.cwd());
const OUT = resolve(process.argv[3] ?? join(process.cwd(), 'public', 'models', 'anatomy'));

const ATLAS = join(SOURCE, 'atlas.json');
if (!existsSync(ATLAS)) {
  console.error(`Missing source atlas: ${ATLAS}`);
  process.exit(1);
}

const atlas = JSON.parse(readFileSync(ATLAS, 'utf8'));
const map = new Map(atlas.parts.map((p) => [p.id, p]));
const byConcept = new Map();
for (const c of atlas.concepts) byConcept.set(c.name, c.elements);

const bytesOf = (p) => p.vertexCount * 3 * 4 + p.vertexCount * 3 * 2 + p.indexCount * 4;

// Which parts to keep, grouped by the region id used across the app.
// Organs follow the labelled FMA concepts; lungs are the tracheobronchial tree
// (BodyParts3D models the lung as its conducting airways). Skeleton gets its
// own layer so it can load on demand.
const ORGAN_CONCEPTS = {
  heart: ['heart'],
  lungs: ['right lung', 'left lung', 'trachea', 'main bronchus'],
  liver: ['liver'],
  stomach: ['stomach'],
  kidneys: ['kidney'],
  brain: ['brain'],
  intestines: ['small intestine', 'large intestine'],
};

const skinIds = new Set(byConcept.get('skin') ?? []);

const organIds = new Map();
for (const [region, concepts] of Object.entries(ORGAN_CONCEPTS)) {
  const ids = new Set();
  for (const c of concepts) for (const id of byConcept.get(c) ?? []) if (map.has(id)) ids.add(id);
  organIds.set(region, ids);
}

const skeletonIds = new Set(atlas.parts.filter((p) => p.system === 'skeletal').map((p) => p.id));

const allIds = new Set([...skinIds, ...skeletonIds]);
for (const ids of organIds.values()) for (const id of ids) allIds.add(id);

// Map source chunk index -> raw (decompressed) buffer.
const chunks = new Map();
for (const p of atlas.parts) {
  if (!allIds.has(p.id) || chunks.has(p.chunk)) continue;
  const gz = join(SOURCE, `body-${p.chunk}.bin.gz`);
  chunks.set(p.chunk, gunzipSync(readFileSync(gz)));
}

/** Copy a part's bytes into a packed binary, aligning every section to 4. */
function pack(parts, dest) {
  let offset = 0;
  const manifest = [];
  for (const p of parts) {
    const buf = chunks.get(p.chunk);
    const posOff = p.positions;
    const nrmOff = p.normals;
    const idxOff = p.indices;
    const posBytes = p.vertexCount * 3 * 4;
    const nrmBytes = p.vertexCount * 3 * 2;
    const idxBytes = p.indexCount * 4;

    if (offset % 4 !== 0) {
      const pad = 4 - (offset % 4);
      dest.fill(0, offset, offset + pad);
      offset += pad;
    }
    const outPos = offset;
    dest.set(buf.subarray(posOff, posOff + posBytes), offset);
    offset += posBytes;

    if (offset % 4 !== 0) {
      const pad = 4 - (offset % 4);
      dest.fill(0, offset, offset + pad);
      offset += pad;
    }
    const outNrm = offset;
    dest.set(buf.subarray(nrmOff, nrmOff + nrmBytes), offset);
    offset += nrmBytes;

    if (offset % 4 !== 0) {
      const pad = 4 - (offset % 4);
      dest.fill(0, offset, offset + pad);
      offset += pad;
    }
    const outIdx = offset;
    dest.set(buf.subarray(idxOff, idxOff + idxBytes), offset);
    offset += idxBytes;

    manifest.push({ id: p.id, name: p.name, region: p.region, chunk: p.chunk, positions: outPos, normals: outNrm, indices: outIdx, vertexCount: p.vertexCount, indexCount: p.indexCount, bounds: p.bounds });
  }
  return { manifest, size: offset };
}

// Build the packed buffers.
const organParts = [];
for (const [region, ids] of organIds) {
  for (const id of ids) {
    const p = { ...map.get(id), region };
    organParts.push(p);
  }
}
for (const id of skinIds) organParts.push({ ...map.get(id), region: 'skin' });

const skeletonParts = [];
for (const id of skeletonIds) skeletonParts.push({ ...map.get(id), region: 'skeleton' });

const organBuf = new Uint8Array(organParts.reduce((s, p) => s + bytesOf(p) + 8, 0));
const skeletonBuf = new Uint8Array(skeletonParts.reduce((s, p) => s + bytesOf(p) + 8, 0));
const organ = pack(organParts, organBuf);
const skeleton = pack(skeletonParts, skeletonBuf);

// --- Body-area anchor points (computed from the real anatomy) ---
const center = (p) => {
  const [lo, hi] = p.bounds;
  return [((lo[0] + hi[0]) / 2), ((lo[1] + hi[1]) / 2), ((lo[2] + hi[2]) / 2)];
};
const pickParts = (re, system = 'skeletal') => atlas.parts.filter((p) => p.system === system && re.test(p.name));
const avg = (pts) => {
  const n = Math.max(1, pts.length);
  return pts.reduce((acc, [x, y, z]) => [acc[0] + x / n, acc[1] + y / n, acc[2] + z / n], [0, 0, 0]);
};
const sides = (parts) => {
  const left = [], right = [];
  for (const p of parts) {
    if (/(^|\s)(left|sinister)/i.test(p.name)) left.push(p);
    else if (/(^|\s)(right|dexter)/i.test(p.name)) right.push(p);
  }
  return [left, right].map((grp) => (grp.length ? avg(grp.map(center)) : null));
};

const anchors = {
  head: [avg(pickParts(/(occipital|frontal|parietal|temporal|sphenoid|vomer|ethmoid|zygomatic|mandible|maxilla|nasal bone|lacrimal|palatine|hyoid|foramen)/).map(center))],
  eyes: sides(pickParts(/anterior chamber|cornea|iris|sclera|lens of eye/, 'sensory')),
  neck: [avg(pickParts(/cervical vertebra/i).map(center))],
  shoulders: [avg([...pickParts(/clavicle/i), ...pickParts(/humerus/i)].map(center))],
  chest: [center(pickParts(/body of sternum/i)[0] ?? pickParts(/sternum/i)[0])],
  abdomen: [avg([...pickParts(/lumbar vertebra/i), ...organIds.get('stomach')].map((p) => (typeof p === 'string' ? center(map.get(p)) : center(p))))],
  pelvis: [avg(pickParts(/hip bone/i).map(center))],
  arms: sides(pickParts(/humerus/i).concat(pickParts(/radius/i), pickParts(/ulna/i))),
  back: [avg(pickParts(/thoracic vertebra/i).map(center)).map((v, i) => (i === 2 ? v - 0.04 : v))],
  lowerback: [avg(pickParts(/lumbar vertebra/i).map(center)).map((v, i) => (i === 2 ? v - 0.03 : v))],
  thigh: sides(pickParts(/femur/i)),
  knees: sides(pickParts(/patella/i)),
  legs: sides(pickParts(/tibia/i).concat(pickParts(/fibula/i))),
  ankle: sides(pickParts(/talus/i)),
  feet: sides(pickParts(/metatarsal/i)),
};

// Organs anchor from their own geometry so the callout always lands on the organ.
for (const [region, ids] of organIds) {
  const c = avg([...ids].map((id) => center(map.get(id))));
  anchors[region] = [c];
}

// --- Write outputs ---
mkdirSync(OUT, { recursive: true });

const manifest = {
  version: 1,
  sex: atlas.sex,
  source: atlas.source,
  body: {
    chunks: [{ url: '/models/anatomy/organs.bin.gz', bytes: organ.size }],
    parts: organ.manifest,
  },
  skeleton: {
    chunks: [{ url: '/models/anatomy/skeleton.bin.gz', bytes: skeleton.size }],
    parts: skeleton.manifest,
  },
  anchors,
  attribution: {
    title: 'BodyParts3D',
    license: 'CC BY 4.0 International',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
    sourceProject: 'https://github.com/slorksmo/Human-Atlas',
  },
};

writeFileSync(join(OUT, 'organs.bin.gz'), gzipSync(Buffer.from(organBuf.subarray(0, organ.size))));
writeFileSync(join(OUT, 'skeleton.bin.gz'), gzipSync(Buffer.from(skeletonBuf.subarray(0, skeleton.size))));
writeFileSync(join(OUT, 'anatomy.json'), JSON.stringify(manifest));

const attrib = `# Anatomy data attribution

The anatomical data in this directory is derived from **BodyParts3D**, (c) The
Database Center for Life Science.

- License: **CC Attribution 4.0 International** — https://creativecommons.org/licenses/by/4.0/
- BodyParts3D license page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Source geometry: \`isa_BP3D_4.0_obj_99.zip\` (BodyParts3D 4.0, adult male reference anatomy
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
`;
writeFileSync(join(OUT, 'ATTRIBUTION.md'), attrib);

console.log(`organs  : ${organ.partsCount ?? organ.manifest.length} parts, ${(organ.size / 1048576).toFixed(2)} MB raw -> ${(gzipSync(Buffer.from(organBuf.subarray(0, organ.size))).length / 1048576).toFixed(2)} MB gz`);
console.log(`skeleton: ${skeleton.manifest.length} parts, ${(skeleton.size / 1048576).toFixed(2)} MB raw -> ${(gzipSync(Buffer.from(skeletonBuf.subarray(0, skeleton.size))).length / 1048576).toFixed(2)} MB gz`);
console.log(`written to ${OUT}`);