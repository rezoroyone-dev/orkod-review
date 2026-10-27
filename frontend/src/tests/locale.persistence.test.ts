import { describe, it, expect, beforeEach } from 'vitest';
import {
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  persistLocale,
} from '@/utilities/locale';

/**
 * The language choice must survive a refresh and a deep link into any route.
 * These cover the storage contract; the i18n plugin reads the same key before
 * the first render, and App.vue writes it whenever the locale changes.
 */
describe('language persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses one documented, stable storage key', () => {
    expect(LOCALE_STORAGE_KEY).toBe('orkod.locale');
  });

  it('returns nothing before a language has been chosen', () => {
    expect(readStoredLocale()).toBe('');
  });

  it('remembers each shipped language', () => {
    for (const code of ['en', 'fr', 'ar', 'id']) {
      persistLocale(code);
      expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe(code);
      expect(readStoredLocale()).toBe(code);
    }
  });

  it('ignores an unsupported language code', () => {
    persistLocale('de');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    expect(readStoredLocale()).toBe('');
  });

  it('ignores a stale or corrupt stored value', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'klingon');
    expect(readStoredLocale()).toBe('');
  });

  it('never throws when storage rejects the write', () => {
    const original = localStorage.setItem;
    (localStorage as unknown as { setItem: unknown }).setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => persistLocale('ar')).not.toThrow();
    (localStorage as unknown as { setItem: unknown }).setItem = original;
  });
});
