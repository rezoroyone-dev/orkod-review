import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import TrustStrip from '@/components/home/TrustStrip.vue';
import PageHero from '@/components/layout/PageHero.vue';

// The global setup stubs vue-i18n with a raw-key `t`, which would leak keys
// into the rendered text axe inspects. Provide readable labels instead.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key.replace(/_/g, ' '),
    locale: { value: 'en' },
  }),
}));

/**
 * Accessibility guard for the shared public surfaces.
 *
 * axe-core runs the WCAG 2 A/AA ruleset against the rendered markup. jsdom has
 * no layout engine, so contrast/spacing-dependent rules are skipped by axe
 * itself; the structural rules (roles, names, landmarks, aria) still apply. We
 * only fail on `serious` / `critical` findings, which are the ones that block
 * assistive tech.
 *
 * The context is passed as a CSS selector, not a node: `setupTests.ts` swaps
 * `global.window` for its own JSDOM, so a Vue-mounted node fails axe's
 * `instanceof window.Node` realm check. A selector is resolved against axe's
 * own document instead.
 */
async function seriousViolations(selector: string) {
  const results = await axe.run(selector, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  return results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  );
}

const stubs = {
  VIcon: { template: '<span class="v-icon-stub" aria-hidden="true" />' },
  RouterLink: { template: '<a href="#"><slot /></a>', props: ['to'] },
};

describe('a11y: public surfaces (axe-core, WCAG 2 A/AA)', () => {
  it('TrustStrip has no serious or critical violations', async () => {
    const wrapper = mount(TrustStrip, {
      attachTo: document.body,
      attrs: { id: 'a11y-trust-strip' },
      global: { directives: { reveal: {} }, stubs },
    });
    const violations = await seriousViolations('#a11y-trust-strip');
    expect(
      violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      'TrustStrip serious/critical axe violations'
    ).toEqual([]);
    wrapper.unmount();
  });

  it('PageHero has no serious or critical violations', async () => {
    const wrapper = mount(PageHero, {
      attachTo: document.body,
      attrs: { id: 'a11y-page-hero' },
      props: { eyebrow: 'Doctors_Eyebrow', title: 'Doctors_Title', subtitle: 'Doctors_Sub' },
      global: { directives: { reveal: {} }, stubs },
    });
    const violations = await seriousViolations('#a11y-page-hero');
    expect(
      violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      'PageHero serious/critical axe violations'
    ).toEqual([]);
    wrapper.unmount();
  });
});
