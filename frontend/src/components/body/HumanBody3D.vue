<template>
  <div
    ref="rootEl"
    class="human3d"
    :class="{
      'human3d--ready': state === 'ready',
      'human3d--error': state === 'error',
    }"
    role="application"
    :aria-label="roleLabel"
  >
    <div ref="stageEl" class="human3d-stage"></div>

    <div
      v-if="state === 'ready'"
      class="human3d-toolbar"
      :class="{ 'human3d-toolbar--rail': toolbarPosition === 'left-rail' }"
    >
      <button
        type="button"
        class="human3d-tool human3d-tool--icon"
        :aria-label="resetLabel"
        :title="resetLabel"
        @click="resetView"
      >
        <v-icon size="16">mdi-rotate-3d-variant</v-icon>
      </button>
      <span class="human3d-tool-sep" aria-hidden="true"></span>
      <button
        type="button"
        class="human3d-tool human3d-tool--toggle"
        :class="{ active: layers.body }"
        :aria-pressed="layers.body"
        @click="toggleLayer('body')"
      >
        <v-icon v-if="toolbarPosition === 'left-rail'" size="18">mdi-account-outline</v-icon>
        <span>{{ bodyLabel }}</span>
      </button>
      <button
        type="button"
        class="human3d-tool human3d-tool--toggle"
        :class="{ active: layers.organs }"
        :aria-pressed="layers.organs"
        @click="toggleLayer('organs')"
      >
        <v-icon v-if="toolbarPosition === 'left-rail'" size="18">mdi-heart-pulse</v-icon>
        <span>{{ organsLabel }}</span>
      </button>
    </div>

    <a
      v-if="state === 'ready'"
      class="human3d-credit pressable"
      href="/models/anatomy/ATTRIBUTION.md"
      target="_blank"
      rel="noopener"
    >
      {{ creditLabel }}
    </a>

    <p v-if="state === 'ready' && showHint" class="human3d-hint">{{ hintLabel }}</p>

    <div v-if="state === 'loading'" class="human3d-status">
      <span class="human3d-spinner" aria-hidden="true"></span>
      <span>{{ loadingLabel }}</span>
    </div>

    <div v-else-if="state === 'error'" class="human3d-status human3d-status--error">
      <v-icon size="34" color="#F1D27A">mdi-alert-circle-outline</v-icon>
      <span>{{ errorLabel }}</span>
      <button type="button" class="human3d-retry" @click="retry">
        {{ retryLabel }}
      </button>
    </div>

    <p v-if="state === 'ready' && organCount === 0" class="human3d-preparing">
      {{ preparingLabel }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, computed, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { REGION_COLORS, isOrgan } from '@/data/anatomy';

/**
 * Anatomical 3D body viewer.
 *
 * Renders three independent layers:
 *   BODY     the human body GLB — the one and only external shell, loaded
 *            from /models/orkod/orkod-human-body.<hash>.glb
 *   ORGANS   one mesh per labelled organ, each with its own colour, loaded
 *            progressively from the anatomy bundle after the body is usable
 *   SKELETON an optional, off-by-default layer that lazy-loads on first use
 *
 * The anatomy bundle's `skin` region is intentionally never built or drawn:
 * loading it alongside the body shell would put a second external body surface
 * in the scene. Only the internal organ regions are read from the bundle.
 *
 * The body shell is the first thing rendered. `state` only becomes 'ready'
 * after `renderer.render()` has actually produced a frame, and organs load
 * afterwards without gating readiness.
 *
 * The skeleton is deliberately NOT the default view. The default view is a
 * translucent body with the organs showing through it.
 *
 * Data: internal organs are BodyParts3D (c) Database Center for Life Science,
 * CC BY 4.0, curated by scripts/build-anatomy.mjs; see
 * /models/anatomy/ATTRIBUTION.md. The body shell is the Mandrake "Male body
 * base mesh (highpoly)" adult male body, CC BY 4.0 (attribution required) - see
 * /models/ORKOD-ASSETS.md.
 */

const props = withDefaults(
  defineProps<{
    activeId?: string | null;
    /**
     * Whether to draw the drag/zoom hint along the bottom edge. Hosts that place
     * their own controls along the bottom (the full-screen /body page) turn this
     * off and carry the hint in their own chrome instead.
     */
    showHint?: boolean;
    /**
     * Height in CSS pixels of whatever the host overlays along the bottom of the
     * stage (an organ bar, a legend). The camera frames the figure inside what
     * is left, so the feet never end up behind the host's controls.
     */
    bottomInset?: number;
    /**
     * Height in CSS pixels of whatever the host overlays along the top of the
     * stage (a heading). Same purpose as `bottomInset`, for the other edge: on a
     * narrow viewport a top-left heading reaches the centre, where the head is.
     */
    topInset?: number;
    /**
     * Where the layer toolbar sits. 'top-right' (the default) keeps the compact
     * pill used by the home hero; 'left-rail' turns it into the vertical layer
     * rail used by the full-screen /body page.
     */
    toolbarPosition?: 'top-right' | 'left-rail';
    labels?: {
      front?: string;
      back?: string;
      hint?: string;
      loading?: string;
      error?: string;
      retry?: string;
      preparing?: string;
      reset?: string;
      body?: string;
      organs?: string;
      skeleton?: string;
      credit?: string;
    };
  }>(),
  {
    activeId: null,
    showHint: true,
    bottomInset: 0,
    topInset: 0,
    toolbarPosition: 'top-right' as const,
    labels: () => ({}),
  }
);

const emit = defineEmits<{
  (e: 'select', id: string | null): void;
  (e: 'anchor', payload: { id: string; x: number; y: number } | null): void;
}>();

const rootEl = ref<HTMLElement | null>(null);
const stageEl = ref<HTMLElement | null>(null);

const state = ref<'loading' | 'ready' | 'error'>('loading');

const frontLabel = computed(() => props.labels?.front || 'Front');
const backLabel = computed(() => props.labels?.back || 'Back');
const hintLabel = computed(
  () => props.labels?.hint || 'Drag to rotate · scroll to zoom · select an organ to learn more'
);
const loadingLabel = computed(() => props.labels?.loading || 'Preparing the 3D body…');
const errorLabel = computed(() => props.labels?.error || 'Could not render the 3D body.');
const retryLabel = computed(() => props.labels?.retry || 'Retry');
const preparingLabel = computed(
  () => props.labels?.preparing || 'Preparing organs…'
);
const resetLabel = computed(() => props.labels?.reset || 'Reset view');
const bodyLabel = computed(() => props.labels?.body || 'Body');
const organsLabel = computed(() => props.labels?.organs || 'Organs');
const creditLabel = computed(() => props.labels?.credit || 'Anatomy: BodyParts3D · CC BY 4.0');
const roleLabel = computed(() => `${frontLabel.value} / ${backLabel.value}`);

// requestAnimationFrame is not available in every environment this component is
// mounted in (notably jsdom under test), so fall back to timers.
const raf = (cb: (now: number) => void) =>
  window.requestAnimationFrame
    ? window.requestAnimationFrame(cb)
    : window.setTimeout(() => cb(performance.now()), 16);
const caf = (id: number) =>
  window.cancelAnimationFrame ? window.cancelAnimationFrame(id) : window.clearTimeout(id);

// Body, organs and skeleton are rendered as independent layers. `reactive` is
// required so toggling a layer also updates the toolbar button state.
const layers = reactive({
  body: true,
  organs: true,
  skeleton: false,
});

/**
 * Skeleton shell opacity. Kept low enough that organs read clearly through it
 * while the skeleton's orientation stays obvious.
 *
 * There is no skin opacity any more: the external shell is the human body
 * GLB, which uses BODY_SHELL_OPACITY.
 */
const SKELETON_OPACITY = 0.28;

/**
 * Per-organ translucency, for the standard anatomical-illustration "x-ray"
 * treatment.
 *
 *   intestines  The small bowel/colon mass fills the whole lower abdomen and sits
 *               in front of the retroperitoneal organs (kidneys). Rendering it
 *               slightly translucent makes the kidneys readable in the default
 *               view rather than only after selecting them.
 *   brain       The brain is an opaque pale mass that fills the skull, so at full
 *               opacity it erased the head completely and the figure read as a
 *               sphere on a neck. Partially transparent, the skull and face
 *               still show through the translucent shell.
 */
const ORGAN_BASE_OPACITY: Record<string, number> = {
  intestines: 0.82,
  brain: 0.62,
};

/** Opacity for organs that are not the active selection. */
const DIMMED_OPACITY = 0.18;

// Body-area landmarks whose anchor point is baked into the manifest. Organs
// anchor to their own geometry instead.
const AREA_IDS = new Set([
  'head', 'eyes', 'neck', 'shoulders', 'chest', 'abdomen', 'pelvis', 'arms',
  'back', 'lowerback', 'thigh', 'knees', 'legs', 'ankle', 'feet',
]);
const ORGAN_IDS = new Set([
  'heart', 'lungs', 'liver', 'stomach', 'kidneys', 'brain', 'intestines',
]);

interface OrganRec {
  id: string;
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  base: THREE.Vector3;
}

interface HotDot {
  region: string;
  sphere: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  sprite: THREE.Sprite;
  spriteMat: THREE.SpriteMaterial;
  base: THREE.Vector3;
}

type PartManifest = {
  id: string;
  name: string;
  region: string;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: number[][];
};

interface Manifest {
  body: { parts: PartManifest[]; chunks: { url: string }[] };
  skeleton: { parts: PartManifest[]; chunks: { url: string }[] };
  anchors: Record<string, number[][]>;
}

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let raycaster: THREE.Raycaster | null = null;
let alive = true;
let rafId = 0;
let lastT = 0;
let resizeObs: ResizeObserver | null = null;
const disposables: { dispose: () => void }[] = [];

/**
 * The human body GLB is the only external body shell. It is the sole member
 * of the `body` layer, so the BodyParts3D `skin` region is never built or
 * rendered — that region would add a second external surface under this one.
 *
 * The asset is the Mandrake "Male body base mesh (highpoly)" adult male body
 * (CC BY 4.0, attribution required): a single natural outer-surface mesh with
 * no exposed muscle, no clothing and no external genital geometry, standing in
 * a relaxed A-pose with the arms held slightly away from the body. It carries
 * no textures — its form is real geometry shaded from vertex normals. It is
 * fitted, baked, to the organs and shipped as one shell; see
 * /models/ORKOD-ASSETS.md.
 */
let bodyShell: THREE.Object3D | null = null;
let bodyBounds: THREE.Box3 | null = null;

/** Measured cost of the shell, filled in by loadBodyShell(). */
let bodyStats = { meshes: 0, triangles: 0, vertices: 0, materials: 0 };
let perfReported = false;

/** Shipped size of the body GLB, recorded for the performance line. */
const BODY_SHELL_KB = 1117;

/**
 * Local path to the prepared body shell.
 *
 * The filename is content-fingerprinted (first 8 hex of the file's SHA-256).
 * The service worker caches /models/**.glb with a CacheFirst strategy, so a
 * stable name would pin the very first body ever downloaded for the life of
 * the cache. Bumping the hash whenever the GLB changes makes the request a
 * cache miss, which is what actually delivers a rebuilt body to existing
 * visitors.
 *
 * The shipped bytes are Meshopt-compressed (EXT_meshopt_compression, with
 * KHR_mesh_quantization): a 300k-triangle sculpt, 7.2 MB → 1.1 MB. There are no
 * textures. This is why `loadBodyShell` installs the Meshopt decoder on the
 * loader; without it the GLB cannot be decoded. Keep the name in sync with
 * public/models/ORKOD-ASSETS.md.
 */
const BODY_GLB_URL = '/models/orkod/orkod-human-body.8521db4e.glb';

/**
 * Shell opacity.
 *
 * The body has to read as a person first and a window second. The shell renders
 * as a cool-pearl translucent surface (the figure's relief comes from the mesh
 * geometry shaded by vertex normals, not from albedo), so it keeps the figure's
 * form and silhouette while the organs read clearly through it. This sits so the
 * organs read at a glance while the head, hands and leg shape stay legible.
 * Below roughly 0.28 the figure dissolves into the glow; above roughly 0.6 the
 * organs stop reading through it.
 */
const BODY_SHELL_OPACITY = 0.5;

/**
 * Framing margin for frameCamera(): the figure occupies 100 / FRAME_MARGIN of
 * the viewport height, so 1.34 puts it at about 75%. Measured against the
 * asset's real bounding box by scripts/check-framing.mjs, which confirms head,
 * hands and feet stay inside the frame at 390x844, 834x1112, 1280x800,
 * 1440x900 and 390x700.
 */
const FRAME_MARGIN = 1.34;

/** Muted champagne, used only for the rare selected-organ emphasis. */
const SELECT_GOLD = 0xf1d27a;

/**
 * Set by `animate()` only after `renderer.render()` has completed at least one
 * frame with a non-zero canvas. Readiness is a render fact, not an object-graph
 * assumption.
 */
let firstFrameDone = false;

const dots: HotDot[] = [];
const organs: OrganRec[] = [];
/**
 * Reactive count of built organs.
 *
 * `organs` is a plain array on purpose - it is rebuilt on every retry and read
 * in hot paths where a proxy would cost real time - but the template needs to
 * know when the organ set is complete so it can drop the "preparing" notice.
 * A plain `organs.length` read in the template is never re-evaluated, because
 * nothing about it is reactive; this counter is.
 */
const organCount = ref(0);
const layerMeshes = new Map<string, THREE.Object3D>();

/**
 * Stable raycast target list. Rebuilt only when the organ/dot set changes, so
 * pointermove never allocates an array and never tests the body shell.
 */
const pickTargets: THREE.Object3D[] = [];
const ndcScratch = new THREE.Vector2();

let manifest: Manifest | null = null;
let skeletonReady = false;
let skeletonLoading = false;

let spinTarget: number | null = null;
let autoRotate = true;
let hoverRegion: string | null = null;

/**
 * Render-on-demand bookkeeping.
 *
 * `animate()` used to submit a frame on every requestAnimationFrame tick, even
 * when nothing had moved — the steady state after a visitor grabs the scene
 * (auto-rotate off, nothing selected) was a static image paid for at the full
 * frame rate. `needsRender` is raised by every event that actually changes what
 * is on screen (pointer hover/selection, layer toggles, resize, camera moves);
 * the loop skips `renderer.render()` when it is clear. Auto-rotate, a camera
 * tween, an active selection pulse, and the very first frames all keep drawing
 * unconditionally, so nothing that animates can stall.
 */
let needsRender = true;

/** True while the tab is hidden; the loop is fully parked, not just idle. */
let loopPaused = false;

/**
 * Smooth camera move. When an organ is selected the camera eases onto it and
 * when the selection clears it eases back to the full-body frame, instead of
 * teleporting. Interpolates position and orbit target together with an
 * ease-in-out curve; cancelled the moment the user grabs the scene.
 */
let camTween: {
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  t0: THREE.Vector3;
  t1: THREE.Vector3;
  start: number;
  dur: number;
} | null = null;
const pointerDown = { x: 0, y: 0 };
const anchorScratch = new THREE.Vector3();
let lastAnchorKey = '';
let anchorDirty = true;

/**
 * Inflates a buffer only when it really is gzip.
 *
 * This matters because `.gz` files are frequently served with a
 * `Content-Encoding: gzip` header (Vite's dev server does this). The browser
 * then transparently decompresses the response, and blindly running the bytes
 * through DecompressionStream again fails with "incorrect header check".
 * Sniffing the 1f 8b magic makes the loader work whether or not the transport
 * already decoded it.
 */
async function maybeGunzip(buf: ArrayBuffer): Promise<ArrayBuffer> {
  const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
  const isGzip = head.length === 2 && head[0] === 0x1f && head[1] === 0x8b;
  if (!isGzip) return buf;
  if (!('DecompressionStream' in window)) throw new Error('gzip decompression unsupported');
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

async function fetchChunk(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`chunk ${url} -> HTTP ${res.status}`);
  return maybeGunzip(await res.arrayBuffer());
}

/**
 * Merges every part of a region into one BufferGeometry.
 *
 * Buffers are pre-allocated and filled with typed-array copies rather than
 * JS arrays, which keeps the ~550-part / ~265k-vertex bundle well under a
 * frame instead of stalling on millions of Array#push calls.
 */
function buildRegionGeometries(
  raw: ArrayBuffer,
  parts: PartManifest[]
): Map<string, THREE.BufferGeometry> {
  const totals = new Map<string, { v: number; i: number }>();
  for (const p of parts) {
    const t = totals.get(p.region) ?? { v: 0, i: 0 };
    t.v += p.vertexCount;
    t.i += p.indexCount;
    totals.set(p.region, t);
  }

  const geometries = new Map<string, THREE.BufferGeometry>();
  for (const [region, total] of totals) {
    const positions = new Float32Array(total.v * 3);
    const normals = new Float32Array(total.v * 3);
    const indices = new Uint32Array(total.i);
    let vo = 0;
    let io = 0;

    for (const p of parts) {
      if (p.region !== region) continue;
      const srcPos = new Float32Array(raw, p.positions, p.vertexCount * 3);
      const srcNrm = new Int16Array(raw, p.normals, p.vertexCount * 3);
      const srcIdx = new Uint32Array(raw, p.indices, p.indexCount);

      positions.set(srcPos, vo * 3);
      const nOff = vo * 3;
      for (let i = 0; i < srcNrm.length; i++) normals[nOff + i] = srcNrm[i] / 32767;
      for (let i = 0; i < srcIdx.length; i++) indices[io + i] = srcIdx[i] + vo;

      vo += p.vertexCount;
      io += p.indexCount;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));

    disposables.push(geo);
    geometries.set(region, geo);
  }
  return geometries;
}

function buildScene(geometries: Map<string, THREE.BufferGeometry>, layer: string, regions: string[]) {
  if (!scene) return;
  for (const region of regions) {
    const geo = geometries.get(region);
    if (!geo) continue;
    const organPart = isOrgan(region);
    const organOpacity = organPart ? ORGAN_BASE_OPACITY[region] ?? 1 : 1;

    const material = organPart
      ? new THREE.MeshStandardMaterial({
          color: REGION_COLORS[region] ?? 0xcccccc,
          roughness: 0.62,
          metalness: 0.05,
          side: THREE.FrontSide,
          transparent: organOpacity < 1,
          opacity: organOpacity,
          depthWrite: organOpacity >= 1,
        })
      : new THREE.MeshStandardMaterial({
          color: REGION_COLORS[region] ?? 0xcccccc,
          roughness: 0.5,
          metalness: 0.02,
          transparent: true,
          opacity: SKELETON_OPACITY,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

    disposables.push(material);
    const mesh = new THREE.Mesh(geo, material);
    mesh.userData.region = region;
    mesh.userData.layer = layer;
    // Organs draw at the default order. The body shell was added to the scene
    // before any anatomy and never writes depth, so the organs always composite
    // over it; the skeleton is pushed behind both.
    mesh.renderOrder = layer === 'skeleton' ? -1 : 0;

    if (organPart) {
      // Each organ's callout anchors to its own geometry centre. Without an
      // explicit bounding box every organ fell back to a zero vector, so all
      // seven anchored to the world origin and their callouts projected to the
      // same screen point.
      if (!geo.boundingBox) geo.computeBoundingBox();
      const bb = geo.boundingBox;
      organs.push({
        id: region,
        mesh,
        material: material as THREE.MeshStandardMaterial,
        base: (bb ? bb.getCenter(new THREE.Vector3()) : new THREE.Vector3()).clone(),
      });
      organCount.value = organs.length;
    }

    scene.add(mesh);
    layerMeshes.set(`${layer}:${region}`, mesh);
  }
}

/**
 * Rebuilds the stable raycast target list.
 *
 * Only selectable organs and their landmark dots are raycastable. The
 * body shell is deliberately excluded: it is decorative and testing its
 * geometry on every pointermove is pure cost.
 */
function refreshPickTargets() {
  pickTargets.length = 0;
  for (const o of organs) {
    if (o.mesh.visible) pickTargets.push(o.mesh);
  }
  for (const d of dots) {
    if (d.sphere.visible) pickTargets.push(d.sphere);
  }
}

async function loadSkeleton() {
  if (!manifest || skeletonLoading) return;
  skeletonLoading = true;
  try {
    if (!skeletonReady) {
      const raw = await fetchChunk(manifest.skeleton.chunks[0].url);
      const geometries = buildRegionGeometries(raw, manifest.skeleton.parts);
      buildScene(geometries, 'skeleton', ['skeleton']);
      skeletonReady = true;
    }
    const sk = layerMeshes.get('skeleton:skeleton');
    if (sk) sk.visible = layers.skeleton;
  } catch (err) {
    console.warn('[HumanBody3D] skeleton layer failed to load', err);
  } finally {
    skeletonLoading = false;
  }
}

function buildAreaDots(man: { anchors: Record<string, number[][]> }) {
  if (!scene) return;
  const anchors = man.anchors ?? {};
  const dotGeo = new THREE.SphereGeometry(0.018, 16, 12);
  disposables.push(dotGeo);
  const glowTex = makeGlowTexture();
  const glowGeo = new THREE.PlaneGeometry(1, 1);
  disposables.push(glowGeo);

  for (const region of AREA_IDS) {
    const points = anchors[region];
    if (!points) continue;
    for (const raw of points) {
      const pos = new THREE.Vector3(raw[0], raw[1], raw[2]);
      // Nudge the landmark slightly outward from the body centre so it reads
      // through the translucent shell at any viewing angle.
      const outward = new THREE.Vector3(raw[0] * 0.15, 0, raw[2] * 0.55).normalize();
      pos.addScaledVector(outward, 0.045);

      const material = new THREE.MeshBasicMaterial({
        color: 0xe3d3aa,
        transparent: true,
        opacity: DOT_REST_OPACITY,
        depthWrite: false,
        toneMapped: false,
      });
      disposables.push(material);
      const sphere = new THREE.Mesh(dotGeo, material);
      sphere.position.copy(pos);
      sphere.userData.region = region;

      const spriteMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xe3d3aa,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        transparent: true,
        // Kept very low at rest: there are around twenty landmarks, and gold is
        // meant to be rare on this page. Hover and selection bring them up.
        opacity: DOT_REST_GLOW,
        toneMapped: false,
      });
      disposables.push(spriteMat);
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.setScalar(0.07);
      sprite.position.copy(pos);

      const group = new THREE.Group();
      group.add(sphere, sprite);
      scene.add(group);

      dots.push({ region, sphere, material, sprite, spriteMat, base: pos.clone() });
    }
  }
  applyDotVisuals();
}

function makeGlowTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 244, 222, 1)');
    grad.addColorStop(0.42, 'rgba(227, 211, 170, 0.6)');
    grad.addColorStop(1, 'rgba(227, 211, 170, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
const tex = new THREE.CanvasTexture(canvas);
  disposables.push(tex);
  return tex;
}

/**
 * Loads the human body GLB — the single external body shell.
 *
 * The asset arrives already in the coordinate frame the anatomy bundle uses:
 * metres, +Y up, feet on y=0, midline on x=0, and every organ already sits
 * inside the shell. Measured, not assumed: scripts/verify-body-glb.mjs asserts
 * containment with the generalised winding number, and
 * scripts/check-framing.mjs derives the camera from this file's real bounding
 * box. No corrective transform is applied at runtime.
 *
 * Its geometry contains no external genital anatomy. It is a smooth anatomical
 * base mesh (Mandrake, CC BY 4.0), so the figure reads as a neutral body surface
 * with a flat, featureless groin and there is no external genital geometry.
 * Nothing is masked, clipped or hidden at runtime.
 *
 * Applies a translucent treatment so the organs read through the body while the
 * muscle form and silhouette stay legible. The material is deliberately matte
 * and cheap: no transmission, no clearcoat, no IBL — nothing that would read as
 * shiny plastic or cost an extra render pass.
 */
/**
 * Shell colour.
 *
 * Spec: a neutral pearl / cool lavender-white, NOT a purple body, with the
 * purple coming from the environment and the lighting rather than the albedo.
 *
 * `#ded9e8` is a very light, cool near-white with only a trace of lavender in
 * it. Two consequences worth stating, because they are the whole point:
 *
 *   - The figure stays recognisably a human. A saturated albedo (`0xb9a7e8` and
 *     anything like it) turns the body into a lavender ghost and the silhouette
 *     stops reading as a person.
 *   - Against a near-black void a light albedo is the only thing that makes the
 *     silhouette legible at all, which is why the shell has to be light rather
 *     than tinted to match the palette.
 *
 * The atmospheric purple is added by the three lights and the emissive term
 * below, so the body catches the colour of the room instead of being painted it.
 */
const SHELL_COLOR = 0xded9e8;

/**
 * Violet self-illumination.
 *
 * A whisper of ambient so the figure picks up the room's purple and never goes
 * fully black at the shoulders. Kept deliberately low: a stronger emissive
 * turns the figure into a flat dark mass.
 */
const SHELL_EMISSIVE = 0x241a3d;
const SHELL_EMISSIVE_INTENSITY = 0.16;

/**
 * Opacity for the body shell materials.
 */
const SHELL_OPACITY = BODY_SHELL_OPACITY;

/**
 * Creates a translucent variant of a material, preserving its original color and
 * texture while enabling organ visibility.
 *
 * `side: FrontSide` is load-bearing, not a default. With `DoubleSide` every limb
 * drew its own back faces through the front faces, so each arm and leg rendered
 * as a hollow translucent tube and the whole figure read as a stack of cylinders
 * rather than a person. Front faces only keeps the silhouette solid; the organs
 * stay visible because `depthWrite` is off and the material is blended.
 *
 * The original per-mesh colour is preserved, because flattening the body into
 * one flat tint is what previously erased the model's identity.
 */
function makeTranslucent(mat: THREE.Material): THREE.MeshStandardMaterial {
  const base = mat as THREE.MeshStandardMaterial;
  // Metalness is forced to 0 and roughness to a matte mid value, and the colour
  // is a flat cool pearl. A translucent shell must not inherit the source
  // material's metalness/roughness (the retired écorché shipped those = 1
  // through a packed metallicRoughness texture and read as polished metal) nor
  // its albedo: a coloured body stops the silhouette reading as a person, so the
  // purple environment is left to fall on the neutral surface instead.
  //
  // A normal map is carried over only when the source has one. The shipped
  // Mandrake shell has no textures at all — its relief is real geometry shaded
  // from vertex normals — so `base.normalMap` is null and the form comes
  // straight from the mesh. The branch is kept so a normal-mapped shell (like
  // the retired écorché) would still shade correctly.
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(SHELL_COLOR),
    roughness: 0.5,
    metalness: 0.0,
    transparent: true,
    opacity: SHELL_OPACITY,
    depthWrite: false,
    side: THREE.FrontSide,
    emissive: new THREE.Color(SHELL_EMISSIVE),
    emissiveIntensity: SHELL_EMISSIVE_INTENSITY,
    normalMap: base.normalMap ?? null,
    normalScale: base.normalScale?.clone() ?? null,
  });
}

async function loadBodyShell(url: string): Promise<THREE.Object3D> {
  // The shipped GLB carries EXT_meshopt_compression, so the loader needs the
  // Meshopt decoder before it can read the vertex/index buffers. The decoder is
  // shipped inside three's addons (wasm inlined), so this costs no extra fetch.
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  root.name = 'orkod-human-body';

  let meshes = 0;
  let triangles = 0;
  let vertices = 0;
  let materialCount = 0;
  const createdMaterials: THREE.Material[] = [];

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    const previous = mesh.material;
    const originalMaterials = Array.isArray(previous) ? previous : previous ? [previous] : [];

    // Create translucent versions of each original material, preserving colors/textures
    const newMaterials = originalMaterials.map((m) => {
      const tm = makeTranslucent(m);
      createdMaterials.push(tm);
      return tm;
    });

    // Dispose old materials
    originalMaterials.forEach((m) => m.dispose());

    // Apply the new material(s) — preserves the material structure (eye, skin)
    mesh.material = newMaterials.length === 1 ? newMaterials[0] : newMaterials;

    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.renderOrder = 0;
    mesh.frustumCulled = true;

    const geo = mesh.geometry as THREE.BufferGeometry;
    meshes++;
    vertices += geo.attributes.position?.count ?? 0;
    triangles += (geo.index ? geo.index.count : (geo.attributes.position?.count ?? 0)) / 3;
  });

  materialCount = createdMaterials.length;
  disposables.push(...createdMaterials);

  root.updateMatrixWorld(true);
  bodyStats = { meshes, triangles, vertices, materials: materialCount };
  console.info(
    `[HumanBody3D] body shell ready: ${triangles} triangles, ${vertices} vertices, ` +
      `${meshes} draw calls, ${materialCount} materials, ${BODY_SHELL_KB} KB`
  );
  return root;
}

/**
 * Publishes the shell's cost once it is on screen, so the split between the
 * body and the organs is observable rather than assumed. The organs are the
 * expensive layer by design; the shell must not be.
 *
 * `renderer.info.render` is a *last-render* snapshot. Reading it at the moment
 * the organ pipeline finishes captured a frame from before the landmark dots
 * existed and so under-reported the page by roughly 40 draw calls. The numbers
 * are now accumulated per object instead, which is both stable and the honest
 * figure, and the renderer snapshot is included only as a cross-check.
 */
function reportPerformance() {
  if (!renderer || perfReported) return;
  // Wait until BOTH layers are on screen. The shell is a 23 MB async load and
  // the organs stream in progressively, so either can finish first; reporting
  // as soon as one arrived would publish a half-zero split. Both call sites —
  // the organ pipeline finishing and the shell resolving — re-run this, so the
  // figure is reported exactly once, when neither half is missing.
  if (bodyStats.triangles === 0 || organs.length === 0) return;
  perfReported = true;
  let organTriangles = 0;
  let raycastTriangles = 0;
  for (const o of organs) {
    const geo = o.mesh.geometry as THREE.BufferGeometry;
    organTriangles += (geo.index ? geo.index.count : (geo.attributes.position?.count ?? 0)) / 3;
  }
  for (const target of pickTargets) {
    const geo = (target as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!geo) continue;
    raycastTriangles += (geo.index ? geo.index.count : (geo.attributes.position?.count ?? 0)) / 3;
  }
  // Every object that will actually be drawn in the steady state.
  let drawObjects = 0;
  let visibleDotSprites = 0;
  if (scene) {
    scene.traverse((obj) => {
      if ((obj as THREE.Sprite).isSprite) {
        if (obj.visible) {
          drawObjects++;
          visibleDotSprites++;
        }
        return;
      }
      const m = obj as THREE.Mesh;
      if (m.isMesh && m.visible) drawObjects++;
    });
  }
  const s = bodyStats;
  console.info(
    `[HumanBody3D] performance — body ${s.triangles} tris / ${s.vertices} verts / ` +
      `${s.materials} material / ${s.meshes} draw calls; ` +
      `organs ${organTriangles} tris in ${organs.length} meshes; ` +
      `raycast targets ${pickTargets.length} meshes (${raycastTriangles} tris); ` +
      `scene ${drawObjects} visible drawables (${visibleDotSprites} landmark glows); ` +
      `renderer last frame: ${renderer.info.render.calls} calls, ` +
      `${renderer.info.render.triangles} tris`
  );
}
/**
 * Landmark marker weight at rest.
 *
 * There are ~20 landmarks on the body, so even individually faint markers add up:
 * at the previous weight they read as a constellation of gold and flooded the
 * page with the one colour that is supposed to be rationed. Gold is now reserved
 * for hover and selection, and at rest these are barely-there position hints.
 */
const DOT_REST_OPACITY = 0.3;

/**
 * Landmark glow sprites are hidden at rest and shown only on hover/selection.
 *
 * Measured: with every sprite drawing, the page issued ~51 draw calls per frame
 * — 40 of them for ~20 additively-blended glow quads that were only 10% opaque
 * and effectively invisible. That was the single largest render cost on the
 * page, larger than all seven organs combined, spent on something nobody could
 * see. Toggling `visible` instead of opacity keeps the hover/selection glow and
 * removes those draws from the steady-state frame.
 */
const DOT_REST_GLOW = 0.75;

function applyDotVisuals() {
  const activeId = props.activeId ?? null;
  for (const dot of dots) {
    const selected = activeId === dot.region;
    const hovered = !activeId && hoverRegion === dot.region;
    const factor = selected || hovered ? 1.4 : 1;
    dot.sphere.scale.setScalar(factor);
    dot.sprite.scale.setScalar(0.07 * factor);
    if (selected) {
      dot.material.color.setHex(0xfff2d9);
      dot.material.opacity = 1;
      dot.sprite.visible = true;
      dot.spriteMat.opacity = 0.9;
    } else if (hovered) {
      dot.material.color.setHex(0xfff9ee);
      dot.material.opacity = 1;
      dot.sprite.visible = true;
      dot.spriteMat.opacity = DOT_REST_GLOW;
    } else {
      dot.material.color.setHex(0xe3d3aa);
      dot.material.opacity = DOT_REST_OPACITY;
      // Off entirely at rest: the additive halo cost 20 draw calls a frame to
      // render something at 10% alpha that could not be seen.
      dot.sprite.visible = false;
    }
  }
}

function applyOrganVisuals() {
  const activeId = props.activeId ?? null;
  // Only dim the other organs when an ORGAN is the active selection. Selecting a
  // body-area landmark (e.g. "chest") must not fade the whole organ layer.
  const organSelected = isOrgan(activeId);
  for (const o of organs) {
    const selected = activeId === o.id;
    const dimmed = organSelected && !selected;
    // The organs layer toggle owns visibility; visuals must never re-show a
    // layer the user has switched off.
    o.mesh.visible = layers.organs;

    // Organ colours stay medical and readable. The only added signal is a small
    // champagne lift on the selected organ - no recolouring, and no emissive
    // halo, which is what previously put a glow around the brain.
    o.material.color.setHex(REGION_COLORS[o.id] ?? 0xcccccc);
    if (dimmed) o.material.color.multiplyScalar(0.7);
    if (selected) {
      o.material.emissive.setHex(SELECT_GOLD);
      o.material.emissiveIntensity = 0.16;
    } else {
      o.material.emissive.setHex(0x000000);
      o.material.emissiveIntensity = 0;
    }
    const base = ORGAN_BASE_OPACITY[o.id] ?? 1;
    o.material.opacity = dimmed ? DIMMED_OPACITY : base;
    o.material.transparent = dimmed || base < 1;
    o.material.depthWrite = !dimmed && base >= 1;
  }
}

/**
 * The point the callout should point at: a real position on the selected
 * region. For organs we cast a ray from the camera through the organ's centre
 * and take the first hit on that organ's own mesh, which is the surface the
 * user is actually looking at. This keeps the leader line attached to the
 * organ as the model rotates (and works for paired organs such as the lungs
 * and kidneys, whose bounding-box centre sits in empty space between them).
 */
function regionPoint(region: string): THREE.Vector3 | null {
  if (!camera) return null;
  const organ = organs.find((o) => o.id === region);
  if (organ && raycaster) {
    // Use the meshe's current world matrix so the anchor follows rotation/scale.
    const worldBase = organ.base.clone().applyMatrix4(organ.mesh.matrixWorld);
    const dir = new THREE.Vector3().subVectors(worldBase, camera.position);
    const dist = dir.length();
    if (dist > 0) {
      dir.normalize();
      raycaster.set(camera.position, dir);
      raycaster.near = 0;
      raycaster.far = dist * 1.02;
      const hits = raycaster.intersectObject(organ.mesh, false);
      raycaster.far = Infinity;
      if (hits.length) return hits[0].point.clone();
    }
    return worldBase.clone();
  }
  const dot = dots.find((d) => d.region === region);
  return dot ? dot.base.clone() : null;
}

// syncAnchor projects the currently selected region onto the canvas and emits
// screen-anchored percentages so parents can draw the callout that points at
// the real part. Emitted only on change.
function syncAnchor() {
  const id = props.activeId ?? null;
  let payload: { id: string; x: number; y: number } | null = null;
  if (id && camera && scene) {
    const base = regionPoint(id);
    if (base) {
      anchorScratch.copy(base).project(camera);
      if (
        anchorScratch.z <= 1 &&
        Math.abs(anchorScratch.x) <= 1 &&
        Math.abs(anchorScratch.y) <= 1
      ) {
        payload = {
          id,
          x: (anchorScratch.x * 0.5 + 0.5) * 100,
          y: (-anchorScratch.y * 0.5 + 0.5) * 100,
        };
      }
    }
  }
  const key = payload
    ? `${payload.id}:${payload.x.toFixed(1)}:${payload.y.toFixed(1)}`
    : '';
  if (key !== lastAnchorKey) {
    lastAnchorKey = key;
    emit('anchor', payload);
  }
}

function toggleLayer(key: 'body' | 'organs' | 'skeleton') {
  layers[key] = !layers[key];
  if (key === 'skeleton' && layers[key]) void loadSkeleton();
  if (key === 'body') {
    // The body shell is the only member of the body layer.
    if (bodyShell) bodyShell.visible = layers.body;
  }
  if (key === 'organs') {
    for (const o of organs) o.mesh.visible = layers.organs;
  }
  refreshPickTargets();
  if (key === 'skeleton') {
    const sk = layerMeshes.get('skeleton:skeleton');
    if (sk) sk.visible = layers.skeleton;
  }
  needsRender = true;
}

/**
 * Reads the usable pixel size of the stage.
 *
 * Returns zeroes when the stage has not been laid out yet, which the caller
 * treats as "not ready to render" rather than silently substituting a fake size.
 */
function stageSize(): { w: number; h: number } {
  const stage = stageEl.value;
  if (!stage) return { w: 0, h: 0 };
  const rect = stage.getBoundingClientRect();
  const w = Math.round(rect.width) || stage.clientWidth || 0;
  const h = Math.round(rect.height) || stage.clientHeight || 0;
  return { w, h };
}

/**
 * Frames the camera on the body shell's real bounding box.
 *
 * The camera distance is solved from the vertical FOV so the whole figure fits
 * with a small margin, then widened for narrow/portrait viewports using the
 * horizontal FOV. Nothing here assumes any particular body asset: FRAME_MARGIN
 * is verified against the shipped GLB by scripts/check-framing.mjs.
 *
 * `bottomInset` reserves the strip the host covers with its own controls, and
 * the figure is centred inside what is left rather than inside the whole canvas.
 * Without it the feet sit behind the organ bar on the /body page.
 */
function frameView(): { pos: THREE.Vector3; target: THREE.Vector3; dist: number } | null {
  if (!camera || !bodyBounds) return null;
  const size = bodyBounds.getSize(new THREE.Vector3());
  const center = bodyBounds.getCenter(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) return null;

  const { h } = stageSize();
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(0.1, camera.aspect));

  // FRAME_MARGIN keeps the figure at roughly 75% of the *available* height,
  // which leaves room for the heading above, the organ bar below and the
  // callout. Never let the host's insets eat more than a third of the stage.
  const bottomInset = Math.max(0, Math.min(props.bottomInset, h * 0.34));
  const topInset = Math.max(0, Math.min(props.topInset, h * 0.34));
  const usable = h > 0 ? Math.max(0.35, (h - bottomInset - topInset) / h) : 1;
  const margin = FRAME_MARGIN;
  const distV = (size.y * margin) / (2 * Math.tan(vFov / 2) * usable);
  const distH = (Math.max(size.x, size.z) * margin) / (2 * Math.tan(hFov / 2) * usable);
  const dist = Math.max(distV, distH, 0.6);

  // Slight downward tilt reads as a body standing in space rather than a flat
  // elevation drawing.
  const dir = new THREE.Vector3(0, 0.1, 1).normalize();

  // The host covers strips at the bottom (organ bar) and top (heading, etc).
  // The figure must be centred inside what is left, not inside the raw canvas.
  // Bottom inset -> lower the orbit target -> figure rides up the frame.
  // Top inset -> raise the orbit target -> figure drops down the frame.
  const drop = h > 0 ? (bottomInset / 2 / h) * 2 * dist * Math.tan(vFov / 2) : 0;
  const rise = h > 0 ? (topInset / 2 / h) * 2 * dist * Math.tan(vFov / 2) : 0;
  const target = center.clone();
  target.y -= drop;
  target.y += rise;
  const pos = target.clone().addScaledVector(dir, dist);
  return { pos, target, dist };
}

function frameCamera(instant = false) {
  if (!scene || !camera || !controls || !bodyBounds) return;
  const v = frameView();
  if (!v) return;
  camera.position.copy(v.pos);
  controls.target.copy(v.target);
  controls.minDistance = v.dist * 0.35;
  controls.maxDistance = v.dist * 4;
  controls.update();

  if (instant) {
    spinTarget = null;
    autoRotate = false;
    controls.autoRotate = false;
  }
  anchorDirty = true;
  needsRender = true;
}

/**
 * Eases the orbit camera from wherever it is to a new position/target. Manual
 * interaction cancels the tween (see the controls 'start' listener), so the
 * move never fights the user.
 */
function startCamTween(
  pos: THREE.Vector3,
  target: THREE.Vector3,
  minDistance: number,
  maxDistance: number,
  dur = 720
) {
  if (!camera || !controls) return;
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  camTween = {
    p0: camera.position.clone(),
    p1: pos.clone(),
    t0: controls.target.clone(),
    t1: target.clone(),
    start: performance.now(),
    dur,
  };
  autoRotate = false;
  spinTarget = null;
  controls.autoRotate = false;
}

/**
 * Camera placement for a close-up on one organ: approaches along the current
 * view direction (so the scene does not flip) and stops at a distance that
 * frames the organ's own bounding sphere with a margin.
 */
function focusOrganView(region: string): { pos: THREE.Vector3; target: THREE.Vector3; dist: number } | null {
  if (!camera || !controls) return null;
  const organ = organs.find((o) => o.id === region);
  if (!organ) return null;
  const geo = organ.mesh.geometry as THREE.BufferGeometry;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (!bb) return null;
  const center = bb.getCenter(new THREE.Vector3());
  const size = bb.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5 || 0.1;
  const vFov = (camera.fov * Math.PI) / 180;
  const dist = Math.max((radius * 1.7) / Math.tan(vFov / 2), 0.34);

  const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0.1, 1);
  dir.normalize();
  const pos = center.clone().addScaledVector(dir, dist);
  return { pos, target: center, dist };
}

function focusOnSelection() {
  const id = props.activeId ?? null;
  if (isOrgan(id)) {
    const v = focusOrganView(id as string);
    if (v) startCamTween(v.pos, v.target, 0.22, 6);
  } else {
    // Any non-organ selection (or clearing) returns to the full-body frame.
    const v = frameView();
    if (v) startCamTween(v.pos, v.target, v.dist * 0.35, v.dist * 4);
  }
}

/**
 * Parks the render loop while the tab is hidden.
 *
 * A backgrounded tab has no visible frame, so continuing to pay for a
 * ~672k-triangle WebGL render every 16 ms is pure waste — battery and heat on
 * mobile, needless CPU contention on desktop. `animate()` stops rescheduling
 * itself the moment `document.hidden` is true; this listener resumes the loop
 * (and forces one fresh frame) when the tab is shown again.
 */
function onVisibilityChange() {
  if (document.hidden) {
    loopPaused = true;
    caf(rafId);
    return;
  }
  if (alive && loopPaused) {
    loopPaused = false;
    lastT = performance.now();
    needsRender = true;
    rafId = raf(animate);
  }
}

function initScene() {
  const stage = stageEl.value;
  const root = rootEl.value;
  if (!stage || !root) {
    state.value = 'error';
    return;
  }

  // Renderer
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    console.error('[HumanBody3D] WebGL context creation failed', err);
    state.value = 'error';
    return;
  }
  const gl = renderer.getContext();
  if (!gl) {
    console.error('[HumanBody3D] WebGL context unavailable');
    state.value = 'error';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  // The deep-space background is CSS on the stage, so the canvas stays
  // transparent and never needs a clear colour of its own.
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const { w, h } = stageSize();
  if (w <= 0 || h <= 0) {
    console.warn('[HumanBody3D] stage has no layout size yet', { w, h });
    state.value = 'error';
    return;
  }
  renderer.setSize(w, h, false);

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', props.labels?.front || '3D anatomy');
  stage.appendChild(canvas);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(40, w / h, 0.05, 60);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.panSpeed = 0.6;
  controls.screenSpacePanning = true;
  controls.enableZoom = true;
  controls.zoomSpeed = 0.85;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.autoRotateSpeed = 0.55;
  controls.addEventListener('start', () => {
    autoRotate = false;
    spinTarget = null;
    camTween = null;
  });
  controls.addEventListener('change', () => {
    anchorDirty = true;
    needsRender = true;
  });

  raycaster = new THREE.Raycaster();

  // Lighting: three lights, no shadow maps, no tone mapping, no
  // post-processing.
  //
  // The shell has to read as a lit person, not a tinted ghost. Both the fill
  // and the rim used to be violet; because the body is translucent, the violet
  // stacked with the purple stage glow showing through it and dyed the whole
  // figure purple/blue, so a natural-skin shell read as a coloured layer over
  // itself. The lights are neutral-to-warm now: the key is plain white, the
  // fill is a warm cream and the rim a soft neutral that still separates the
  // silhouette from the black void without tinting the figure.
  scene.add(new THREE.HemisphereLight(0xf3ede2, 0x120d0a, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(2.4, 3.2, 3.0);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xefe3d2, 0.9);
  fill.position.set(-2.6, 1.4, 2.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xd2c8ba, 0.8);
  rim.position.set(-2.2, 2.2, -3.2);
  scene.add(rim);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.style.cursor = 'grab';

  resizeObs =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (!renderer || !camera) return;
          const s = stageSize();
          if (s.w <= 0 || s.h <= 0) return;
          camera.aspect = s.w / s.h;
          camera.updateProjectionMatrix();
          renderer.setSize(s.w, s.h, false);
          frameCamera(true);
          anchorDirty = true;
          needsRender = true;
        })
      : null;
  resizeObs?.observe(stage);

  canvas.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
    console.error('[HumanBody3D] WebGL context lost');
    state.value = 'error';
  });

  // Park the loop (and free the GPU) whenever the tab is backgrounded.
  document.addEventListener('visibilitychange', onVisibilityChange);

  // The one and only external body shell. Loading is async, so the scene is
  // populated as soon as it resolves; `state` still only becomes 'ready' from
  // animate() after a real frame has been drawn.
  void loadBodyShell(BODY_GLB_URL).then(
    (shell) => {
      if (!alive || !scene) {
        // Unmounted or retried while the model was in flight.
        shell.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) m.geometry?.dispose();
        });
        return;
      }
      bodyShell = shell;
      scene.add(shell);
      shell.visible = layers.body;
      bodyBounds = new THREE.Box3().setFromObject(shell);
      frameCamera(true);
      anchorDirty = true;
      reportPerformance();
    },
    (err) => {
      console.error('[HumanBody3D] body shell failed to load', err);
      state.value = 'error';
    }
  );

  firstFrameDone = false;
  needsRender = true;

  // `state` is intentionally NOT set here. It becomes 'ready' from animate()
  // once renderer.render() has actually produced a frame at a non-zero size.
}

/** Tears down the live Three.js objects so a Retry can rebuild cleanly. */
function disposeScene() {
  resizeObs?.disconnect();
  resizeObs = null;

  document.removeEventListener('visibilitychange', onVisibilityChange);
  loopPaused = false;

  if (controls) {
    controls.dispose();
    controls = null;
  }

  const canvas = renderer?.domElement;
  if (canvas) {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.remove();
  }

  if (scene) {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry?.dispose?.();
    });
    scene.clear();
    scene = null;
  }

  for (const d of disposables.splice(0, disposables.length)) {
    try {
      d.dispose();
    } catch {
      /* disposal is best-effort */
    }
  }

  renderer?.dispose();
  renderer = null;
  raycaster = null;
  bodyShell = null;
  bodyBounds = null;
  camTween = null;
  organs.length = 0;
  organCount.value = 0;
  dots.length = 0;
  layerMeshes.clear();
  pickTargets.length = 0;
  firstFrameDone = false;
  lastAnchorKey = '';
  needsRender = true;
  perfReported = false;
  bodyStats = { meshes: 0, triangles: 0, vertices: 0, materials: 0 };
}

/**
 * Retries initialisation after an error.
 *
 * The running animation loop must be stopped first: `animate()` reschedules
 * itself every frame, so disposing the scene without cancelling the pending
 * frame would leave an orphaned loop spinning against a null renderer.
 */
function retry() {
  alive = false;
  caf(rafId);
  disposeScene();

  state.value = 'loading';
  alive = true;
  lastT = performance.now();
  initScene();
  rafId = raf(animate);
}

function shortestAngle(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}



/**
 * Progressively loads the internal organs after the body shell is already on
 * screen and interactive.
 *
 * `state` is not touched here. The body becomes ready from `animate()`; this
 * pipeline only enriches it, and a failure here must never un-ready the body.
 * Organs are added one per animation frame so no single task blocks the main
 * thread long enough to drop frames during the ramp-in.
 */
async function loadAnatomyProgressive() {
  try {
    const res = await fetch('/models/anatomy/anatomy.json');
    if (!res.ok) throw new Error(`anatomy manifest HTTP ${res.status}`);
    const man = (await res.json()) as Manifest;

    // The `skin` region is filtered out before any buffer is touched: the
    // body shell is the only external shell, so those ~41k triangles are never
    // parsed, allocated or rendered.
    const organParts = man.body.parts.filter((p) => p.region !== 'skin');
    const raw = await fetchChunk(man.body.chunks[0].url);
    const geometries = buildRegionGeometries(raw, organParts);

    // Critical organs first so the most recognisable anatomy appears earliest.
    const critical = ['heart', 'lungs', 'liver', 'brain'];
    const ordered = [
      ...critical.filter((id) => ORGAN_IDS.has(id)),
      ...[...ORGAN_IDS].filter((id) => !critical.includes(id)),
    ];

    let i = 0;
    const step = () => {
      if (i >= ordered.length) {
        // Every organ has arrived; refresh anchors once so callouts for organs
        // that were selected during loading land correctly.
        applyOrganVisuals();
        buildAreaDots(man);
        refreshPickTargets();
        lastAnchorKey = '';
        anchorDirty = true;
        manifest = man;
        reportPerformance();
        return;
      }
      const region = ordered[i++];
      try {
        buildScene(geometries, 'organs', [region]);
      } catch (err) {
        // A single malformed organ must not abort the rest of the set.
        console.error(`[HumanBody3D] organ "${region}" failed to build`, err);
      }
      raf(step);
    };
    raf(step);
  } catch (err) {
    // The body shell stays interactive; the user just sees no organs.
    console.error('[HumanBody3D] organ bundle unavailable; body shell remains usable', err);
  }
}

function resetView() {
  camTween = null;
  spinTarget = null;
  autoRotate = true;
  if (controls) controls.autoRotate = true;
  frameCamera(true);
  anchorDirty = true;
}

function onPointerDown(e: PointerEvent) {
  pointerDown.x = e.clientX;
  pointerDown.y = e.clientY;
}

function ndcFrom(e: PointerEvent): THREE.Vector2 | null {
  const canvas = renderer?.domElement;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  ndcScratch.set(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  return ndcScratch;
}

function pickRegion(e: PointerEvent): string | null {
  if (!raycaster || !camera || pickTargets.length === 0) return null;
  const ndc = ndcFrom(e);
  if (!ndc) return null;
  raycaster.setFromCamera(ndc, camera);
  // Only selectable organs and landmark dots — never the body shell, never an
  // invisible mesh. This keeps per-pointermove cost off the ~372k-triangle
  // path that a full-scene raycast would take.
  const hits = raycaster.intersectObjects(pickTargets, false);
  if (!hits.length) return null;
  return (hits[0].object.userData.region as string) ?? null;
}

function onPointerUp(e: PointerEvent) {
  const dx = e.clientX - pointerDown.x;
  const dy = e.clientY - pointerDown.y;
  // Ignore drags; only a click selects.
  if (dx * dx + dy * dy > 25) return;
  const id = pickRegion(e);
  if (id === (props.activeId ?? null)) return;
  hoverRegion = null;
  applyDotVisuals();
  applyOrganVisuals();
  needsRender = true;
  emit('select', id);
}

function onPointerMove(e: PointerEvent) {
  const canvas = renderer?.domElement;
  if (!canvas) return;
  const id = pickRegion(e);
  canvas.style.cursor = id ? 'pointer' : 'grab';
  if (id !== hoverRegion) {
    hoverRegion = id;
    applyDotVisuals();
    applyOrganVisuals();
    needsRender = true;
  }
}

function pulse() {
  const activeId = props.activeId ?? null;
  const organSelected = isOrgan(activeId);
  const t = performance.now() / 1000;
  for (const o of organs) {
    const selected = activeId === o.id;
    const hovered = !organSelected && hoverRegion === o.id;
    if (selected || hovered) {
      const base = selected ? 1.025 : 1.012;
      o.mesh.scale.setScalar(base * (1 + Math.sin(t * 4.5) * 0.015));
    } else {
      o.mesh.scale.setScalar(1);
    }
  }
}

function animate(now: number) {
  if (!alive) return;
  // A hidden tab has no visible frame: stop the loop entirely (and stop
  // rescheduling) rather than burning the GPU to draw a picture nobody sees.
  // onVisibilityChange() restarts it when the tab is shown again.
  if (document.hidden) {
    loopPaused = true;
    return;
  }
  rafId = raf(animate);
  const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
  lastT = now;

  if (controls && camera) {
    if (camTween) {
      // Ease the camera and the orbit target together; the target is moved too
      // so the organ ends up centred rather than sliding off the frame.
      const k = Math.min(1, (now - camTween.start) / camTween.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(camTween.p0, camTween.p1, e);
      controls.target.lerpVectors(camTween.t0, camTween.t1, e);
      controls.autoRotate = false;
      controls.update();
      if (k >= 1) camTween = null;
    } else if (spinTarget !== null) {
      autoRotate = false;
      controls.autoRotate = false;
      const cur = controls.getAzimuthalAngle();
      const d = shortestAngle(cur, spinTarget);
      const step = d * Math.min(1, dt * 7);
      controls.rotateLeft(step);
      if (Math.abs(d) < 0.01) {
        controls.rotateLeft(d);
        spinTarget = null;
        controls.autoRotate = false;
      }
      controls.update();
    } else {
      controls.autoRotate = autoRotate;
      controls.update();
    }
  }

  // Recomputing the anchor costs one raycast against a single mesh, so only do
  // it when the camera or the selection actually changed.
  if (anchorDirty) {
    anchorDirty = false;
    syncAnchor();
  }

  pulse();

  // Readiness is a rendering fact, not an assumption about the object graph.
  // The loader only clears once a real frame has been submitted to a canvas
  // with usable dimensions.
  if (renderer && scene && camera) {
    const canvas = renderer.domElement;
    const drewSomething =
      canvas.width > 0 && canvas.height > 0 && Number.isFinite(camera.aspect);

    if (drewSomething) {
      // Render on demand. Auto-rotate and OrbitControls damping both raise
      // `needsRender` through the controls 'change' event, a camera tween and a
      // spin are explicit, and an active selection/hover keeps its pulse
      // animating — so the only frames skipped are the genuinely static ones.
      const selectionActive = !!(props.activeId || hoverRegion);
      const shouldRender =
        needsRender ||
        !firstFrameDone ||
        selectionActive ||
        camTween !== null ||
        spinTarget !== null;

      if (shouldRender) {
        try {
          renderer.render(scene, camera);
        } catch (err) {
          console.error('[HumanBody3D] first render failed', err);
          state.value = 'error';
          alive = false;
          return;
        }
        needsRender = false;

        if (!firstFrameDone) {
          firstFrameDone = true;
          state.value = 'ready';
          lastAnchorKey = '';
          anchorDirty = true;
          // Organs enrich an already-usable body; they never gate readiness.
          void loadAnatomyProgressive();
        }
      }
    } else if (!firstFrameDone) {
      // Never spin forever on a canvas that cannot draw.
      console.warn('[HumanBody3D] canvas has no drawable area', {
        width: canvas.width,
        height: canvas.height,
        aspect: camera.aspect,
      });
      state.value = 'error';
      alive = false;
      return;
    }
  }
}

watch(
  () => props.activeId,
  () => {
    applyDotVisuals();
    applyOrganVisuals();
    // Selecting an organ eases the camera onto it; clearing eases back out.
    focusOnSelection();
    anchorDirty = true;
    needsRender = true;
    syncAnchor();
  }
);

onMounted(() => {
  alive = true;
  lastT = performance.now();
  state.value = 'loading';
  initScene();
  // Start the loop even if initScene failed, so `animate` can observe the
  // error state consistently; a successful first frame flips state to ready.
  rafId = raf(animate);
});

onBeforeUnmount(() => {
  alive = false;
  caf(rafId);
  disposeScene();
  camera = null;
});

// A host that resizes its bottom controls must be able to re-frame.
watch(
  () => props.bottomInset,
  () => {
    if (state.value === 'ready') frameCamera(true);
  }
);
// Same for top controls (heading on narrow viewports).
watch(
  () => props.topInset,
  () => {
    if (state.value === 'ready') frameCamera(true);
  }
);
</script>

<style scoped lang="scss">
.human3d {
  position: relative;
  width: 100%;
  height: 100%;
  /* Full-bleed stage: no card, no rounded frame, no border, no ground plane,
     no photograph. The anatomy is the hero and the space is one continuous
     near-black void. */
  min-height: 420px;
  overflow: hidden;
  isolation: isolate;
  /* Layer 1 — the room. A completely black room, faintly cooler at the very
     top so the void has a direction without ever reading as a surface. */
  background-color: #020204;
  /*
   * Layers 2-5, painted front-to-back in CSS, so the FIRST entry is topmost:
   *
   *   4  GOLD CORE    a tiny warm centre, barely separable from the purple
   *   3  SECONDARY    a very subtle darker violet, to stop the purple reading
   *                   as a single flat wash
   *   2  PURPLE LIGHT the soft, enormous light behind the torso — the whole
   *                   point of the scene, so it must have no visible edge
   *   1  VOID         the near-black base
   *
   * Every falloff is long and ends in full transparency, which is what keeps the
   * glow from ever showing a circular boundary. Nothing here is bright, and
   * nothing is animated — this is a room with a light in it, not a lens flare.
   */
  background-image:
    /* 4. Tiny warm gold at the centre of the light, low and below the middle so
     *    it sits behind the sternum rather than behind the head. */
    radial-gradient(circle at 50% 54%, rgba(212, 175, 55, 0.12) 0%, rgba(100, 60, 160, 0) 32%),
    /* 3. Secondary violet, wide and very faint. */
    radial-gradient(64% 54% at 50% 50%, rgba(22, 13, 43, 0.4), rgba(22, 13, 43, 0) 78%),
    /* 2. The purple light behind the torso. */
    radial-gradient(circle at 50% 50%, rgba(109, 40, 217, 0.22) 0%, rgba(70, 35, 130, 0.1) 35%, rgba(10, 5, 25, 0) 72%),
    /* 1. Void. */
    linear-gradient(180deg, #0b0718 0%, #05050a 42%, #020204 100%);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center, center, center, center;
  touch-action: pan-y;
}

/* A very few tiny stars, placed off the figure so they never sit behind an
   organ. Calm, not a particle field. */
.human3d::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(1.4px 1.4px at 11% 17%, rgba(206, 190, 255, 0.55), transparent 100%),
    radial-gradient(1.1px 1.1px at 82% 12%, rgba(178, 158, 240, 0.45), transparent 100%),
    radial-gradient(1px 1px at 92% 62%, rgba(206, 190, 255, 0.4), transparent 100%),
    radial-gradient(1.2px 1.2px at 7% 71%, rgba(178, 158, 240, 0.4), transparent 100%),
    radial-gradient(1px 1px at 68% 6%, rgba(226, 214, 255, 0.35), transparent 100%),
    radial-gradient(1.3px 1.3px at 24% 91%, rgba(178, 158, 240, 0.34), transparent 100%);
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.human3d-stage {
  position: absolute;
  inset: 0;
}

.human3d-stage canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Subtle vignette keeps attention on the body without a visible frame. Centred on
   the same point as the purple light above so the two never disagree. */
.human3d::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    86% 74% at 50% 50%,
    transparent 42%,
    rgba(1, 1, 3, 0.66) 100%
  );
}

.human3d-toolbar {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 6;
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(9, 6, 22, 0.66);
  border: 1px solid rgba(146, 112, 224, 0.3);
  backdrop-filter: blur(10px);
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: calc(100% - 28px);
}

.human3d-tool {
  min-width: 40px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: rgba(226, 214, 255, 0.84);
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.human3d-tool--icon {
  min-width: 30px;
  padding: 6px 8px;
  display: grid;
  place-items: center;
}

.human3d-tool--toggle {
  color: rgba(206, 192, 246, 0.66);
}

.human3d-tool:hover {
  background: rgba(146, 112, 224, 0.2);
  color: #fff;
}

.human3d-tool.active {
  background: linear-gradient(135deg, #6d3be8, #32135a);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(169, 139, 255, 0.6);
}

.human3d-tool-sep {
  width: 1px;
  align-self: stretch;
  margin: 4px 2px;
  background: rgba(217, 184, 102, 0.34);
}

/* Left layer rail (Zygote-style): the same three layer toggles, stacked
   vertically down the left edge and centred against the figure. Opt in with
   `toolbar-position="left-rail"`. */
.human3d-toolbar--rail {
  top: 50%;
  right: auto;
  left: 16px;
  transform: translateY(-50%);
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  border-radius: 18px;
  padding: 6px;
  gap: 3px;
  max-width: none;
}

.human3d-toolbar--rail .human3d-tool {
  width: 100%;
  justify-content: flex-start;
  gap: 9px;
  border-radius: 13px;
  padding: 9px 13px;
}

.human3d-toolbar--rail .human3d-tool span {
  font-size: 0.76rem;
}

.human3d-toolbar--rail .human3d-tool--icon {
  justify-content: center;
}

.human3d-toolbar--rail .human3d-tool-sep {
  width: auto;
  height: 1px;
  align-self: stretch;
  margin: 3px 4px;
}

/* Narrow viewports: the rail would crowd the figure, so fold it back into the
   compact top-right pill (icon-only). */
@media (max-width: 1099px) {
  .human3d-toolbar--rail {
    top: 14px;
    left: auto;
    right: 14px;
    transform: none;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    border-radius: 999px;
    padding: 4px;
  }

  .human3d-toolbar--rail .human3d-tool {
    width: auto;
    border-radius: 999px;
    padding: 6px 10px;
  }

  .human3d-toolbar--rail .human3d-tool span {
    display: none;
  }

  .human3d-toolbar--rail .human3d-tool-sep {
    width: 1px;
    height: auto;
    align-self: stretch;
    margin: 4px 2px;
  }
}

/* Not var(--color-gold-strong): that token is the site-wide brand bronze
   (#8C6A24) and drew a brown ring. The page's own soft gold is used instead,
   matching the single focus-ring rule in BodyExplorer3D.vue. */
.human3d-tool:focus-visible {
  outline: 2px solid #F1D27A;
  outline-offset: 2px;
}

.human3d-credit {
  position: absolute;
  bottom: 12px;
  right: 14px;
  z-index: 5;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(9, 6, 22, 0.6);
  border: 1px solid rgba(146, 112, 224, 0.24);
  color: rgba(198, 184, 240, 0.6);
  font-size: 0.62rem;
  text-decoration: none;
  transition: color 160ms ease, border-color 160ms ease;
}

.human3d-credit:hover {
  color: #e2d6ff;
  border-color: rgba(146, 112, 224, 0.5);
}

/* ── Touch targets ────────────────────────────────────────────────────────────
   The toolbar pills and the model-credit link render ~25-30px tall, below a
   comfortable thumb target. Coarse pointers only, so the desktop composition of
   the 3D overlay is untouched. Declared last so it wins over the base rules. */
@media (pointer: coarse) {
  .human3d-tool {
    min-height: 44px;
    padding: 10px 14px;
  }

  .human3d-tool--icon {
    min-width: 44px;
    min-height: 44px;
    padding: 10px;
  }

  .human3d-credit {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 8px 14px;
  }
}

.human3d-hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  margin: 0;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(9, 6, 22, 0.6);
  border: 1px solid rgba(146, 112, 224, 0.26);
  color: rgba(206, 192, 246, 0.76);
  font-size: 0.72rem;
  white-space: nowrap;
  pointer-events: none;
}

/* Non-blocking organ progress. The body is already interactive underneath.
   Anchored above whatever bar the host puts along the bottom edge
   (--bx-organs-h), so it can never land on top of the host's controls. */
.human3d-preparing {
  position: absolute;
  bottom: calc(var(--bx-organs-h, 56px) + 26px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  margin: 0;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(9, 6, 22, 0.62);
  border: 1px solid rgba(146, 112, 224, 0.24);
  color: rgba(206, 192, 246, 0.72);
  font-size: 0.68rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  pointer-events: none;
}

.human3d-retry {
  margin-top: 4px;
  padding: 9px 20px;
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(146, 112, 224, 0.5);
  background: rgba(58, 36, 116, 0.6);
  color: #efe8ff;
  font: inherit;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
}

.human3d-retry:hover {
  background: rgba(78, 48, 152, 0.75);
  border-color: rgba(178, 148, 255, 0.75);
}

.human3d-retry:focus-visible {
  outline: 2px solid #b294ff;
  outline-offset: 2px;
}

.human3d-status {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(206, 192, 246, 0.82);
  font-size: 0.9rem;
  text-align: center;
  padding: 24px;
}

.human3d-status--error {
  color: rgba(206, 192, 246, 0.7);
}

.human3d-spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid rgba(146, 112, 224, 0.3);
  border-top-color: #b294ff;
  animation: h3d-spin 0.8s linear infinite;
}

@keyframes h3d-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .human3d {
    min-height: 380px;
  }

  .human3d-toolbar {
    top: 10px;
    right: 10px;
    max-width: calc(100% - 20px);
  }

  .human3d-hint {
    font-size: 0.66rem;
    white-space: normal;
    max-width: calc(100% - 24px);
  }
}
</style>
