/**
 * Integrity tests for the content data (wellness topics + academy) and the
 * requirement that every English key exists in all four locales.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TOPICS, getTopic } from '@/data/wellness';
import { ACADEMY_COURSES } from '@/data/academy';

const LOCALES_DIR = resolve(process.cwd(), 'src/locales');
const LOCALES = ['en', 'id', 'fr', 'ar'] as const;

function loadLocale(locale: string): Record<string, any> {
  const raw = readFileSync(`${LOCALES_DIR}/${locale}.json`, 'utf-8');
  return JSON.parse(raw);
}

describe('wellness topic data', () => {
  it('covers every topic in all four locales with risk factors and doctor warnings', () => {
    for (const topic of TOPICS) {
      for (const locale of LOCALES) {
        const content = topic.content[locale];
        expect(content, `${topic.slug} missing in ${locale}`).toBeDefined();
        expect(content.title, `${topic.slug}.title (${locale})`).toBeTruthy();
        expect(content.summary, `${topic.slug}.summary (${locale})`).toBeTruthy();
        expect(Array.isArray(content.riskFactors)).toBe(true);
        expect(content.riskFactors.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(content.seeDoctor)).toBe(true);
        expect(content.seeDoctor.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('provides exercises, meditation, relaxation, nutrition and redFlags in every locale', () => {
    for (const topic of TOPICS) {
      for (const locale of LOCALES) {
        const content = topic.content[locale];
        expect(Array.isArray(content.exercises), `${topic.slug}.exercises (${locale})`).toBe(true);
        expect(content.exercises.length).toBeGreaterThanOrEqual(1);
        expect(content.exercises.every((e: string) => e.trim().length > 0)).toBe(true);
        expect(content.meditation, `${topic.slug}.meditation (${locale})`).toBeTruthy();
        expect(content.relaxation, `${topic.slug}.relaxation (${locale})`).toBeTruthy();
        expect(content.nutrition, `${topic.slug}.nutrition (${locale})`).toBeTruthy();
        expect(Array.isArray(content.redFlags), `${topic.slug}.redFlags (${locale})`).toBe(true);
        expect(content.redFlags.length).toBeGreaterThanOrEqual(1);
        expect(content.redFlags.every((r: string) => r.trim().length > 0)).toBe(true);
      }
    }
  });

  it('has a knee-pain topic mapped to the legs region', () => {
    const knee = getTopic('knee-pain');
    expect(knee).toBeDefined();
    expect(knee?.region).toBe('legs');
    expect(['en', 'id', 'fr', 'ar'].every((l) => Boolean(knee?.content[l]))).toBe(true);
  });

  it('resolves every region the body explorer routes to', () => {
    const regionSlugs = [
      'headache',
      'eye-strain',
      'neck-pain',
      'shoulder-tension',
      'back-pain',
      'digestive-discomfort',
      'knee-pain',
      'joint-pain',
      'stress-anxiety',
    ];
    for (const slug of regionSlugs) {
      expect(getTopic(slug), `topic ${slug} should exist`).toBeDefined();
    }
  });
});

describe('academy course data', () => {
  it('is consistent across courses', () => {
    expect(ACADEMY_COURSES.length).toBeGreaterThanOrEqual(5);
    for (const course of ACADEMY_COURSES) {
      expect(course.days).toBeGreaterThan(0);
      expect(course.lessons).toBeGreaterThan(0);
      expect(course.category).toMatch(/^(foundation|practitioner|specialised|protection)$/);
      expect(course.accent.from).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('locale completeness', () => {
  const en = loadLocale('en');

  it('the English keys are a subset of every other locale', () => {
    const enKeys = Object.keys(en);
    for (const locale of LOCALES.filter((l) => l !== 'en')) {
      const keys = new Set(Object.keys(loadLocale(locale)));
      const missing = enKeys.filter((k) => !keys.has(k));
      expect(missing, `${locale} is missing keys: ${missing.join(', ')}`).toEqual([]);
    }
  });

  it('all four files are valid JSON', () => {
    for (const locale of LOCALES) {
      expect(() => loadLocale(locale)).not.toThrow();
    }
  });
});