/**
 * i18n parity guard.
 *
 * The four locales must expose an identical key set — a key that exists in
 * only some languages renders as a raw "Some_Key" string in the others (this
 * exact bug shipped: id.json was a superset while en/fr/ar lagged behind).
 *
 * Nested dictionaries (civil, weekDays, $vuetify) are flattened to dotted
 * paths so their sub-keys are compared too, and interpolation placeholders
 * ({count}, {name}, {id}) must survive translation.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCALES = ['en', 'fr', 'ar', 'id'] as const;
const DIR = resolve(process.cwd(), 'src/locales');

type Dict = Record<string, unknown>;

function load(locale: string): Dict {
  return JSON.parse(readFileSync(resolve(DIR, `${locale}.json`), 'utf8'));
}

/** Flatten a possibly-nested dictionary to { 'a.b.c': string }. */
function flatten(obj: Dict, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      Object.assign(out, flatten(value as Dict, path));
    } else {
      out[path] = String(value);
    }
  }
  return out;
}

const dicts = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l))])) as Record<string, Record<string, string>>;
const keysOf = (l: string) => new Set(Object.keys(dicts[l]));

const placeholders = (value: string) => new Set(value.match(/\{[a-zA-Z0-9_]+\}/g) ?? []);

describe('i18n locale parity', () => {
  it('every locale exposes the same key set', () => {
    const reference = keysOf('en');
    for (const locale of LOCALES) {
      const keys = keysOf(locale);
      const missing = [...reference].filter((k) => !keys.has(k));
      const extra = [...keys].filter((k) => !reference.has(k));
      expect(missing, `${locale} is missing keys`).toEqual([]);
      expect(extra, `${locale} has unexpected keys`).toEqual([]);
    }
  });

  it('has no empty or whitespace-only translations', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(dicts[locale])) {
        expect(value.trim(), `${locale}.${key} must not be blank`).not.toBe('');
      }
    }
  });

  it('keeps interpolation placeholders identical across locales', () => {
    for (const key of keysOf('en')) {
      const reference = placeholders(dicts.en[key]);
      if (reference.size === 0) continue;
      for (const locale of LOCALES) {
        const got = placeholders(dicts[locale][key]);
        expect([...got].sort(), `${locale}.${key} placeholder mismatch`).toEqual([...reference].sort());
      }
    }
  });
});
