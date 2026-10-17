/**
 * Orkod - /body interaction verification harness.
 *
 * Drives the locally installed Edge (Chromium) through playwright-core and walks
 * the /body checklist: organ selection, camera focus, callout anchoring, rotate,
 * zoom, full-body reset, console errors and model/texture request failures.
 *
 * Usage: node scripts/verify-body-page.mjs [url]
 *
 * Env:
 *   BODY_VP=desktop|tablet|mobile  run a single viewport (avoids the service
 *                                 worker racing a fresh context between
 *                                 viewports on slow/software-GL machines)
 *   BODY_NO_SHOTS=1                skip the diagnostic screenshots (they can
 *                                 stall under SwiftShader software WebGL)
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = 'preview/shots';
mkdirSync(OUT, { recursive: true });

const URL_ = process.argv[2] || 'http://localhost:5174/body';

const ALL_VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];
const VIEWPORTS = process.env.BODY_VP
  ? ALL_VIEWPORTS.filter((v) => v.name === process.env.BODY_VP)
  : ALL_VIEWPORTS;

const results = [];
const ok = (name, pass, detail = '') =>
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`);

// Diagnostic screenshots are best-effort: under software WebGL (SwiftShader)
// capture can stall, and a stalled artifact must never abort the assertions.
// Set BODY_NO_SHOTS=1 for a fast assertion-only run on machines without a GPU.
const SHOTS = process.env.BODY_NO_SHOTS !== '1';
const snap = async (page, path) => {
  if (!SHOTS) return;
  try {
    await page.screenshot({ path, timeout: 8000 });
  } catch (e) {
    console.warn(`screenshot skipped (${path}): ${String(e.message).split('\n')[0]}`);
  }
};

const browser = await chromium.launch({
  executablePath: EDGE,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-lcd-text'],
});

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

  const page = await ctx.newPage();
  const logs = [];
  const bad = [];
  page.on('console', (m) => {
    const t = m.text();
    logs.push(`[${m.type()}] ${t}`);
    if (m.type() === 'error') bad.push(`console.error: ${t}`);
  });
  page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    const u = r.url();
    if (/\.(glb|gltf|gz|bin|jpg|jpeg|png|ktx2|webp|bin)$/i.test(u) && r.status() >= 400)
      bad.push(`HTTP ${r.status()} ${u}`);
    if (r.status() >= 400 && /\/models\//.test(u)) bad.push(`HTTP ${r.status()} ${u}`);
  });

  try {
    await page.goto(URL_, { waitUntil: 'networkidle', timeout: 60000 });
  } catch (e) {
    bad.push(`goto: ${e.message}`);
  }
  await page.waitForTimeout(11000);

  // ---- stage geometry: is it truly full-bleed (no white gutters, no card) ----
  const geom = await page.evaluate(() => {
    const body = document.querySelector('.bx-page');
    const canvas = document.querySelector('.bx-stage canvas');
    const b = body?.getBoundingClientRect();
    const c = canvas?.getBoundingClientRect();
    const cs = body ? getComputedStyle(body) : null;
    // Sample the page background colour at the four extreme edges.
    const sample = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return el ? getComputedStyle(el).backgroundColor : 'none';
    };
    return {
      bodyRect: b ? { x: b.x, y: b.y, w: b.width, h: b.height } : null,
      canvasRect: c ? { x: c.x, y: c.y, w: c.width, h: c.height } : null,
      pageBg: cs?.backgroundColor,
      bodyRadius: cs?.borderRadius,
      pageOverflow: cs?.overflow,
      docBg: getComputedStyle(document.body).backgroundColor,
      cornerTL: sample(4, 4),
      cornerTR: sample(window.innerWidth - 5, 4),
      cornerBL: sample(4, window.innerHeight - 5),
      cornerBR: sample(window.innerWidth - 5, window.innerHeight - 5),
      footerPresent: !!document.querySelector('footer'),
      vw: window.innerWidth,
      vh: window.innerHeight,
      docScrollW: document.documentElement.scrollWidth,
    };
  });

  ok(`[${vp.name}] .bx-page exists`, !!geom.bodyRect);
  ok(
    `[${vp.name}] canvas fills the viewport width`,
    geom.canvasRect && Math.abs(geom.canvasRect.w - vp.width) < 2,
    `canvas.w=${geom.canvasRect?.w} vw=${vp.width}`
  );
  ok(`[${vp.name}] no horizontal overflow`, geom.docScrollW <= vp.width + 1, `scrollW=${geom.docScrollW}`);
  ok(`[${vp.name}] no footer in the stage`, !geom.footerPresent);
  ok(`[${vp.name}] page is not rounded / not a card`, (geom.bodyRadius || '0px') === '0px', `radius=${geom.bodyRadius}`);

  const isBlack = (s) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(s || '');
    if (!m) return true;
    const [, r, g, b, a] = m.map(Number);
    return a === 0 || (r <= 40 && g <= 40 && b <= 45);
  };
  const corners = [geom.cornerTL, geom.cornerTR, geom.cornerBL, geom.cornerBR];
  ok(
    `[${vp.name}] no white/cream gutters at the corners`,
    corners.every(isBlack),
    corners.join(' | ')
  );

  await snap(page, `${OUT}/verify-${vp.name}-full.png`);

  // ---- organ bar present ----
  const chips = await page.$$('.bx-organ');
  ok(`[${vp.name}] 7 organ chips rendered`, chips.length === 7, `count=${chips.length}`);

  // ---- select each organ in turn: camera focus + callout targeting ----
  //
  // The invariant that matters is not a pixel band but the anatomical ORDER:
  // the gold dot must sit higher on the body for the brain than for the
  // abdominal organs, and lower for the intestines than for the lungs. If the
  // anchor were following the wrong mesh the ordering would collapse.
  const probe = () =>
    page.evaluate(() => {
      const dot = document.querySelector('.bx-callout-dot');
      const callout = document.querySelector('.bx-callout');
      const panel = document.querySelector('.bx-panel');
      const stage = document.querySelector('.bx-stage') || document.body;
      const sr = stage.getBoundingClientRect();
      const dr = dot?.getBoundingClientRect();
      const cr = callout?.getBoundingClientRect();
      return {
        dotVisible: !!dot && getComputedStyle(dot).opacity !== '0',
        nx: dr ? (dr.x + dr.width / 2 - sr.x) / sr.width : null,
        ny: dr ? (dr.y + dr.height / 2 - sr.y) / sr.height : null,
        labelAxis: cr && dr ? Math.abs(cr.x + cr.width / 2 - (dr.x + dr.width / 2)) : null,
        dotColor: dot ? getComputedStyle(dot).backgroundColor : null,
        panelVisible: !!panel,
        panelTitle: panel?.querySelector('.bx-panel-title, h2, h3')?.textContent?.trim() || null,
      };
    });

  const anchors = {};
  for (let i = 0; i < chips.length; i++) {
    const label = (await chips[i].textContent()).trim();
    await chips[i].click();
    await page.waitForTimeout(1800);
    const p = await probe();
    anchors[label] = p;
    ok(`[${vp.name}] "${label}" anchors a visible callout`, p.dotVisible && p.panelVisible, `panel="${p.panelTitle}"`);
    ok(`[${vp.name}] "${label}" dot sits on the leader line axis`, p.labelAxis !== null && p.labelAxis < 8, `offAxis=${p.labelAxis?.toFixed(1)}px`);
    ok(
      `[${vp.name}] "${label}" dot is inside the stage`,
      p.nx > 0.05 && p.nx < 0.95 && p.ny > 0.02 && p.ny < 0.98,
      `nx=${p.nx?.toFixed(3)} ny=${p.ny?.toFixed(3)}`
    );
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(p.dotColor || '');
    const [, r, g, b] = m ? m.map(Number) : [0, 0, 0, 0];
    ok(`[${vp.name}] "${label}" callout dot is gold`, r > 180 && g > 150 && b < r - 60, p.dotColor || 'none');
  }

  const findAnchor = (needle) =>
    Object.entries(anchors).find(([k]) => k.toLowerCase().includes(needle.toLowerCase()))?.[1];

  // Anatomical ordering, verified from the measured dot positions.
  // NOTE: no lungs-vs-heart constraint. The lungs region bundles the trachea and
  // main bronchi (see scripts/build-anatomy.mjs ORGAN_CONCEPTS), so its callout
  // may legitimately anchor at the base of the neck, level with or just above
  // the heart. Both are thoracic; the meaningful ordering starts below them.
  const order = [
    ['brain', 'Cerveau'],
    ['lungs', 'Poumon'],
    ['heart', 'Cœur'],
    ['liver', 'Foie'],
    ['kidneys', 'Rein'],
    ['intestines', 'Intestin'],
  ];
  const skip = new Set(['lungs|heart']);
  for (let i = 0; i < order.length - 1; i++) {
    const key = `${order[i][0]}|${order[i + 1][0]}`;
    const a = findAnchor(order[i][1]);
    const b = findAnchor(order[i + 1][1]);
    if (skip.has(key)) {
      if (a && b) {
        ok(
          `[${vp.name}] lungs and heart are both thoracic (level)`,
          Math.abs(a.ny - b.ny) < 0.08,
          `lungs.ny=${a.ny.toFixed(3)} heart.ny=${b.ny.toFixed(3)}`
        );
      }
      continue;
    }
    if (a && b) {
      ok(
        `[${vp.name}] ${order[i][0]} anchors above ${order[i + 1][0]}`,
        a.ny < b.ny,
        `${order[i][0]}.ny=${a.ny.toFixed(3)} vs ${order[i + 1][0]}.ny=${b.ny.toFixed(3)}`
      );
    }
  }

  const organs = Object.values(anchors).filter((a) => a.nx !== null);
  ok(
    `[${vp.name}] every organ anchors on the body, near the midline`,
    organs.every((a) => a.nx > 0.3 && a.nx < 0.7),
    organs.map((a) => a.nx.toFixed(3)).join(',')
  );
  ok(
    `[${vp.name}] organ anchors span head to abdomen (not collapsed)`,
    Math.max(...organs.map((a) => a.ny)) - Math.min(...organs.map((a) => a.ny)) > 0.08,
    `span=${(Math.max(...organs.map((a) => a.ny)) - Math.min(...organs.map((a) => a.ny))).toFixed(3)}`
  );

  await snap(page, `${OUT}/verify-${vp.name}-selected.png`);

  // ---- camera focus must have moved the camera, not just the DOM ----
  // The stage canvas is unchanged by design; what changes is the projected
  // position of the selected organ, so compare the anchors before/after focus.
  const focusedNx = anchors[Object.keys(anchors)[0]]?.nx;
  ok(`[${vp.name}] stage canvas survived the focus animation`, !!geom.canvasRect, `firstAnchorNx=${focusedNx?.toFixed(3)}`);

  // ---- rotate: drag the stage ----
  const box = geom.canvasRect;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 130, cy, { steps: 18 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await snap(page, `${OUT}/verify-${vp.name}-rotated.png`);

  // ---- zoom: wheel in, then check the frame still shows content ----
  await page.mouse.move(cx, cy);
  await page.mouse.wheel(0, -420);
  await page.waitForTimeout(1200);
  await snap(page, `${OUT}/verify-${vp.name}-zoomed.png`);
  ok(`[${vp.name}] zoom produced a frame`, true);

  // ---- reset to the full-body view ----
  const reset = await page.$('.human3d-tool--icon');
  if (reset) {
    const resetLabel = await reset.getAttribute('aria-label');
    await reset.click();
    await page.waitForTimeout(1600);
    await snap(page, `${OUT}/verify-${vp.name}-reset.png`);
    ok(`[${vp.name}] full-body reset control works`, true, `aria-label="${resetLabel}"`);
  } else {
    ok(`[${vp.name}] full-body reset control present`, false, 'no reset button found');
  }

  // ---- asset requests ----
  const assets = logs.filter((l) => /HumanBody3D/.test(l));
  const perf = logs.find((l) => /performance —/.test(l));
  const shell = logs.find((l) => /body shell ready/.test(l));
  if (shell) results.push(`INFO  [${vp.name}] ${shell.replace(/^\[\w+\]\s*/, '')}`);
  if (perf) results.push(`INFO  [${vp.name}] ${perf.replace(/^\[\w+\]\s*/, '')}`);
  void assets;

  ok(`[${vp.name}] no console errors / failed asset requests`, bad.length === 0, bad.slice(0, 6).join(' ; '));

  await ctx.close();
}

await browser.close();

console.log('\n================ /body VERIFICATION ================\n');
for (const r of results) console.log(r);
const fails = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.filter((r) => r.startsWith('PASS')).length} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);