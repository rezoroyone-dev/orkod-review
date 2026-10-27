/**
 * Orkod - offline GLB preview renderer.
 *
 * Renders the shipped body GLB from a full orbit to PNG files using a minimal
 * z-buffered software rasteriser (no GPU, no browser, no third-party
 * dependencies). This exists so the asset can be visually inspected - front,
 * rear, both profiles and a full 360 sweep - before it is trusted in the
 * application, in particular to confirm the pose is a natural standing rest
 * with arms down and normal hands, and that nothing external is exposed.
 *
 * PNG is written directly: signature + IHDR + zlib IDAT + IEND, with CRC32.
 *
 * Usage: node scripts/preview-body-glb.mjs [--glb <path>] [--outdir <dir>]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve } from 'node:path';
import { readGlb } from './lib/glb.mjs';

const argv = process.argv.slice(2);
const argOf = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};
const GLB_PATH = resolve(argOf('glb', 'public/models/orkod/orkod-human-body.8521db4e.glb'));
const OUTDIR = resolve(argOf('outdir', 'preview/body'));

/** Front, the two obliques and quarter turns, both profiles, then back home. */
const ANGLES = [0, 30, 45, 60, 90, 135, 180, 225, 270, 315, 360];

// -- minimal PNG writer ----------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
};
function writePNG(path, w, h, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour RGB
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const o = y * (w * 3 + 1);
    raw[o] = 0; // filter: none
    rgb.copy(raw, o + 1, y * w * 3, (y + 1) * w * 3);
  }
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ])
  );
}

const g = await readGlb(GLB_PATH);
const { pos, nrm, idx } = g;
const V = g.weldedVertices;
const T = g.triangleCount;
const [minX, minY, minZ, maxX, maxY, maxZ] = g.bbox;
const height = maxY - minY;
const centreY = (minY + maxY) / 2;
const spread = Math.max(maxX - minX, maxZ - minZ);
console.log(
  `${g.facts.bytes} bytes, ${T} triangles, ${g.weldedVertices} welded vertices`
);
console.log(`height ${height.toFixed(3)} m, width ${(maxX - minX).toFixed(3)} m, depth ${(maxZ - minZ).toFixed(3)} m`);

// -- rasteriser -------------------------------------------------------------
const W = 440, Hpx = 960;
// Frame the real bounding box with a small margin, exactly as the app does.
const MARGIN = 1.14;
const DIST = (Math.max(height, spread) * MARGIN) / (2 * Math.tan((30 * Math.PI) / 360));
const FOV = 30 * (Math.PI / 180);

const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const norm = (p) => {
  const l = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0] / l, p[1] / l, p[2] / l];
};
const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);

const sx = new Float64Array(V), sy = new Float64Array(V), sz = new Float64Array(V);
const vx = new Float64Array(V), vy = new Float64Array(V);

function render(angleDeg, file) {
  const a = (angleDeg * Math.PI) / 180;
  // Camera orbits the body's vertical axis; +Z is the model's front.
  const eye = [Math.sin(a) * DIST, centreY, Math.cos(a) * DIST];
  const target = [0, centreY, 0];
  const fwd = norm(sub(target, eye));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);

  const depth = new Float32Array(W * Hpx).fill(Infinity);
  const col = Buffer.alloc(W * Hpx * 3);
  // Near-black void so the silhouette reads clearly, as on the live page.
  for (let i = 0; i < W * Hpx; i++) {
    col[i * 3] = 3; col[i * 3 + 1] = 3; col[i * 3 + 2] = 9;
  }

  for (let i = 0; i < V; i++) {
    const d = sub([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], eye);
    const vz = dot(d, fwd);
    if (vz <= 0.02) continue;
    vx[i] = dot(d, right); vy[i] = dot(d, up);
    sx[i] = W / 2 + (vx[i] / (vz * Math.tan(FOV / 2))) * (Hpx / 2);
    sy[i] = Hpx / 2 - (vy[i] / (vz * Math.tan(FOV / 2))) * (Hpx / 2);
    sz[i] = vz;
  }

  // Two-light Lambert plus a rim, standing in for the app's cool key/fill.
  const L1 = norm([-0.55, 0.62, 0.56]);
  const L2 = norm([0.62, 0.18, -0.75]);

  for (let t = 0; t < T; t++) {
    const i0 = idx[t * 3], i1 = idx[t * 3 + 1], i2 = idx[t * 3 + 2];
    if (sz[i0] <= 0.02 || sz[i1] <= 0.02 || sz[i2] <= 0.02) continue;
    const x0 = sx[i0], y0 = sy[i0], x1 = sx[i1], y1 = sy[i1], x2 = sx[i2], y2 = sy[i2];
    const a0 = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const a1 = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
    const b0 = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const b1 = Math.min(Hpx - 1, Math.ceil(Math.max(y0, y1, y2)));
    if (a0 > a1 || b0 > b1) continue;
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(area) < 1e-9) continue;
    const inv = 1 / area;

    for (let y = b0; y <= b1; y++) {
      for (let x = a0; x <= a1; x++) {
        const pxc = x + 0.5, pyc = y + 0.5;
        const w0 = ((x1 - pxc) * (y2 - pyc) - (x2 - pxc) * (y1 - pyc)) * inv;
        const w1 = ((x2 - pxc) * (y0 - pyc) - (x0 - pxc) * (y2 - pyc)) * inv;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w2 * sz[i0] + w1 * sz[i1] + w0 * sz[i2];
        const o = y * W + x;
        if (z >= depth[o]) continue;
        depth[o] = z;

        // Interpolated view-space normal.
        const nx = w2 * nrm[i0 * 3] + w1 * nrm[i1 * 3] + w0 * nrm[i2 * 3];
        const ny = w2 * nrm[i0 * 3 + 1] + w1 * nrm[i1 * 3 + 1] + w0 * nrm[i2 * 3 + 1];
        const nz = w2 * nrm[i0 * 3 + 2] + w1 * nrm[i1 * 3 + 2] + w0 * nrm[i2 * 3 + 2];
        // View -> world: rows are right/up/-fwd.
        const wnx = right[0] * nx + up[0] * ny - fwd[0] * nz;
        const wny = right[1] * nx + up[1] * ny - fwd[1] * nz;
        const wnz = right[2] * nx + up[2] * ny - fwd[2] * nz;

        const d1 = Math.max(0, wnx * L1[0] + wny * L1[1] + wnz * L1[2]);
        const d2 = Math.max(0, wnx * L2[0] + wny * L2[1] + wnz * L2[2]);
        const base = [176, 178, 196];
        const rim = Math.pow(1 - Math.min(1, Math.abs(nz)), 3) * 0.5;
        const lit = 0.18 + 0.74 * d1 + 0.28 * d2;
        col[o * 3] = clamp255(base[0] * lit + 110 * rim);
        col[o * 3 + 1] = clamp255(base[1] * lit + 120 * rim);
        col[o * 3 + 2] = clamp255(base[2] * lit + 175 * rim);
      }
    }
  }
  writePNG(file, W, Hpx, col);
  const covered = depth.reduce((n, d) => n + (d < Infinity ? 1 : 0), 0);
  console.log(`  ${file}  (${((covered / (W * Hpx)) * 100).toFixed(1)}% coverage)`);
}

mkdirSync(OUTDIR, { recursive: true });
console.log(`rendering into ${OUTDIR}`);
for (const ang of ANGLES) {
  render(ang, resolve(OUTDIR, `body-${String(ang).padStart(3, '0')}.png`));
}
console.log('done');