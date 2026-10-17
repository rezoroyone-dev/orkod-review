import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BodyExplorer3D from '@/views/public/BodyExplorer3D.vue';
import { ANATOMY_ORGANS } from '@/data/anatomy';

// Opening a selected organ must end in router.push(route). The full-screen
// /body page only pushes through the callout; the detail-card buttons are
// Vuetify `v-btn :to` links (stubbed below).
const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: (route: string) => {
      pushMock(route);
      return Promise.resolve();
    },
  }),
}));

// The global test setup already mocks vue-i18n (t returns the key). Provide
// human-readable labels here so title/aria assertions are meaningful.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key.replace(/_/g, ' '),
    locale: { value: 'en' },
  }),
}));

// The 3D stage builds a WebGL context, which jsdom cannot provide. Stub the
// stage and drive its real `select` / `anchor` contracts directly, so these
// assertions cover the page's own selection, callout and routing logic.
const HumanBody3DStub = defineComponent({
  name: 'HumanBody3D',
  props: {
    activeId: { type: String, default: null },
    labels: { type: Object, default: () => ({}) },
    showHint: { type: Boolean, default: true },
    bottomInset: { type: Number, default: 0 },
    topInset: { type: Number, default: 0 },
    toolbarPosition: { type: String, default: 'top-right' },
  },
  emits: ['select', 'anchor'],
  template: '<div class="human3d-stage-stub" />',
});

function mountExplorer() {
  return mount(BodyExplorer3D, {
    global: {
      directives: { reveal: {} },
      stubs: {
        HumanBody3D: HumanBody3DStub,
        VBtn: {
          template: '<button type="button"><slot /><slot name="append" /></button>',
          props: ['to', 'variant', 'size', 'elevation', 'end'],
        },
        VIcon: { template: '<span class="v-icon-stub" aria-hidden="true" />' },
      },
    },
  });
}

describe('BodyExplorer3D — /body organ interactions', () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders exactly the seven individually selectable organs, in order', () => {
    const wrapper = mountExplorer();
    const chips = wrapper.findAll('.bx-organ');
    expect(chips).toHaveLength(7);
    expect(chips.map((c) => c.attributes('aria-pressed'))).toEqual(
      Array(7).fill('false')
    );
    // Each chip carries its own organ swatch colour (needed to tell them apart).
    const swatches = chips.map((c) => c.attributes('style') ?? '');
    expect(new Set(swatches).size).toBe(7);
    // Nothing is selected on first paint: no panel, no callout.
    expect(wrapper.find('.bx-panel').exists()).toBe(false);
    expect(wrapper.find('.bx-callout').exists()).toBe(false);
  });

  it('selects and deselects an organ through the chip, with a detail card', async () => {
    const wrapper = mountExplorer();
    const heart = wrapper.find('.bx-organ:nth-child(3)');
    expect(heart.text()).toContain('Region Heart');

    await heart.trigger('click');
    const active = wrapper.find('.bx-organ.active');
    expect(active.exists()).toBe(true);
    expect(active.attributes('aria-pressed')).toBe('true');
    expect(active.text()).toContain('Region Heart');

    // The detail card names the selected organ.
    expect(wrapper.find('.bx-panel').exists()).toBe(true);
    expect(wrapper.find('.bx-panel-title').text()).toContain('Region Heart');

    // Selecting a chip never auto-navigates.
    vi.advanceTimersByTime(1000);
    expect(pushMock).not.toHaveBeenCalled();

    // Clicking the active chip again clears the selection and hides the card.
    await active.trigger('click');
    expect(wrapper.find('.bx-organ.active').exists()).toBe(false);
    expect(wrapper.find('.bx-panel').exists()).toBe(false);
  });

  it('routes to the organ page when the callout is opened, exactly once', async () => {
    const wrapper = mountExplorer();
    await wrapper.find('.bx-organ:nth-child(3)').trigger('click'); // heart

    const human = wrapper.findComponent({ name: 'HumanBody3D' });
    await human.vm.$emit('anchor', { id: 'heart', x: 50, y: 40 });
    await wrapper.vm.$nextTick();

    const callout = wrapper.find('.bx-callout');
    expect(callout.exists()).toBe(true);
    expect((callout.attributes('aria-label') ?? '').length).toBeGreaterThan(0);

    await callout.trigger('click');
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/organs/heart');
  });

  it('accepts a select event from the 3D stage as if the organ were clicked in the scene', async () => {
    const wrapper = mountExplorer();
    const human = wrapper.findComponent({ name: 'HumanBody3D' });
    await human.vm.$emit('select', 'intestines');
    await wrapper.vm.$nextTick();

    const active = wrapper.find('.bx-organ.active');
    expect(active.text()).toContain('Region Intestines');
    expect(wrapper.find('.bx-panel-title').text()).toContain('Region Intestines');
  });

  it('never shows an organ callout for a non-organ anchor', async () => {
    const wrapper = mountExplorer();
    await wrapper.find('.bx-organ:nth-child(3)').trigger('click');
    const human = wrapper.findComponent({ name: 'HumanBody3D' });
    await human.vm.$emit('anchor', { id: 'back', x: 50, y: 60 });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.bx-callout').exists()).toBe(false);
  });

  it('exposes the non-organ body areas as fallback landmarks', () => {
    const wrapper = mountExplorer();
    const areas = wrapper.findAll('.bx-area');
    // The body-area catalogue minus the seven organs, split back/front.
    expect(areas.length).toBeGreaterThan(0);
    const organLabels = ANATOMY_ORGANS.map((o) => o.titleKey.replace(/_/g, ' '));
    for (const area of areas) {
      expect(organLabels).not.toContain(area.text());
    }
  });
});
