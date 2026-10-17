/**
 * Integrity tests for the new public-feature data and client wiring:
 *  - data-driven quiz scenario (data/quiz.ts)
 *  - shared body-region catalogue (data/body-regions.ts)
 *  - family circle store (stores/family.ts)
 *  - donation is_public client contract (services/DonationService.ts)
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import axios from 'axios';
import { QUIZ_QUESTIONS, REGION_RECOMMENDATIONS, quizRecommendations } from '@/data/quiz';
import { FRONT_BODY_REGIONS, BACK_BODY_REGIONS } from '@/data/body-regions';
import { TOPICS, getTopic } from '@/data/wellness';
import { useFamilyStore } from '@/stores/family';

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/AppConfigs', () => ({
  default: { getServerURL: () => 'http://test.local/api' },
}));

vi.mock('@/plugins/axios', () => ({ default: apiClientMock }));

const LOCALES_DIR = resolve(process.cwd(), 'src/locales');
const LOCALES = ['en', 'id', 'fr', 'ar'] as const;

function loadLocale(locale: string): Record<string, any> {
  return JSON.parse(readFileSync(`${LOCALES_DIR}/${locale}.json`, 'utf-8'));
}

const en = loadLocale('en');

describe('quiz data (data/quiz.ts)', () => {
  it('every question and option key exists in the en locale', () => {
    for (const question of QUIZ_QUESTIONS) {
      expect(en[question.textKey], `missing key ${question.textKey}`).toBeTruthy();
      for (const option of question.options) {
        expect(en[option.labelKey], `missing key ${option.labelKey}`).toBeTruthy();
      }
    }
  });

  it('every location answer maps to an existing wellness topic', () => {
    const locationQuestion = QUIZ_QUESTIONS.find((q) => q.id === 'location');
    expect(locationQuestion).toBeDefined();
    for (const option of locationQuestion!.options) {
      const slugs = REGION_RECOMMENDATIONS[option.value];
      expect(slugs, `no recommendation for "${option.value}"`).toBeDefined();
      expect(slugs.length).toBeGreaterThan(0);
      for (const slug of slugs) {
        expect(getTopic(slug), `recommended topic "${slug}" must exist`).toBeDefined();
      }
    }
  });

  it('recommendations only ever return existing slug space', () => {
    const known = new Set(TOPICS.map((t) => t.slug));
    for (const slugs of Object.values(REGION_RECOMMENDATIONS)) {
      for (const slug of slugs) {
        expect(known.has(slug)).toBe(true);
      }
    }
    const result = quizRecommendations({ location: 'head', duration: 'weeks', feeling: 'moderate', energy: 'low' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((slug) => known.has(slug))).toBe(true);
  });
});

describe('body-region catalogue (data/body-regions.ts)', () => {
  it('every symptomSlug and topic slug resolves to a real wellness topic', () => {
    for (const region of [...FRONT_BODY_REGIONS, ...BACK_BODY_REGIONS]) {
      expect(getTopic(region.symptomSlug), `${region.id} symptomSlug ${region.symptomSlug}`).toBeDefined();
      for (const slug of region.topicSlugs) {
        expect(getTopic(slug), `${region.id} recommends missing topic ${slug}`).toBeDefined();
      }
    }
  });

  it('ids are unique within each body side', () => {
    const frontIds = FRONT_BODY_REGIONS.map((r) => r.id);
    const backIds = BACK_BODY_REGIONS.map((r) => r.id);
    expect(new Set(frontIds).size).toBe(frontIds.length);
    expect(new Set(backIds).size).toBe(backIds.length);
  });

  it('every region is localizable in all locales', () => {
    for (const region of [...FRONT_BODY_REGIONS, ...BACK_BODY_REGIONS]) {
      for (const locale of LOCALES) {
        const dict = loadLocale(locale);
        expect(dict[region.titleKey], `${region.id} title (${locale})`).toBeTruthy();
        expect(dict[region.descKey], `${region.id} desc (${locale})`).toBeTruthy();
      }
    }
  });
});

describe('family store (stores/family.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('adds members and activates the first one by default', () => {
    const store = useFamilyStore();
    const first = store.addMember({ name: 'Amira', relation: 'self', ageGroup: 'adult' });
    expect(store.members).toHaveLength(1);
    expect(store.activeMember?.id).toBe(first.id);
  });

  it('persists the circle to localStorage', () => {
    const store = useFamilyStore();
    store.addMember({ name: 'Omar', relation: 'partner', ageGroup: 'adult' });
    const stored = JSON.parse(localStorage.getItem('familyCircle') as string);
    expect(stored.members).toHaveLength(1);
    expect(stored.members[0].name).toBe('Omar');
  });

  it('selects and removes members, and falls back when the active member is removed', () => {
    const store = useFamilyStore();
    const a = store.addMember({ name: 'A', relation: 'self', ageGroup: 'adult' });
    const b = store.addMember({ name: 'B', relation: 'child', ageGroup: 'child' });
    expect(store.activeMember?.id).toBe(a.id);

    store.selectMember(b.id);
    expect(store.activeMember?.id).toBe(b.id);

    store.removeMember(b.id);
    expect(store.members).toHaveLength(1);
    expect(store.activeMember?.id).toBe(a.id);

    store.clearCircle();
    expect(store.members).toHaveLength(0);
    expect(store.activeMember).toBeUndefined();
  });

  it('ignores selecting an unknown member', () => {
    const store = useFamilyStore();
    store.addMember({ name: 'A', relation: 'self', ageGroup: 'adult' });
    store.selectMember('nope');
    expect(store.activeMember?.name).toBe('A');
  });
});

describe('donation client (services/DonationService.ts)', () => {
  let postSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    apiClientMock.get.mockReset();
    apiClientMock.post.mockReset();
    apiClientMock.delete.mockReset();
    apiClientMock.get.mockResolvedValue({ data: {} });
    apiClientMock.post.mockResolvedValue({ data: {} });
    apiClientMock.delete.mockResolvedValue({ data: {} });
    postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: { id: 1 } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends isPublic with the donation payload', async () => {
    const { default: DonationService } = await import('@/services/DonationService');

    await DonationService.createDonation('Amira', 50, 'Warm wishes', true);

    expect(postSpy).toHaveBeenCalledWith(
      'http://test.local/api/public/donations',
      { name: 'Amira', amount: 50, message: 'Warm wishes', isPublic: true }
    );
  });

  it('defaults isPublic to false', async () => {
    const { default: DonationService } = await import('@/services/DonationService');

    await DonationService.createDonation('Omar', 25, 'Thanks');

    expect(postSpy).toHaveBeenCalledWith(
      'http://test.local/api/public/donations',
      { name: 'Omar', amount: 25, message: 'Thanks', isPublic: false }
    );
  });

  it('admin list uses the authenticated client against the donations route', async () => {
    const { default: DonationService } = await import('@/services/DonationService');
    await DonationService.adminListDonations();
    expect(apiClientMock.get).toHaveBeenCalledWith('http://test.local/api/donations');
  });

  it('admin visibility toggle posts to the settings route', async () => {
    const { default: DonationService } = await import('@/services/DonationService');
    await DonationService.setDonationsVisible(true);
    expect(apiClientMock.post).toHaveBeenCalledWith('http://test.local/api/settings/donationsVisible', { visible: true });
  });
});