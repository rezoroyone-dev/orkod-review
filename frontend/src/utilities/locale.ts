import { langsEnum } from '@/enumerators/enums';

/**
 * The single localStorage key that remembers the visitor's language choice.
 *
 * Written by `persistLocale()` whenever the active locale changes, and read
 * once by the i18n plugin *before* the app renders (see `plugins/i18n.ts`), so
 * a refresh — or a deep link straight to `/body`, `/booking`, … — comes back in
 * the language the visitor actually picked instead of resetting to the build
 * default. `App.vue` owns the write side by watching the i18n locale, which is
 * the one value every switcher (the gate, the public header, the admin toolbar)
 * already updates.
 */
export const LOCALE_STORAGE_KEY = 'orkod.locale';

const SUPPORTED = new Set<string>(Object.values(langsEnum));

/**
 * The stored language code, or `''` when nothing valid was saved.
 *
 * Returns `''` rather than throwing when storage is unavailable (private mode,
 * SSR, a hardened browser) or when a stale/unrecognised code is found, so the
 * caller can fall back to the build default.
 */
export function readStoredLocale(): string {
  if (typeof localStorage === 'undefined') return '';
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw && SUPPORTED.has(raw) ? raw : '';
  } catch {
    return '';
  }
}

/**
 * Remember the visitor's language choice.
 *
 * Unknown codes are ignored, and a storage failure is swallowed: persistence is
 * a convenience, never a reason to break the current session.
 */
export function persistLocale(lang: string): void {
  if (typeof localStorage === 'undefined') return;
  if (!SUPPORTED.has(lang)) return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  } catch {
    /* storage disabled — the session still works, it just won't be remembered */
  }
}
