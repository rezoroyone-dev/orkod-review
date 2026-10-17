import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import HomePage from '@/views/HomePage.vue';

// The global test setup stubs vue-i18n so t() returns the raw key, which would
// trip the "no raw key leaked" assertion with a false positive. Provide the
// same readable-label contract the other presentation tests use.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key.replace(/_/g, ' '),
    locale: { value: 'en' },
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// `motion-v` drives the hero entrance; it is decorative and not what this guard
// audits, so `motion.<tag>` is replaced by a passthrough that keeps the slot.
// HomePage only uses `motion.div` and `motion.p`, so an explicit tag map is
// enough (a catch-all proxy also catches Vue's internal key probes and breaks).
vi.mock('motion-v', () => {
  const passthrough = {
    template: '<div class="motion-passthrough"><slot /></div>',
    inheritAttrs: true,
  };
  return { motion: { div: passthrough, p: passthrough } };
});

// The composable resolves `prefers-reduced-motion` through @vueuse/core, which
// needs a matchMedia jsdom does not provide. Neutralise the preference.
vi.mock('@/composables/useReducedMotion', () => ({
  useReducedMotion: () => ({ value: false }),
}));

// Keep the donation feed deterministic and off the network.
vi.mock('@/services/DonationService', () => ({
  default: { getPublicDonations: async () => ({ enabled: true, donations: [] }) },
}));

/**
 * Presentation guard for the canonical public homepage (HomePage.vue).
 *
 * The landing was rebuilt as an image-free editorial home: no stock portraits,
 * no human photography, no raster hero art — the audience includes minors and
 * an earlier version shipped unverified nude/stock imagery. These assertions
 * mount the real HomePage and assert the image-free composition plus the three
 * "ways in" (concern / guided questions / book) that the homepage is specified
 * to offer.
 *
 * Heavy children (TrustStrip, FederatedSearch) are stubbed: they carry network
 * and axe weight irrelevant to this guard. The page's own template renders for
 * real.
 */
const stubs = {
  VBtn: { template: '<button type="button"><slot /><slot name="append" /></button>' },
  VIcon: { template: '<span class="v-icon-stub" aria-hidden="true" />' },
  RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
  TrustStrip: true,
  FederatedSearch: true,
  SplitHeading: {
    props: ['text', 'tag'],
    template: '<component :is="tag || \'h2\'">{{ text }}</component>',
  },
};

function mountHome() {
  return mount(HomePage, {
    global: {
      directives: { reveal: {}, 'scroll-scale': {} },
      stubs,
    },
  });
}

describe('home presentation: image-free by construction', () => {
  it('renders the homepage with zero raster images', () => {
    const wrapper = mountHome();
    expect(wrapper.findAll('img')).toHaveLength(0);
  });

  it('offers the three specified ways in (concern, guided questions, book)', () => {
    const wrapper = mountHome();
    const doors = wrapper.findAll('.hp-door');
    expect(doors).toHaveLength(3);
    const hrefs = doors.map((d) => (d.attributes('href') ?? '').trim());
    expect(hrefs[0]).toBe('/body');
    expect(hrefs[1]).toBe('/quiz');
    expect(hrefs[2]).toBe('/booking');
    // Each door carries a real, non-empty title and description.
    for (const door of doors) {
      expect(door.find('.hp-door-title').text().trim().length).toBeGreaterThan(0);
      expect(door.find('.hp-door-desc').text().trim().length).toBeGreaterThan(0);
    }
  });

  it('leads with booking and body-exploration calls to action', () => {
    const wrapper = mountHome();
    const ctaHrefs = wrapper.findAll('a').map((a) => (a.attributes('href') ?? '').trim());
    expect(ctaHrefs).toContain('/booking');
    expect(ctaHrefs).toContain('/body');
  });

  it('never leaks a raw i18n key to the page', () => {
    const wrapper = mountHome();
    const text = wrapper.text();
    for (const key of ['Home_', 'Book_a_Healing_Session', 'Nav_', 'Donations_']) {
      expect(text).not.toContain(key);
    }
  });
});
