// Locale parity audit.
//
//   * Counts keys per locale.
//   * Finds keys referenced from the current source (literal t('...') plus
//     data-driven `titleKey: '...'` / `labelKey: '...'` styles) that are
//     missing from a locale — these are the raw keys a visitor can see.
//   * Lists keys that exist in some locales but not all, split into
//     "referenced" (must be fixed) and "unreferenced" (dead, prune candidates).
//
// Usage: node scripts/locale-parity.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES = ['en', 'fr', 'ar', 'id'];
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');

const data = {};
for (const l of LOCALES) {
  data[l] = JSON.parse(readFileSync(join(SRC, 'locales', `${l}.json`), 'utf8'));
}
const union = new Set();
for (const l of LOCALES) for (const k of Object.keys(data[l])) union.add(k);

const REF_PATTERNS = [
  /\bt\(\s*['"]([A-Za-z0-9_]+)['"]/g, // t('Key')
  /\$t\(\s*['"]([A-Za-z0-9_]+)['"]/g, // $t('Key')
  /\b[a-zA-Z]*[Kk]ey:\s*['"]([A-Za-z0-9_]+)['"]/g, // titleKey: 'Key'
  /\b[a-zA-Z]*(?:Key|Label|Text|Title|Desc):\s*['"]([A-Za-z0-9_]+)['"]/g,
  /\b(?:nameKey|slugKey|key):\s*['"]([A-Za-z0-9_]+)['"]/g,
];

const referenced = new Set();
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'tests' || name === '__tests__') continue;
      walk(p);
    } else if (/\.(vue|ts)$/.test(name)) {
      const text = readFileSync(p, 'utf8');
      for (const re of REF_PATTERNS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text))) referenced.add(m[1]);
      }
    }
  }
}
walk(SRC);

// Only keep referenced tokens that actually look like keys present somewhere.
const refKeys = new Set([...referenced]);

const missingRef = {};
for (const l of LOCALES) {
  missingRef[l] = [...refKeys].filter((k) => !(k in data[l])).sort();
}

const asymmetric = [...union]
  .map((k) => ({ key: k, present: LOCALES.filter((l) => k in data[l]) }))
  .filter((r) => r.present.length < LOCALES.length);

const refAsym = asymmetric.filter((r) => refKeys.has(r.key)).sort((a, b) => a.present.length - b.present.length);
const deadAsym = asymmetric.filter((r) => !refKeys.has(r.key));

console.log('=== locale key counts ===');
for (const l of LOCALES) console.log(`${l}: ${Object.keys(data[l]).length}`);

console.log(`\n=== referenced key literals found in source: ${refKeys.size} ===`);
for (const l of LOCALES) {
  console.log(`${l}: ${missingRef[l].length} referenced keys missing from JSON`);
}
if (missingRef.en.length && missingRef.en.length === missingRef.id.length) {
  console.log('(missing from every locale — likely concatenation prefixes or non-keys:)');
  console.log('  ' + missingRef.en.join('\n  '));
}

console.log(`\n=== REFERENCED keys not present in all locales: ${refAsym.length} (must fix) ===`);
for (const r of refAsym) console.log(`${r.key}  [have: ${r.present.join(',')}]`);

console.log(`\n=== UNREFERENCED keys not present in all locales: ${deadAsym.length} (dead/prune) ===`);
console.log(deadAsym.map((r) => `${r.key} [${r.present.join(',')}]`).join('\n'));
