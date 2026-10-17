// Orkod end-to-end browser verification harness.
//
// Drives the locally installed Edge (Chromium) through playwright-core against
// the running dev site and captures the screenshots a human needs to judge the
// /body model, the four locales and the black/purple/gold design.
//
// Usage: node scripts/verify-orkod.mjs [baseUrl]
//   default baseUrl: http://localhost:5173
//   screenshots -> preview/verify/
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');
const OUT = 'preview/verify';
mkdirSync(OUT, { recursive: true });

const ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--disable-lcd-text',
];

const browser = await chromium.launch({ executablePath: EDGE, args: ARGS });

/** Everything the report wants to print. */
const report = {
  base: BASE,
  consoleByPage: {},
  pageErrors: [],
  modelRequests: [],
  checks: {},
};

function attach(page, tag) {
  report.consoleByPage[tag] = [];
  page.on('console', (m) => {
    const t = m.text();
    if (/HumanBody3D|WebGL|threw|error/i.test(t) || m.type() === 'error') {
      report.consoleByPage[tag].push(`[${m.type()}] ${t}`);
    }
  });
  page.on('pageerror', (e) => report.pageErrors.push(`[${tag}] ${e.message}`));
  page.on('response', (r) => {
    const u = r.url();
    if (u.includes('/models/')) report.modelRequests.push(`${r.status()} ${u}`);
  });
}

async function pickLocale(page, lang) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.gate-lang', { timeout: 30000 });
  await page.screenshot({ path: `${OUT}/gate-${lang}.png` });
  await page.click(`button.gate-lang[lang="${lang}"]`);
  await page.waitForURL('**/home', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function bodyScreenshot(page, name, waitMs = 11000) {
  await page.goto(`${BASE}/body`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.human3d-stage canvas', { timeout: 40000 });
  // Wait until organs are mounted — guarantees the model has initialised and
  // the first WebGL frame has been drawn (avoids capturing a blank frame).
  await page.waitForSelector('.bx-organ', { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

async function drag(page, dx) {
  const box = await page.locator('.human3d-stage canvas').first().boundingBox();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
}

// ── 1. English: gate → home → body ─────────────────────────────────────────
const ctxEn = await browser.newContext({
  viewport: { width: 1280, height: 860 },
  deviceScaleFactor: 1,
  locale: 'en-US',
});
const pageEn = await ctxEn.newPage();
attach(pageEn, 'en');

await pickLocale(pageEn, 'en');
await pageEn.screenshot({ path: `${OUT}/home-en.png` });
report.checks.homeEn = await pageEn.evaluate(() => ({
  imgs: document.querySelectorAll('img').length,
  doors: [...document.querySelectorAll('.hp-door')].map((d) => ({
    href: d.getAttribute('href'),
    title: d.querySelector('.hp-door-title')?.textContent?.trim(),
  })),
  htmlLang: document.documentElement.lang,
  htmlDir: document.documentElement.dir,
}));

await bodyScreenshot(pageEn, 'body-front-en');
report.checks.bodyEn = await pageEn.evaluate(() => ({
  organs: [...document.querySelectorAll('.bx-organ')].map((b) => b.textContent.trim()),
  canvas: !!document.querySelector('.human3d-stage canvas'),
  credit: document.querySelector('.human3d-credit')?.textContent?.trim(),
  webgl: (() => {
    const c = document.querySelector('.human3d-stage canvas');
    if (!c) return null;
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return gl ? gl.getParameter(gl.VERSION) : null;
  })(),
}));

// Rotate to reveal side and back profiles.
await drag(pageEn, -260);
await pageEn.screenshot({ path: `${OUT}/body-side-en.png` });
await drag(pageEn, -260);
await pageEn.screenshot({ path: `${OUT}/body-back-en.png` });
await drag(pageEn, 260);
await drag(pageEn, 260);

// Select each of the seven organs and confirm the detail card reacts.
report.checks.organSelection = [];
for (let i = 1; i <= 7; i++) {
  const chip = pageEn.locator(`.bx-organ:nth-child(${i})`);
  await chip.click();
  await pageEn.waitForTimeout(900);
  const info = await pageEn.evaluate(() => ({
    title: document.querySelector('.bx-panel-title')?.textContent?.trim() ?? null,
    callout: document.querySelector('.bx-callout')?.textContent?.trim() ?? null,
  }));
  report.checks.organSelection.push({ n: i, ...info });
  if (i === 3) await pageEn.screenshot({ path: `${OUT}/body-heart-selected-en.png` });
  await chip.click();
  await pageEn.waitForTimeout(300);
}

// Reset + mobile.
await pageEn.locator('.human3d-tool--icon').first().click().catch(() => {});
await pageEn.waitForTimeout(1200);
await pageEn.screenshot({ path: `${OUT}/body-reset-en.png` });

const ctxMob = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'en-US',
  isMobile: true,
  hasTouch: true,
});
const pageMob = await ctxMob.newPage();
attach(pageMob, 'mobile');
await bodyScreenshot(pageMob, 'body-mobile-en', 10000);
report.checks.mobile = await pageMob.evaluate(() => ({
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  organs: document.querySelectorAll('.bx-organ').length,
}));
await ctxMob.close();

// ── 2. Arabic (RTL) ─────────────────────────────────────────────────────────
const ctxAr = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'ar-EG' });
const pageAr = await ctxAr.newPage();
attach(pageAr, 'ar');
await pickLocale(pageAr, 'ar');
report.checks.arHome = await pageAr.evaluate(() => ({
  htmlLang: document.documentElement.lang,
  htmlDir: document.documentElement.dir,
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  sample: document.querySelector('.hp-hero-title')?.textContent?.trim(),
}));
await pageAr.screenshot({ path: `${OUT}/home-ar.png` });
await bodyScreenshot(pageAr, 'body-ar');
await ctxAr.close();

// ── 3. French ───────────────────────────────────────────────────────────────
const ctxFr = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'fr-FR' });
const pageFr = await ctxFr.newPage();
attach(pageFr, 'fr');
await pickLocale(pageFr, 'fr');
report.checks.frHome = await pageFr.evaluate(() => ({
  htmlLang: document.documentElement.lang,
  sample: document.querySelector('.hp-hero-title')?.textContent?.trim(),
}));
await pageFr.screenshot({ path: `${OUT}/home-fr.png` });
await ctxFr.close();

// ── 4. Indonesian ───────────────────────────────────────────────────────────
const ctxId = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'id-ID' });
const pageId = await ctxId.newPage();
attach(pageId, 'id');
await pickLocale(pageId, 'id');
report.checks.idHome = await pageId.evaluate(() => ({
  htmlLang: document.documentElement.lang,
  sample: document.querySelector('.hp-hero-title')?.textContent?.trim(),
}));
await pageId.screenshot({ path: `${OUT}/home-id.png` });
await ctxId.close();

await ctxEn.close();
await browser.close();

console.log(JSON.stringify(report, null, 2));
