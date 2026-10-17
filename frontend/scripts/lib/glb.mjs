/**
 * Orkod - minimal GLB reader shared by the body-asset scripts.
 *
 * Deliberately dependency-free and deliberately general: real assets ship with
 * several meshes and primitives, `KHR_mesh_quantization` (normalised int16
 * positions), non-indexed triangles and per-node TRS transforms, so anything
 * that assumes "one mesh, one float32 POSITION accessor" reads the wrong
 * numbers.
 *
 * Used by verify-body-glb.mjs, preview-body-glb.mjs and check-framing.mjs.
 */
import { readFileSync } from 'node:fs';

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

/** Reads the exact bytes of one bufferView. */
function view(bin, json, i) {
  const bv = json.bufferViews[i];
  return bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
}

/** Reads a POSITION/NORMAL-style accessor as Float32 xyz triples. */
function readVec3(json, bin, accIndex) {
  const acc = json.accessors[accIndex];
  const bv = json.bufferViews[acc.bufferView];
  const data = view(bin, json, acc.bufferView);
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const base = acc.byteOffset || 0;
  const width = acc.componentType === 5126 ? 4 : acc.componentType === 5122 ? 2 : 1;
  const components = acc.type === 'VEC3' ? 3 : acc.type === 'VEC2' ? 2 : 1;
  const stride = bv.byteStride ?? width * components;
  const out = new Float64Array(acc.count * 3);
  for (let i = 0; i < acc.count; i++) {
    for (let c = 0; c < 3; c++) {
      const o = base + i * stride + c * width;
      let v;
      if (width === 4) v = dv.getFloat32(o, true);
      else if (width === 2) v = acc.normalized ? dv.getInt16(o, true) / 32767 : dv.getUint16(o, true);
      else v = acc.normalized ? dv.getUint8(o) / 255 : dv.getUint8(o);
      out[i * 3 + c] = v;
    }
  }
  return out;
}

/** Reads an index accessor as Uint32. */
function readIndices(json, bin, accIndex) {
  const acc = json.accessors[accIndex];
  const data = view(bin, json, acc.bufferView);
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const base = acc.byteOffset || 0;
  const width = acc.componentType === 5125 ? 4 : acc.componentType === 5123 ? 2 : 1;
  const out = new Uint32Array(acc.count);
  for (let i = 0; i < acc.count; i++) {
    const o = base + i * width;
    out[i] = width === 4 ? dv.getUint32(o, true) : width === 2 ? dv.getUint16(o, true) : dv.getUint8(o);
  }
  return out;
}

/** Column-major TRS matrix for a node, matching glTF and three.js. */
export function nodeMatrix(node) {
  const t = node.translation || [0, 0, 0];
  const s = node.scale || [1, 1, 1];
  return [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, t[0], t[1], t[2], 1];
}

export function xformPoint(m, x, y, z) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

/**
 * Parses a GLB into world-space geometry.
 *
 * Returns the container facts, plus one `parts` entry per primitive with its
 * positions/normals already in world space, and a welded, deduplicated
 * triangle list over every primitive (welded by exact authored vertex position,
 * which is what makes a closed-manifold check possible on non-indexed meshes).
 */
export function readGlb(path) {
  const buf = readFileSync(path);
  const facts = {
    bytes: buf.length,
    magicOk: buf.readUInt32LE(0) === GLB_MAGIC,
    version: buf.readUInt32LE(4),
    declaredLength: buf.readUInt32LE(8),
    lengthMatches: buf.readUInt32LE(8) === buf.length,
    jsonChunkOk: buf.readUInt32LE(16) === CHUNK_JSON,
    binChunkOk: false,
    extensionsUsed: [],
    extensionsRequired: [],
    materials: [],
  };
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binOff = 20 + jsonLen;
  facts.binChunkOk = buf.readUInt32LE(binOff + 4) === CHUNK_BIN;
  const bin = buf.subarray(binOff + 8);

  facts.asset = json.asset || {};
  facts.extensionsUsed = json.extensionsUsed || [];
  facts.extensionsRequired = json.extensionsRequired || [];
  facts.materials = (json.materials || []).map((m) => m.name || '(unnamed)');

  const parts = [];
  const weldedIndex = new Map();
  const worldPos = [];
  const worldNrm = [];
  const triangles = [];
  /** Material -> welded vertex ids, used for per-material topology checks. */
  const groupVerts = new Map();

  for (const node of json.nodes || []) {
    if (node.mesh === undefined) continue;
    const mesh = json.meshes[node.mesh];
    const m = nodeMatrix(node);
    for (const prim of mesh.primitives) {
      const P = readVec3(json, bin, prim.attributes.POSITION);
      const N = prim.attributes.NORMAL !== undefined ? readVec3(json, bin, prim.attributes.NORMAL) : null;
      const I = prim.indices !== undefined ? readIndices(json, bin, prim.indices) : null;
      const verts = P.length / 3;
      const tris = I ? I.length / 3 : verts / 3;
      const material = json.materials?.[prim.material]?.name ?? '(unnamed)';

      const start = worldPos.length / 3;
      const local = new Array(verts);
      for (let i = 0; i < verts; i++) {
        const p = xformPoint(m, P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
        // Weld on the exact authored (pre-transform) position: the four
        // primitives of a character share one authoring space.
        const key = `${P[i * 3]},${P[i * 3 + 1]},${P[i * 3 + 2]}`;
        let id = weldedIndex.get(key);
        if (id === undefined) {
          id = worldPos.length / 3;
          weldedIndex.set(key, id);
          worldPos.push(p[0], p[1], p[2]);
          worldNrm.push(N ? m[0] * N[i * 3] : 0, N ? m[1] * N[i * 3 + 1] : 0, N ? m[2] * N[i * 3 + 2] : 0);
        }
        local[i] = id;
      }

      const group = groupVerts.get(material) || new Set();
      for (let t = 0; t < tris; t++) {
        const a = I ? local[I[t * 3]] : local[t * 3];
        const b = I ? local[I[t * 3 + 1]] : local[t * 3 + 1];
        const c = I ? local[I[t * 3 + 2]] : local[t * 3 + 2];
        triangles.push(a, b, c);
        group.add(a); group.add(b); group.add(c);
      }
      groupVerts.set(material, group);

      parts.push({
        node: node.name,
        material,
        triangles: tris,
        vertices: verts,
        indexed: I !== null,
        firstWelded: start,
      });
    }
  }

  const pos = new Float64Array(worldPos);
  const nrm = new Float64Array(worldNrm);
  const idx = new Uint32Array(triangles);
  const triCount = idx.length / 3;

  const bbox = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      if (pos[i + c] < bbox[c]) bbox[c] = pos[i + c];
      if (pos[i + c] > bbox[3 + c]) bbox[3 + c] = pos[i + c];
    }
  }

  return {
    facts,
    json,
    parts,
    groupVerts,
    pos,
    nrm,
    idx,
    weldedVertices: pos.length / 3,
    vertexCount: parts.reduce((n, p) => n + p.vertices, 0),
    triangleCount: triCount,
    bbox,
  };
}

/** Boundary / non-manifold edge census over a triangle list. */
export function edgeCensus(idx) {
  const edges = new Map();
  for (let t = 0; t < idx.length / 3; t++) {
    for (let e = 0; e < 3; e++) {
      const a = idx[t * 3 + e];
      const b = idx[t * 3 + ((e + 1) % 3)];
      const k = a < b ? `${a}_${b}` : `${b}_${a}`;
      edges.set(k, (edges.get(k) || 0) + 1);
    }
  }
  let boundary = 0;
  let nonManifold = 0;
  for (const c of edges.values()) {
    if (c === 1) boundary++;
    else if (c > 2) nonManifold++;
  }
  return { edges: edges.size, boundary, nonManifold };
}

/** Connected components over welded vertices, for per-part isolation checks. */
export function components(idx, vertexCount) {
  const adj = Array.from({ length: vertexCount }, () => []);
  for (let t = 0; t < idx.length / 3; t++) {
    const [a, b, c] = [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]];
    adj[a].push(b, c); adj[b].push(a, c); adj[c].push(a, b);
  }
  const seen = new Array(vertexCount).fill(false);
  const out = [];
  for (let i = 0; i < vertexCount; i++) {
    if (seen[i]) continue;
    const stack = [i];
    seen[i] = true;
    const verts = [];
    while (stack.length) {
      const v = stack.pop();
      verts.push(v);
      for (const w of adj[v]) if (!seen[w]) { seen[w] = true; stack.push(w); }
    }
    out.push(verts);
  }
  return out;
}