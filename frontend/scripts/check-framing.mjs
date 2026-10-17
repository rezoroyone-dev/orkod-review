/**
 * Orkod - camera framing check for the shipped human body GLB.
 *
 * Runs the same fitting maths the component uses (frameCamera in
 * HumanBody3D.vue) against the GLB's real bounding box at the target
 * viewports, and reports whether head, hands and feet all stay inside the frame
 * and how much of the viewport height the figure occupies.
 *
 * This is arithmetic over real asset bounds, not a rendering check.
 *
 * Usage: node scripts/check-framing.mjs [--glb <path>]
 */
import { resolve } from 'node:path';
import { readGlb } from './lib/glb.mjs';

const argv = process.argv.slice(2);
const argOf = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : d;
};
const GLB = resolve(argOf('glb', 'public/models/orkod/orkod-human-body.0db6962c.glb'));

const g = readGlb(GLB);
const [minX, minY, minZ, maxX, maxY, maxZ] = g.bbox;
const size = [maxX - minX, maxY - minY, maxZ - minZ];
const centre = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];

console.log('body bounds (m):');
console.log(`  size   x=${size[0].toFixed(4)} y=${size[1].toFixed(4)} z=${size[2].toFixed(4)}`);
console.log(`  centre x=${centre[0].toFixed(4)} y=${centre[1].toFixed(4)} z=${centre[2].toFixed(4)}`);
console.log('');

// Must mirror frameCamera() and the camera constructor in HumanBody3D.vue.
const FOV = 40;
const MARGIN = 1.34;

function frame(vw, vh, bottomInset = 0, topInset = 0) {
  const aspect = vw / vh;
  const vFov = (FOV * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(0.1, aspect));
  // frameCamera() caps each host inset at a third of the stage.
  const bInset = Math.max(0, Math.min(bottomInset, vh * 0.34));
  const tInset = Math.max(0, Math.min(topInset, vh * 0.34));
  const usable = Math.max(0.35, (vh - bInset - tInset) / vh);
  const distV = (size[1] * MARGIN) / (2 * Math.tan(vFov / 2) * usable);
  const distH = (Math.max(size[0], size[2]) * MARGIN) / (2 * Math.tan(hFov / 2) * usable);
  const dist = Math.max(distV, distH, 0.6);
  // dir = (0, 0.1, 1) normalised, camera = target + dir * dist. The target drops
  // by half the reserved bottom strip so the figure rises into the band the host
  // leaves visible, and rises by half the top strip so the head clears the heading.
  const d = [0, 0.1, 1];
  const dl = Math.hypot(...d);
  const dir = d.map((v) => v / dl);
  const drop = (bInset / 2 / vh) * 2 * dist * Math.tan(vFov / 2);
  const rise = (tInset / 2 / vh) * 2 * dist * Math.tan(vFov / 2);
  const target = [centre[0], centre[1] - drop + rise, centre[2]];
  const eye = [
    target[0] + dir[0] * dist,
    target[1] + dir[1] * dist,
    target[2] + dir[2] * dist,
  ];
  const fwd = [target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]];
  const fl = Math.hypot(...fwd);
  const f = fwd.map((v) => v / fl);
  const right = norm(cross(f, [0, 1, 0]));
  const up = cross(right, f);
  const project = (p) => {
    const v = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
    const vz = dot(v, f);
    return [
      dot(v, right) / (vz * Math.tan(hFov / 2)),
      dot(v, up) / (vz * Math.tan(vFov / 2)),
    ];
  };

  // The eight corners of the real bounding box: the true silhouette extremes.
  let top = -Infinity, bottom = Infinity, left = Infinity, rightN = -Infinity;
  for (const x of [minX, maxX]) {
    for (const y of [minY, maxY]) {
      for (const z of [minZ, maxZ]) {
        const [nx, ny] = project([x, y, z]);
        if (ny > top) top = ny;
        if (ny < bottom) bottom = ny;
        if (nx < left) left = nx;
        if (nx > rightN) rightN = nx;
      }
    }
  }
  // The hands are the widest part, so report them separately from the corners.
  // Grab3D A-pose: the fingers hang a little out from the thighs, ~0.47 m
  // outboard at hand height (see ORKOD-ASSETS.md).
  const handNdc = project([0.47, 1.05, 0.02]);

  // Where the lowest point of the figure lands, in pixels from the stage bottom.
  const feetPx = ((bottom + 1) / 2) * vh;

  return {
    aspect: aspect.toFixed(2),
    dist: dist.toFixed(3),
    headNdcY: top.toFixed(3),
    feetNdcY: bottom.toFixed(3),
    handNdcX: handNdc[0].toFixed(3),
    halfWidthNdcX: Math.max(Math.abs(left), Math.abs(rightN)).toFixed(3),
    verticalFillPct: (((top - bottom) / 2) * 100).toFixed(1),
    bandFillPct: ((((top - bottom) / 2) * vh) / (vh - bInset - tInset) * 100).toFixed(1),
    feetPx: feetPx.toFixed(0),
    insets: `${bInset}/${tInset}`,
    fitsV: top <= 1 && bottom >= -1,
    fitsH: Math.max(Math.abs(left), Math.abs(rightN)) <= 1,
    clearsBottom: feetPx >= bInset,
  };
}

const norm = (p) => {
  const l = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0] / l, p[1] / l, p[2] / l];
};
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];

const viewports = [
  // [label, width, height, host bottom inset px, host top inset px]
  // Bottom insets are real measured organ-bar heights + 14px gap.
  // Top insets are applied only on narrow viewports where the heading reaches the
  // centred figure (mirrors the component's stageW < 720 rule).
  ['390x844  mobile',   390, 844, 96, 100],
  ['834x1112 tablet',    834, 1112, 76, 0],
  ['1280x800 desktop',  1280, 800, 76, 0],
  ['1440x900 wide',     1440, 900, 76, 0],
  ['390x700 mobile short', 390, 700, 96, 100],
  ['1280x600 desktop short', 1280, 600, 76, 0],
];

let bad = 0;
console.log(`margin ${MARGIN}, vertical fov ${FOV} deg`);
console.log('viewport                 insets  aspect  dist   headY   feetY   halfX  handX   fill%  band%  feetPx  fits');
console.log('---------------------------------------------------------------------------------------------------------');
for (const [label, w, h, bottom, top] of viewports) {
  const r = frame(w, h, bottom, top);
  const ok = r.fitsV && r.fitsH && r.clearsBottom;
  if (!ok) bad++;
  console.log(
    `${label.padEnd(24)} ${r.insets.padStart(7)} ${r.aspect.padStart(6)} ${r.dist.padStart(6)} ` +
      `${r.headNdcY.padStart(7)} ${r.feetNdcY.padStart(7)} ${r.halfWidthNdcX.padStart(7)} ` +
      `${r.handNdcX.padStart(6)} ${r.verticalFillPct.padStart(7)} ${r.bandFillPct.padStart(6)} ` +
      `${r.feetPx.padStart(7)}   ${ok ? 'OK' : 'CLIPPED'}`
  );
}
console.log('');
console.log('headY <= 1 and feetY >= -1 means the whole figure is inside the frame.');
console.log('halfX <= 1 means the arms and hands are inside the frame.');
console.log('feetPx is how far above the stage bottom the soles land, and must clear the bottom inset.');
console.log('band% is the share of the visible band the figure fills; the target is 65-80%.');
if (bad === 0) console.log('All viewports frame the full body.');
else console.log(`${bad} viewport(s) clip the body.`);
process.exit(bad === 0 ? 0 : 1);