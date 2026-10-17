// Temporary visual verification harness.
// Drives the locally installed Edge (Chromium) through playwright-core.
// Usage: node scripts/shot.mjs <name> <url> [width] [height] [locale] [waitMs]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = 'preview/shots';
mkdirSync(OUT, { recursive: true });

const [, , name, url, w = '1280', h = '800', locale = 'en', waitMs = '6000'] = process.argv;

const browser = await chromium.launch({
  executablePath: EDGE,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-lcd-text'],
});
const ctx = await browser.newContext({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
  locale: locale === 'ar' ? 'ar-EG' : locale === 'fr' ? 'fr-FR' : locale === 'id' ? 'id-ID' : 'en-US',
  reducedMotion: 'no-preference',
});
await ctx.addInitScript((loc) => {
  localStorage.setItem('orkod.locale', loc);
  localStorage.setItem('locale', loc);
  localStorage.setItem('lang', loc);
}, locale);

const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

const responses = [];
page.on('response', (r) => {
  const u = r.url();
  if (/\.(glb|gz|json|bin)$/i.test(u) || u.includes('/models/')) {
    responses.push(`${r.status()} ${u}`);
  }
});

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
} catch (e) {
  logs.push(`[goto] ${e.message}`);
}
await page.waitForTimeout(Number(waitMs));

await page.screenshot({ path: `${OUT}/${name}.png` });
console.log(`SHOT ${OUT}/${name}.png`);
if (responses.length) console.log('ASSETS:\n' + [...new Set(responses)].join('\n'));
if (logs.length) console.log('LOGS:\n' + logs.slice(-40).join('\n'));
await browser.close();