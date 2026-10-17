/**
 * Source and asset contract for the /body architecture.
 *
 * These assertions are deliberately about *source text and asset bytes*, not
 * about rendering. jsdom cannot create a WebGL context, so nothing here (or in
 * BodyExplorer.interaction.test.ts) proves that pixels reach the screen.
 * Visual and interactive verification requires a real browser.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src/components/body/HumanBody3D.vue');
const PAGE = resolve(process.cwd(), 'src/views/public/BodyExplorer3D.vue');
const GLB = resolve(process.cwd(), 'public/models/orkod/orkod-human-body.0db6962c.glb');
const MODELS = resolve(process.cwd(), 'public/models');

const src = readFileSync(SRC, 'utf8');
const page = readFileSync(PAGE, 'utf8');

/**
 * Strips comments so colour assertions test live code, not documentation.
 *
 * These files deliberately name the retired values in their comments (e.g.
 * "`--color-gold-strong` is the brand bronze", "intestines was `#86b96b`") so the
 * next reader knows what was replaced and why. Asserting against the raw source
 * would fail on that explanation, which is the opposite of what a regression
 * guard should do.
 */
function stripComments(text: string): string {
  return text
    // HTML comments (used in the non-scoped <style> block's prose)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // C-style block comments
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    // Line comments, skipping the `://` in a URL
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** The same file with comments removed — the surface colour rules apply to. */
const srcCode = stripComments(src);
const pageCode = stripComments(page);

/** Decodes the shipped GLB's JSON chunk. */
function glbJson(path: string) {
  const buf = readFileSync(path);
  expect(buf.readUInt32LE(0), 'GLB magic').toBe(0x46546c67);
  expect(buf.readUInt32LE(4), 'GLB version').toBe(2);
  expect(buf.readUInt32LE(8), 'GLB declared length').toBe(buf.length);
  const jsonLen = buf.readUInt32LE(12);
  return {
    bytes: buf.length,
    json: JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8')),
  };
}

describe('body shell architecture', () => {
  it('loads the human body GLB and nothing else', () => {
    expect(src).toContain('GLTFLoader');
    expect(src).toMatch(/\/models\/orkod\/orkod-human-body\.[0-9a-f]{8}\.glb/);
    expect(src).toContain('loadBodyShell');
  });

  it('has removed every previous body implementation', () => {
    const forbidden = [
      // procedural mannequin
      'createMannequin',
      'CapsuleGeometry',
      'MANNEQUIN_OPACITY',
      // the retired civilian shell, its clothing and its sanitising hooks
      'orkod-civilian-body',
      'OxiHuman',
      'Quaternius',
      'human.glb',
      'shellMat',
      // the retired photo backdrop
      'hubble',
      'Hubble',
      // genital filtering, masking and debug hooks
      'helper-genital',
      'isGenital',
      'suppressGenital',
      'privacyMesh',
      'privacyPlane',
      '__orkodDebugSkinRegion',
      'sanitize-skin',
    ];
    for (const token of forbidden) {
      expect(src, `found forbidden token "${token}"`).not.toContain(token);
    }
  });

  it('never builds or renders the BodyParts3D skin region', () => {
    // The skin region is filtered out before any buffer is parsed.
    expect(src).toMatch(/filter\(\(p\) => p\.region !== 'skin'\)/);
    // And no code path adds a 'body' layer mesh.
    expect(src).not.toMatch(/buildScene\([^)]*'body'/);
    expect(src).not.toMatch(/'body:skin'/);
  });

  it('keeps a single external shell, translucent with its own materials', () => {
    // The primitive keeps its original colour and has a translucent variant
    // made the same way, so the body stays recognisable while the organs read
    // through it. The material is preserved, not flattened to a single tint.
    expect(src).toMatch(/function makeTranslucent\(mat: THREE\.Material\)/);
    expect(src).toMatch(/createdMaterials\.push\(tm\)/);
    expect(src).toMatch(/mesh\.material = newMaterials\.length === 1 \? newMaterials\[0\] : newMaterials/);
    expect(src).toMatch(/materialCount = createdMaterials\.length/);
    // The shell must never occlude the organs.
    expect(src).toMatch(/depthWrite: false/);
    // Transparent enough for the organs to be the subject but solid enough for
    // the figure to read as a person: 0.55.
    const opacity = src.match(/const BODY_SHELL_OPACITY = ([\d.]+)/);
    expect(opacity, 'BODY_SHELL_OPACITY is declared').not.toBeNull();
    const value = Number(opacity![1]);
    expect(value).toBeGreaterThanOrEqual(0.1);
    expect(value).toBeLessThanOrEqual(0.9);
    // No expensive PBR stack: no transmission, no clearcoat, no IBL, no
    // post-processing. Just matte and translucent.
    const mat = src.slice(src.indexOf('function makeTranslucent'));
    expect(mat.slice(0, 900)).not.toMatch(/transmission|clearcoat|envMap|ior|iridescence/);
    expect(src).not.toMatch(/EffectComposer|RenderPass|UnrealBloomPass/);
  });

  it('colours the shell from a named pearl constant, not a purple albedo', () => {
    expect(srcCode).toMatch(/const SHELL_COLOR = 0xded9e8;/);
    expect(srcCode).toMatch(/const SHELL_EMISSIVE = 0x241a3d;/);
    // The shell is a flat cool-pearl surface. The sculpted relief comes from the
    // normal map; the muscle base-colour map is deliberately not carried on the
    // shell, because multiplied through at shell opacity it read as a dim,
    // muddy maroon mass rather than skin or glass.
    expect(srcCode).toMatch(/color: new THREE\.Color\(SHELL_COLOR\)/);
    const matFn = srcCode.slice(srcCode.indexOf('function makeTranslucent'));
    expect(matFn.slice(0, 900)).not.toMatch(/map:\s*base\.map/);
    expect(srcCode).toMatch(/emissive: new THREE\.Color\(SHELL_EMISSIVE\)/);
    // The old saturated lavender albedo must not creep back in.
    expect(srcCode).not.toMatch(/color:\s*0xb9a7e8/i);
  });

  it('gates ready on a real render, not a timeout or object creation', () => {
    // Exactly one transition into ready, and it sits next to firstFrameDone.
    const readyHits = src.match(/state\.value = 'ready'/g) ?? [];
    expect(readyHits).toHaveLength(1);
    expect(src).toMatch(/firstFrameDone = true;[\s\S]{0,120}state\.value = 'ready'/);
    // The render call must happen in the same guarded block.
    expect(src).toMatch(/renderer\.render\(scene, camera\)/);
    // No timer is used as the readiness mechanism.
    expect(src).not.toMatch(/setTimeout\([^)]*8000/);
    expect(src).not.toMatch(/state\.value = 'ready';\s*\}\s*,\s*8000/);
  });

  it('has an honest error state with a working retry', () => {
    expect(src).toMatch(/state\.value = 'error'/);
    expect(src).toMatch(/function retry\(\)/);
    expect(src).toMatch(/@click="retry"/);
    // Retry must stop the running loop before rebuilding, or an orphaned
    // animation loop keeps rescheduling against a disposed renderer.
    expect(src).toMatch(/function retry\(\)[\s\S]{0,320}caf\(rafId\)/);
  });

  it('loads organs progressively, critical first, and never blocks the body', () => {
    expect(src).toMatch(/critical = \['heart', 'lungs', 'liver', 'brain'\]/);
    // One organ per scheduled tick, yielding between each.
    expect(src).toMatch(/const step = \(\) => \{/);
    expect(src).toMatch(/buildScene\(geometries, 'organs', \[region\]\)/);
    expect(src).toMatch(/raf\(step\)/);
    // Organs must not be part of the readiness path.
    expect(src).toMatch(/void loadAnatomyProgressive\(\)/);
    // A failed organ must not abort the rest, nor un-ready the body.
    expect(src).toMatch(/organ "\$\{region\}" failed to build/);
    expect(src).toMatch(/body shell remains usable/);
  });

  it('keeps the body shell out of the raycast target set', () => {
    expect(src).toMatch(/function refreshPickTargets\(\)/);
    // Only organs and landmark dots are ever added as pick targets.
    const body = src.slice(src.indexOf('function refreshPickTargets'));
    const fn = body.slice(0, body.indexOf('\n}'));
    expect(fn).toContain('organs');
    expect(fn).toContain('dots');
    expect(fn).not.toContain('bodyShell');
    // Stable array, no per-pointermove allocation.
    expect(src).toMatch(/pickTargets\.length = 0/);
    expect(src).toMatch(/ndcScratch = new THREE\.Vector2\(\)/);
    expect(src).not.toMatch(/new THREE\.Vector2\(\s*\n?\s*\(\(e\.clientX/);
  });

  it('keeps the matrixWorld callout anchoring', () => {
    expect(src).toMatch(/applyMatrix4\(organ\.mesh\.matrixWorld\)/);
  });

  it('frames the camera from the loaded body bounds, not hardcoded numbers', () => {
    expect(src).toMatch(/new THREE\.Box3\(\)\.setFromObject\(shell\)/);
    expect(src).toMatch(/bodyBounds\.getSize/);
    expect(src).toMatch(/bodyBounds\.getCenter/);
    expect(src).toMatch(/2 \* Math\.atan\(Math\.tan\(vFov \/ 2\) \* Math\.max\(0\.1, camera\.aspect\)\)/);
    // The margin is a named constant that check-framing.mjs mirrors.
    expect(src).toMatch(/const FRAME_MARGIN = ([\d.]+)/);
    expect(src).toMatch(/const margin = FRAME_MARGIN;/);
    // No hardcoded camera coordinates for any previous body may remain.
    expect(src).not.toMatch(/controls\.target\.set\(0, 0\.87, 0\)/);
    expect(src).not.toMatch(/camera\?\.position\.set\(0, 0\.92, 2\.5\)/);
  });

  it('records the shell cost it publishes', () => {
    expect(src).toMatch(/bodyStats = \{ meshes, triangles, vertices, materials: materialCount \}/);
    expect(src).toMatch(/reportPerformance\(\)/);
    expect(src).toMatch(/organs \$\{organTriangles\} tris/);
    expect(src).toMatch(/raycast targets \$\{pickTargets\.length\} meshes/);
    // The published figures must be accumulated from the scene rather than read
    // from renderer.info.render, which is a last-render snapshot and previously
    // under-reported the page by the ~20 landmark markers it had not yet built.
    expect(src).toMatch(/scene \$\{drawObjects\} visible drawables/);
    expect(src).toMatch(/scene\.traverse\(\(obj\) =>/);
    expect(src).toMatch(/renderer last frame: \$\{renderer\.info\.render\.calls\} calls/);
  });

  it('does not draw invisible landmark glows in the steady state', () => {
    // ~20 additively-blended glow quads at 10% alpha cost 20 draw calls a frame
    // to render something that could not be seen. They are toggled with
    // `visible`, so they cost nothing until hover or selection.
    expect(srcCode).toMatch(/dot\.sprite\.visible = false/);
    expect(srcCode).toMatch(/dot\.sprite\.visible = true/);
    expect(srcCode).toMatch(/\(obj as THREE\.Sprite\)\.isSprite/);
  });
});

describe('shipped assets', () => {
  it('ships exactly one body GLB, the Grab3D CC0 male muscle figure', () => {
    expect(existsSync(GLB)).toBe(true);
    const { bytes, json } = glbJson(GLB);

    // The full-quality 601k-triangle sculpt, Meshopt-compressed for transport:
    // 23.7 MB -> 9.0 MB. The triangles and vertices are unchanged; only the
    // buffer encoding differs (lossless for the rendered result).
    expect(statSync(GLB).size).toBe(bytes);
    expect(bytes).toBeGreaterThan(8_000_000);
    expect(bytes).toBeLessThan(12_000_000);

    // Static and unrigged: no skeleton and no animation. Geometry is Meshopt-
    // compressed, so the loader MUST install the Meshopt decoder — and still
    // must not fall back to a Draco decoder.
    expect(json.skins).toBeUndefined();
    expect(json.animations).toBeUndefined();
    expect(json.extensionsUsed).toContain('EXT_meshopt_compression');
    expect(src).toMatch(/setMeshoptDecoder\(MeshoptDecoder\)/);
    // The body loader must not pull in a Draco decoder, even though the repo
    // still ships one for other assets.
    expect(src).not.toMatch(/DRACOLoader|draco_decoder|setDecoderPath/);

    // Anatomical detail is preserved: it ships its muscle textures (base colour,
    // normal and metallic-roughness) rather than a flat untextured solid.
    expect(Array.isArray(json.images)).toBe(true);
    expect(json.images.length).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(json.textures)).toBe(true);
    expect(json.textures.length).toBeGreaterThanOrEqual(2);

    // 323,048 vertices on a single merged primitive in one material group.
    let triangles = 0;
    let vertices = 0;
    for (const mesh of json.meshes) {
      for (const prim of mesh.primitives) {
        expect(prim.mode).toBe(4); // TRIANGLES
        expect(prim.attributes.NORMAL).toBeDefined(); // shaded from real normals
        const acc = json.accessors[prim.indices ?? prim.attributes.POSITION];
        triangles += acc.count / 3;
        vertices += json.accessors[prim.attributes.POSITION].count;
      }
    }
    expect(vertices).toBe(323048);
    expect(triangles).toBe(601188);
    expect(json.materials.length).toBe(1);
  });

  it('does not ship the retired body assets', () => {
    expect(existsSync(resolve(MODELS, 'orkod-civilian-body.glb'))).toBe(false);
    expect(existsSync(resolve(MODELS, '../assets/space/hubble-ultra-deep-field.jpg'))).toBe(false);
  });

  it('documents the body asset provenance', () => {
    const doc = readFileSync(resolve(MODELS, 'ORKOD-ASSETS.md'), 'utf8');
    expect(doc).toContain('Grab3D');
    expect(doc).toContain('CC0');
    expect(doc).not.toContain('Low Poly Civilian');
    expect(doc).not.toContain('3DAssets.dev');
    expect(doc).toContain('601,188');
    expect(doc).toContain('0DB6962C607C96CBDDFAA90DE957BA826178E0A7D224E8C34CA6B985B68417D4');
    // CC0 asks for no attribution, but the record still states the provenance.
    expect(doc).toMatch(/public domain|no attribution/i);
  });
});

describe('full-screen dark stage', () => {
  it('is full-bleed with no card, border or platform', () => {
    expect(page).toMatch(/\.bx-stage\s*\{[^}]*width:\s*100%/);
    expect(page).not.toMatch(/\.bx-stage\s*\{[^}]*border-radius/);
    expect(page).not.toMatch(/\.bx-stage\s*\{[^}]*box-shadow/);
    // The component shell likewise has no decorative frame.
    const shell = src.slice(src.indexOf('.human3d {'));
    expect(shell.slice(0, 900)).not.toMatch(/border-radius:\s*22px/);
    expect(shell.slice(0, 900)).not.toMatch(/box-shadow:/);
    // The page owns the whole viewport and never scrolls or clips sideways.
    expect(page).toMatch(/height:\s*calc\(100svh - var\(--bx-chrome-top/);
    expect(page).toMatch(/\.bx-page\s*\{[^}]*overflow:\s*hidden/);
  });

  it('is near-black with a soft purple centre glow and no photograph', () => {
    // Near-black base on the stage component itself.
    expect(src).toMatch(/background-color:\s*#020204/);
    // The stage paints the room in four layers - the void, a violet wash, a
    // purple glow and a tiny gold core - and the page pulls the same room from
    // the global dark theme tokens. The gold core sits just below centre
    // (50% 54%), where the pelvis takes the eye, exactly as specified.
    expect(src).toMatch(/radial-gradient\(circle at 50% 54%, rgba\(212, 175, 55, 0\.12\) 0%, rgba\(100, 60, 160, 0\) 32%\)/);
    expect(src).toMatch(/radial-gradient\(circle at 50% 50%, rgba\(109, 40, 217, 0\.22\) 0%, rgba\(70, 35, 130, 0\.1\) 35%, rgba\(10, 5, 25, 0\) 72%\)/);
    expect(src).toMatch(/linear-gradient\(180deg, #0b0718 0%, #05050a 42%, #020204 100%\)/);
    expect(page).toMatch(/background-color:\s*var\(--color-purple-deepest\)/);
    for (const role of ['--gradient-body-gold-core', '--gradient-body-violet', '--gradient-body-purple', '--gradient-body-void']) {
      expect(page, `page does not paint the ${role} layer`).toMatch(new RegExp(`var\\(${role}\\)`));
    }
    // A secondary violet under the gold core, per the layered spec.
    expect(page).toMatch(/rgba\(50, 19, 90/);
    // No photograph, no giant star image, no neon/HUD styling.
    expect(page).not.toMatch(/url\(/);
    expect(src).not.toMatch(/url\(/);
  });

  it('is black + purple + gold and contains no green and no brown', () => {
    // This is the regression guard for "the page must not look green / brown".
    //
    // Global tokens are deliberately NOT changed: $color-gold-strong and
    // $color-turquoise are the site-wide brand bronze and Vuetify's primary is
    // the same colour, all used by every other route. The body page therefore
    // carries its own palette and must not reach for any of them.
    //
    // Asserted against the comment-stripped source, so the prose that explains
    // *why* these are avoided is not itself a failure.
    const brownGlobals = /var\(--color-gold-strong\)|var\(--color-turquoise\)|#8C6A24/i;
    expect(pageCode, 'page uses a global bronze token').not.toMatch(brownGlobals);
    expect(srcCode, 'component uses a global bronze token').not.toMatch(brownGlobals);
    // Nor the cream page background the shell used to sit on.
    expect(pageCode).not.toMatch(/var\(--color-background\)/);
    expect(pageCode).not.toMatch(/#faf6ef/i);

    // Vuetify's brown `primary` must not be used on this page.
    expect(pageCode).not.toMatch(/color="primary"/);
    expect(srcCode).not.toMatch(/color="primary"/);

    // The palette is authored once in the global dark-theme tokens; the page
    // pulls those tokens in, and the tokens themselves are black/purple/gold.
    const tokens = readFileSync(resolve(process.cwd(), 'src/styles/_tokens.scss'), 'utf8');
    const tokenCode = stripComments(tokens);
    expect(tokenCode).toMatch(/\$color-purple-deepest:\s*#170B2B;/);
    expect(tokenCode).toMatch(/\$gradient-body-void:\s*linear-gradient\(180deg, #0B0718 0%, #05050A 42%, #020204 100%\);/);
    expect(tokenCode).toMatch(/\$gradient-body-purple:\s*radial-gradient\(circle at 50% 50%, rgba\(109,40,217,0\.22\)/);
    expect(tokenCode).toMatch(/\$gradient-body-gold-core:\s*radial-gradient\(circle at 50% 54%, rgba\(212,175,55,0\.12\)/);
    expect(tokenCode).toMatch(/\$gradient-body-violet:\s*radial-gradient\(64% 54% at 50% 50%, rgba\(22,13,43,0\.40\)/);
    // The gold focus ring is a page-level override to the global bronze ring.
    expect(page).toMatch(/\.bx-page \*:focus-visible\s*\{[^}]*outline:\s*2px solid #F1D27A/);

    // No green or lime literal anywhere in the body page's styling. The global
    // token file also defines a site-wide success green (`$color-success`),
    // which is fine — the page must simply never use it.
    const greenLiteral =
      /\b(green|lime|emerald|teal)\b|#0f0\b|#00ff|#4ade80|#22c55e|#16a34a|0f0\b|52,\s*211|34,\s*197|16,\s*185/i;
    expect(pageCode, 'page styling contains green').not.toMatch(greenLiteral);
    expect(srcCode, 'component styling contains green').not.toMatch(greenLiteral);
    // The four gradients that actually paint the room carry no green: the
    // gradient tokens above are each pinned to their exact black/purple/gold
    // values, and none of them references the success color.
    expect(tokenCode).not.toMatch(/\$gradient-body-\w+:[^;]*$color-success/);

    // The shell is a light neutral pearl, not a purple or green albedo. A
    // saturated colour here is what stopped the silhouette reading as a human.
    expect(srcCode).toMatch(/const SHELL_COLOR = 0x([0-9a-f]{6});/);
    const shellHex = srcCode.match(/const SHELL_COLOR = 0x([0-9a-f]{6});/)![1];
    const sr = parseInt(shellHex.slice(0, 2), 16);
    const sg = parseInt(shellHex.slice(2, 4), 16);
    const sb = parseInt(shellHex.slice(4, 6), 16);
    // Light: clearly a pearl, not a dark tint.
    expect(Math.min(sr, sg, sb)).toBeGreaterThan(190);
    // Near-neutral: no channel dominates, so it is white with a hint of lavender
    // rather than a coloured body.
    expect(Math.max(sr, sg, sb) - Math.min(sr, sg, sb)).toBeLessThan(30);
  });

  it('keeps the organ palette medical and free of green and brown', () => {
    const anatomyRaw = readFileSync(resolve(process.cwd(), 'src/data/anatomy.ts'), 'utf8');
    const anatomy = stripComments(anatomyRaw);

    // The intestines were grass green and turned the stage green; the liver was
    // a rust brown. Both are corrected. See ORKOD-ASSETS.md.
    expect(anatomy, 'intestines are still green').not.toMatch(/#86b96b/i);
    expect(anatomy, 'liver is still brown').not.toMatch(/#7d3a24/i);
    // The skeleton toggle layer was cream over the whole figure.
    expect(anatomy, 'skeleton is still cream').not.toMatch(/skeleton:\s*0xcfc4a8/i);
    expect(anatomy).toMatch(/skeleton:\s*0xd6d0e4/i);

    // Every organ colour must be unambiguous about its hue family: no organ may
    // land in the green band or the muddy brown band.
    const greens = /^#[0-9a-f]{6}$/i;
    for (const m of anatomy.matchAll(/color: '(#[0-9a-f]{6})'/gi)) {
      const hex = m[1];
      expect(hex).toMatch(greens);
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      // Green-dominant means g is the largest channel by a clear margin.
      expect(
        g <= Math.max(r, b) + 6,
        `organ colour ${hex} reads green (r${r} g${g} b${b})`
      ).toBe(true);
      // Muddy brown: all three channels low-mid and very close together, which
      // is what made the liver and the buttons look like brown.
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      expect(
        !(spread <= 40 && Math.max(r, g, b) < 160),
        `organ colour ${hex} reads brown (r${r} g${g} b${b})`
      ).toBe(true);
    }
  });

  it('keeps the ivory page shell and brown footer off the stage route', () => {
    // /body is a true full-bleed stage: the app shell is black and the warm brown
    // footer is suppressed, so no cream or brown sits around the canvas.
    const router = readFileSync(resolve(process.cwd(), 'src/router.ts'), 'utf8');
    expect(router).toMatch(/stage:\s*true/);

    const app = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');
    expect(app).toMatch(/route\.meta\.stage === true/);
    expect(app).toMatch(/v-application\.app-stage/);
    expect(app).toMatch(/showPublicChrome && !isStageRoute/);

    // The header recolours itself on stage routes rather than sitting on the
    // void as a white bar with bronze links.
    const header = readFileSync(resolve(process.cwd(), 'src/components/layout/PublicHeader.vue'), 'utf8');
    expect(header).toMatch(/public-header--stage/);
    expect(header).toMatch(/route\.meta\.stage === true/);
  });
});