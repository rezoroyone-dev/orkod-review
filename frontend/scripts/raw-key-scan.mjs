// Raw-key scanner: loads every public route and reports any visible text or
// attribute that still renders a raw i18n key (e.g. "Home_ChoiceKnow_Title").
//
// Uses whatever locale the dev server defaults to — the four locale files now
// share an identical key set, so a raw key would appear in every language.
//
// Usage: node scripts/raw-key-scan.mjs [baseUrl]
import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');

const ROUTES = [
  '/home', '/body', '/organs/heart', '/symptoms', '/symptoms/back-pain',
  '/quiz', '/practitioners', '/practitioners/1', '/doctors', '/doctors/1',
  '/academy', '/academy/divine-healing', '/community', '/consultations',
  '/assistant', '/donations', '/family', '/book', '/booking',
  '/specialty/heart', '/contact', '/this-route-does-not-exist',
];

const KEY_RE = /^[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+$/;

const browser = await chromium.launch({
  executablePath: EDGE,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();

let total = 0;
for (const route of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const found = await page.evaluate((src) => {
    const re = new RegExp(src);
    const hits = new Set();
    const check = (v) => {
      const s = (v || '').trim();
      if (s && re.test(s)) hits.add(s);
    };
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length === 0) check(el.textContent);
      for (const a of ['placeholder', 'aria-label', 'title', 'alt']) check(el.getAttribute(a));
    }
    return [...hits];
  }, KEY_RE.source);
  total += found.length;
  console.log(`${found.length === 0 ? 'OK  ' : 'RAW '}${route}${found.length ? '  ->  ' + found.join(', ') : ''}`);
}

await browser.close();
console.log(total === 0 ? '\nPASS: no raw keys found on any public route.' : `\nFAIL: ${total} raw key hits.`);
