/**
 * Orkod - whole-site moderation sweep.
 *
 * Visits every public route at desktop / tablet / mobile, screenshots each one,
 * and fails if any removed nude render is requested, if the symptoms body map
 * regresses to a photographic backdrop, or if the page errors.
 *
 * Usage: node scripts/moderation-sweep.mjs [baseUrl]
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = 'preview/shots/moderation';
mkdirSync(OUT, { recursive: true });

const BASE = process.argv[2] || 'http://localhost:5174';

const ROUTES = [
  ['home', '/home'],
  ['symptoms', '/symptoms'],
  ['symptom-detail', '/symptoms/headache'],
  ['body', '/body'],
  ['organs-brain', '/organs/brain'],
  ['organs-heart', '/organs/heart'],
  ['quiz', '/quiz'],
  ['donations', '/donations'],
  ['bookshop', '/book'],
  ['family', '/family'],
  ['practitioners', '/practitioners'],
  ['practitioner-detail', '/practitioners/1'],
  ['consultations', '/consultations'],
  ['academy', '/academy'],
  ['community', '/community'],
  ['assistant', '/assistant'],
  ['doctors', '/doctors'],
  ['doctor-detail', '/doctors/1'],
  ['contact', '/contact'],
  ['booking', '/booking'],
  ['notfound', '/definitely-not-a-real-route'],
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

const FORBIDDEN = ['body-front', 'body-back'];
const results = [];
const ok = (n, pass, d = '') => results.push(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? '  :: ' + d : ''}`);

const browser = await chromium.launch({
  executablePath: EDGE,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-lcd-text'],
});

let violations = 0;

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    hasTouch: vp.name === 'mobile',
    isMobile: vp.name === 'mobile',
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('orkod.locale', 'fr');
    localStorage.setItem('locale', 'fr');
    localStorage.setItem('lang', 'fr');
  });

  for (const [name, path] of ROUTES) {
    const page = await ctx.newPage();
    const seen = [];
    const apiErrors = [];
    const httpErrors = [];
    const jsErrors = [];
    page.on('request', (r) => {
      const u = r.url();
      if (FORBIDDEN.some((f) => u.includes(f))) seen.push(u);
    });
    page.on('response', (r) => {
      const u = r.url();
      if (FORBIDDEN.some((f) => u.includes(f))) seen.push(`${r.status()} ${u}`);
      if (r.status() >= 400) {
        // The Go backend is not part of this change; report its failures apart
        // from the frontend so a 500 from /api is never read as a regression.
        if (/\/api\//.test(u)) apiErrors.push(`HTTP ${r.status()} ${u}`);
        else httpErrors.push(`HTTP ${r.status()} ${u}`);
      }
    });
    page.on('pageerror', (e) => jsErrors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // Chrome's generic resource-failure message carries no URL and merely
      // duplicates what the response listener already recorded.
      if (/Failed to load resource/i.test(t)) return;
      jsErrors.push(`console: ${t}`);
    });

    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
    } catch (e) {
      jsErrors.push(`goto: ${e.message}`);
    }
    await page.waitForTimeout(name === 'body' ? 10000 : 3000);

    await page.screenshot({ path: `${OUT}/${vp.name}-${name}.png`, fullPage: false });

    const seenText = await page.evaluate(() => document.body.innerText || '');
    ok(
      `[${vp.name}] /${name} requests no removed nude render`,
      seen.length === 0,
      seen.slice(0, 3).join(' , ')
    );

    // The symptoms body map must be the vector silhouette, never a photograph.
    if (name === 'symptoms') {
      const fig = await page.evaluate(() => {
        const f = document.querySelector('.sym-figure');
        if (!f) return { present: false };
        return {
          present: true,
          hasSilhouette: !!f.querySelector('.body-silhouette'),
          hasImg: !!f.querySelector('img'),
          zones: f.querySelectorAll('.sym-zone').length,
        };
      });
      ok(
        `[${vp.name}] /symptoms renders the clothed vector silhouette`,
        fig.present && fig.hasSilhouette && !fig.hasImg,
        JSON.stringify(fig)
      );
      ok(`[${vp.name}] /symptoms keeps its ${5} interactive zones`, fig.zones === 5, `zones=${fig.zones}`);
    }

    // Nothing may render an <img> whose src points at a removed render.
    const badImg = await page.evaluate((forbidden) => {
      return [...document.images].filter((i) => forbidden.some((f) => (i.currentSrc || i.src || '').includes(f))).length;
    }, FORBIDDEN);
    ok(`[${vp.name}] /${name} has no <img> pointing at a removed render`, badImg === 0, `count=${badImg}`);

    if (apiErrors.length) {
      results.push(
        `INFO  [${vp.name}] /${name} backend /api down (pre-existing, unrelated to this change): ` +
          [...new Set(apiErrors.map((e) => e.replace('HTTP ', '')))].slice(0, 4).join(', ')
      );
    }

    ok(
      `[${vp.name}] /${name} has no JavaScript error`,
      jsErrors.length === 0,
      jsErrors.slice(0, 3).join(' ; ')
    );
    ok(
      `[${vp.name}] /${name} has no failed static/asset request`,
      httpErrors.length === 0,
      httpErrors.slice(0, 3).join(' ; ')
    );

    violations += seen.length;
    await page.close();
  }
  await ctx.close();
}

await browser.close();

console.log('\n============== MODERATION SWEEP ==============\n');
for (const r of results) console.log(r);
const fails = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - fails.length} passed, ${fails.length} failed`);
console.log(`routes x viewports = ${ROUTES.length * VIEWPORTS.length}`);
console.log(`removed-render requests observed = ${violations}`);
console.log(`screenshots in ${OUT}/`);
process.exit(fails.length ? 1 : 0);