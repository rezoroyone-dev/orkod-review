import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

/**
 * Child-safety regression guard.
 *
 * Orkod is used by minors and by people in a health context, so no surface of
 * the site may render an unclothed human body or expose external genitalia.
 *
 * A photographic nude body render (`@/assets/body/body-front.png` and its
 * unused sibling `body-back.png`) was previously used as the backdrop for the
 * interactive body map on /symptoms. It was removed and replaced by a clothed
 * vector silhouette (`@/components/body/BodySilhouette.vue`).
 *
 * A second offender was found while auditing the whole site: a stock photograph
 * of a nude male figure (`@/assets/images/landing/homme_perpel.png`, imported by
 * the in-progress `@/components/home/ProgramsSection.vue`). An automated
 * nude-content detector flagged exposed buttocks at high confidence. It was
 * deleted and the program cards now use a deliberate gradient-and-icon
 * composition, so no stock human photography remains on that surface.
 *
 * These assertions exist so neither asset can be reintroduced by the same code
 * path: restored as a file, re-imported by a component, or reintroduced as a
 * stale build artefact that a service worker keeps serving.
 *
 * See public/models/ORKOD-ASSETS.md for the licence record of the 3D shell.
 */

const ROOT = process.cwd();
const SRC = resolve(ROOT, 'src');
const ASSETS = resolve(SRC, 'assets');
const DIST = resolve(ROOT, 'dist');
const VOLUMES = resolve(ROOT, '..', 'volumes', 'sites', 'phealing');

/** Files that must never exist anywhere in the project. */
const FORBIDDEN_FILES = [
  'body-front.png',
  'body-back.png',
  'skin-preview.png',
  'skin-pelvis.png',
  'homme_perpel.png',
  'homme_perpel.webp',
];

/** Whole-project root scanned for forbidden files / references. */
function findProjectRoot(start: string): string {
  let dir = resolve(start);
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, '.git')) || existsSync(join(dir, 'docker-compose.yml'))) return dir;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  // No repo marker above the working dir (e.g. the frontend mounted alone in a
  // container): fall back to the working dir rather than walking the fs root.
  return resolve(start);
}
const PROJECT = findProjectRoot(ROOT);

/**
 * Substrings that must never appear in any served file.
 *
 * Matched precisely: `assets/body/` (with the slash) so that the legitimate
 * `assets/body-regions-*.js` chunk - which holds src/data/body-regions.ts - is
 * not mistaken for a reference to the removed renders.
 */
const FORBIDDEN_REFS = ['body-front', 'body-back', 'assets/body/', 'homme_perpel'];

/** This guard necessarily names the forbidden files, so it skips itself. */
const SELF = 'moderation.safety.test.ts';

function stripComments(src: string): string {
  return src
    // HTML comments (the component documents itself in prose)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // C-style block comments
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    // Line comments, skipping the `://` inside a URL
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      // Entries can vanish mid-walk (procfs, fds) on some hosts; skip them.
      continue;
    }
    if (s.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const rel = (p: string) => p.replace(/\\/g, '/');

describe('moderation: no unclothed human body is shipped', () => {
  it('the removed nude renders do not exist in the source tree', () => {
    for (const f of FORBIDDEN_FILES) {
      expect(
        existsSync(resolve(ASSETS, 'body', f)),
        `${f} was restored under src/assets/body and must not come back`
      ).toBe(false);
      expect(
        existsSync(resolve(ASSETS, f)),
        `${f} was restored directly under src/assets and must not come back`
      ).toBe(false);
    }
    // The whole directory existed only to hold those two files.
    expect(
      existsSync(resolve(ASSETS, 'body')),
      'src/assets/body existed only for the removed renders'
    ).toBe(false);
  });

  it('the removed nude renders do not exist as stale build artefacts', () => {
    // A leftover file in dist/ or in the deployed volume is still downloadable
    // by URL even after every reference is gone, so it must not survive.
    for (const dir of [DIST, VOLUMES]) {
      for (const f of walk(dir)) {
        const name = f.split(/[\\/]/).pop() ?? '';
        for (const bad of FORBIDDEN_FILES) {
          expect(
            !name.startsWith(bad.replace(/\.png$/, '')),
            `stale build artefact still present: ${rel(f)}`
          ).toBe(true);
        }
      }
    }
  });

  it('the removed nude renders do not exist anywhere in the project', () => {
    // The two body renders and the BodyParts3D skin/genital QA previews must be
    // gone from every corner of the working tree, not just from the folders the
    // app happens to serve. build configs, tests and docs are legitimate
    // exceptions because they name the files in order to forbid them.
    const allow = ['moderation.safety.test.ts', 'ORKOD-ASSETS.md'];
    for (const f of walk(PROJECT)) {
      const name = f.split(/[\\/]/).pop() ?? '';
      if (allow.includes(name)) continue;
      for (const bad of FORBIDDEN_FILES) {
        expect(
          name,
          `nude artefact is still on disk: ${rel(f)}`
        ).not.toBe(bad);
      }
    }
  });

  it('no source file references the removed renders', () => {
    for (const f of walk(SRC)) {
      if (f.endsWith(SELF)) continue;
      if (!['.vue', '.ts', '.js', '.scss', '.css', '.json', '.html'].includes(extname(f))) continue;
      const text = readFileSync(f, 'utf8');
      for (const ref of FORBIDDEN_REFS) {
        expect(
          text.toLowerCase(),
          `${rel(f)} references "${ref}", which would restore the removed render`
        ).not.toContain(ref);
      }
    }
  });

  it('no built bundle still references the removed renders', () => {
    for (const dir of [DIST, VOLUMES]) {
      for (const f of walk(dir)) {
        if (!['.js', '.html', '.json', '.webmanifest'].includes(extname(f))) continue;
        const text = readFileSync(f, 'utf8').toLowerCase();
        for (const ref of FORBIDDEN_REFS) {
          expect(
            text,
            `built artefact ${rel(f)} still references "${ref}"`
          ).not.toContain(ref);
        }
      }
    }
  });

  it('no served bundle still references the removed renders', () => {
    for (const f of walk(DIST)) {
      if (!['.js', '.html', '.json', '.webmanifest'].includes(extname(f))) continue;
      const text = readFileSync(f, 'utf8').toLowerCase();
      for (const ref of FORBIDDEN_REFS) {
        expect(text, `served file ${rel(f)} still references "${ref}"`).not.toContain(ref);
      }
    }
  });

  it('/symptoms renders the clothed vector silhouette, not a photograph', () => {
    const page = readFileSync(resolve(SRC, 'views', 'public', 'SymptomsPage.vue'), 'utf8');
    expect(page).toContain("import BodySilhouette from '@/components/body/BodySilhouette.vue'");
    expect(page).toContain('<BodySilhouette />');
    // The old photographic backdrop must not reappear as an <img>.
    expect(page).not.toMatch(/<img[^>]*:\s*src=/);
  });

  it('the silhouette is clothed and covers the hip line by construction', () => {
    const raw = readFileSync(resolve(SRC, 'components', 'body', 'BodySilhouette.vue'), 'utf8');
    // Comments are stripped first: the component explains in prose why it
    // replaces the nude render, and that prose is not a rendering surface.
    const sil = stripComments(raw);
    // A vector figure cannot expose anatomy: there is nothing anatomical in it.
    expect(sil).not.toMatch(/penis|genital|vulva|testic|scrotum|breast|nipple|nude/i);
    // The clothing layer must exist as its own drawn shape, not as shading.
    expect(sil).toContain('body-silhouette__cloth');

    // Structural guarantee: the cloth geometry must cover the torso AND the
    // upper thighs, so no bare skin is left at or below the hip line.
    // The zone map puts the abdomen at cy 432 and the hips below it; the tunic
    // has to start above the shoulders and extend past the upper thigh.
    const clothBlock = /<g class="body-silhouette__cloth"[\s\S]*?<\/g>/.exec(sil)?.[0];
    expect(clothBlock, 'no clothing geometry is drawn').toBeTruthy();
    const ys = [...(clothBlock ?? '').matchAll(/d="([^"]+)"/g)];
    expect(ys.length, 'no clothing path is drawn').toBeGreaterThan(0);
    // Path commands carry x and y pairs; the vertical extent of the clothing
    // must reach from above the shoulders (y < 250) to below the hip line
    // (y > 540), which is what leaves no bare pelvis.
    const pairs = [...(clothBlock ?? '').matchAll(/[MLCHVZmlchvz]|\d+(?:\.\d+)?/g)].map((m) => m[0]);
    const nums: number[] = [];
    for (const tok of pairs) {
      const n = Number(tok);
      if (!Number.isNaN(n)) nums.push(n);
    }
    const maxY = Math.max(...nums);
    const minY = Math.min(...nums);
    expect(minY, 'clothing does not reach the upper body').toBeLessThan(250);
    expect(maxY, 'clothing stops at or above the hip line, leaving the pelvis bare').toBeGreaterThan(540);
    // Head, torso, arms and legs must all still be drawn: the figure is a complete
    // human, not an abstract blob. Hands and feet are the tapered ends of the arm
    // and leg paths, so completeness is asserted from the vertical extent too.
    for (const part of ['head', 'neck', 'torso', 'arm', 'leg']) {
      expect(sil, `silhouette is missing the ${part}`).toContain(`data-part="${part}"`);
    }
    // Both sides are present: the mirrored copies carry the same marker.
    expect([...sil.matchAll(/data-part="(arm|leg)"/g)].length, 'a limb is not mirrored').toBe(4);

    // The figure must span the full canvas: crown of the head near the top and
    // the feet near the bottom, so nothing has been cropped away.
    const skinBlock = /<g class="body-silhouette__skin"[\s\S]*?<\/g>\s*<\/g>/.exec(sil)?.[0] ?? '';
    const skinNums = [...skinBlock.matchAll(/-?\d+(?:\.\d+)?/g)]
      .filter((m) => m.index !== undefined)
      .map((m) => Number(m[0]));
    expect(Math.max(...skinNums), 'the figure does not reach down to the feet').toBeGreaterThan(950);
    expect(Math.min(...skinNums), 'the figure has no head').toBeLessThan(60);
  });

  it('the only 3D body shell the app loads is the licence-cleared GLB', () => {
    const modelRefs: string[] = [];
    for (const f of walk(SRC)) {
      if (!['.vue', '.ts'].includes(extname(f))) continue;
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(/['"`]([^'"`\s]*\/models\/[^'"`\s]*?\.(?:glb|gltf|fbx|obj))['"`]/gi)) {
        modelRefs.push(m[1]);
      }
    }
    expect(modelRefs.length, 'no 3D model is referenced at all, which is suspicious').toBeGreaterThan(0);
    const unique = [...new Set(modelRefs)];
    // Exactly one body shell: the Mandrake CC BY 4.0 male body. The trailing
    // hash is a content fingerprint so a rebuilt shell busts the service-worker
    // cache instead of being pinned forever.
    expect(
      unique.some((r) => /orkod\/orkod-human-body\.[0-9a-f]{8}\.glb/.test(r)),
      'the live body shell is not referenced'
    ).toBe(true);
    for (const ref of unique) {
      expect(
        ref,
        `an unexpected 3D asset is referenced: ${ref}`
      ).toMatch(/\/models\/(orkod\/orkod-human-body\.[0-9a-f]{8}\.glb|anatomy\/)/);
    }
  });

  it('the anatomy bundle skin region is never built or drawn', () => {
    // BodyParts3D ships a skin region. It is data at rest only: it must be
    // filtered out before anything is constructed, so it can never be rendered
    // as a second, unclothed body surface.
    const comp = readFileSync(resolve(SRC, 'components', 'body', 'HumanBody3D.vue'), 'utf8');
    expect(comp).toMatch(/filter\(\s*\(\s*p\s*\)\s*=>\s*p\.region\s*!==\s*'skin'\s*\)/);
    // The genitals filtering helpers must stay absent.
    for (const helper of ['isGenital', 'suppressGenital', 'helper-genital']) {
      expect(comp, `${helper} was reintroduced into the 3D component`).not.toContain(helper);
    }
  });
});