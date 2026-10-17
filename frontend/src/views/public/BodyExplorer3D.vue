<template>
  <main ref="pageEl" class="bx-page">
    <div class="bx-stage">
<!-- Full-bleed anatomy environment. The canvas is the page: no card, no
     cream surface, no white gutter, no border around the stage. -->
<HumanBody3D
  :active-id="active || null"
  :show-hint="false"
  :bottom-inset="bottomInset"
  :top-inset="topInset"
  toolbar-position="left-rail"
  :labels="humanLabels"
  @select="onSelect"
  @anchor="onAnchor"
/>

      <!-- Compact heading, top-left: the human is the hero, so this stays small.
           The interaction hint lives here rather than along the bottom edge,
           where the organ bar sits. -->
      <div class="bx-head" role="group">
        <span class="bx-kicker">{{ t('Body_Kicker') }}</span>
        <h1 class="bx-title">{{ t('Body_Title') }}</h1>
        <p class="bx-hint">{{ t('Body_Hint') }}</p>
      </div>

      <!--
        Leader-line callout. The container is positioned at the projected
        position of the selected organ (emitted by HumanBody3D), the dot sits
        on that exact point and the pill rides above it, so the line always
        connects to the organ the user actually clicked.
      -->
      <button
        v-if="callout && activeRegion"
        type="button"
        class="bx-callout pressable"
        :class="{ 'bx-callout--below': calloutBelow }"
        :style="{ left: callout.x + '%', top: callout.y + '%' }"
        :aria-label="t('Body_Open_Region', { region: t(activeRegion.titleKey) })"
        @click="openRegion(active!)"
      >
        <span class="bx-callout-pill">
          {{ t(activeRegion.titleKey) }}
          <v-icon size="14">mdi-arrow-right</v-icon>
        </span>
        <span class="bx-callout-stem" aria-hidden="true"></span>
        <span class="bx-callout-dot" aria-hidden="true"></span>
      </button>

      <!-- Organ selector: the seven individually selectable organs -->
      <nav ref="organsEl" class="bx-organs" :aria-label="t('Body_3D_Organs')">
        <button
          v-for="o in organs"
          :key="'org-' + o.id"
          type="button"
          class="bx-organ"
          :class="{ active: active === o.id }"
          :style="{ '--organ': o.color }"
          :aria-pressed="active === o.id"
          @click="onSelect(active === o.id ? null : o.id)"
        >
          <span class="bx-organ-swatch" aria-hidden="true"></span>
          {{ t(o.titleKey) }}
        </button>
      </nav>

      <!-- Body-area landmarks, collapsed by default so they never crowd the body -->
      <details class="bx-areas" :open="false">
        <summary class="bx-areas-summary">
          <v-icon size="16">mdi-human-male-board</v-icon>
          {{ t('Body_3D_Areas') }}
          <v-icon size="16" class="bx-areas-caret">mdi-chevron-down</v-icon>
        </summary>
        <div class="bx-areas-body">
          <div class="bx-areas-group">
            <p class="bx-areas-title">{{ t('Body_Back') }}</p>
            <div class="bx-areas-chips">
              <button
                v-for="r in backAreas"
                :key="'area-' + r.id"
                type="button"
                class="bx-area"
                :class="{ active: active === r.id }"
                :aria-pressed="active === r.id"
                @click="onSelect(active === r.id ? null : r.id)"
              >
                {{ t(r.titleKey) }}
              </button>
            </div>
          </div>
          <div class="bx-areas-group">
            <p class="bx-areas-title">{{ t('Body_Front') }}</p>
            <div class="bx-areas-chips">
              <button
                v-for="r in frontAreas"
                :key="'area2-' + r.id"
                type="button"
                class="bx-area"
                :class="{ active: active === r.id }"
                :aria-pressed="active === r.id"
                @click="onSelect(active === r.id ? null : r.id)"
              >
                {{ t(r.titleKey) }}
              </button>
            </div>
          </div>
        </div>
      </details>

      <!-- Detail card for the current selection -->
      <aside
        v-if="activeRegion"
        class="bx-panel"
        :dir="textDirection"
        :style="{ '--bx-accent': activeOrgan?.color ?? '#c4b5fd' }"
      >
        <span class="bx-panel-accent" aria-hidden="true"></span>
        <button
          type="button"
          class="bx-panel-close"
          :aria-label="t('Body_Close')"
          @click="onSelect(null)"
        >
          <v-icon size="18">mdi-close</v-icon>
        </button>
        <span class="bx-panel-eyebrow">{{ t('Body_Panel_Kicker') }}</span>
        <h2 class="bx-panel-title">
          <span
            v-if="activeOrgan"
            class="bx-panel-swatch"
            :style="{ background: activeOrgan.color }"
            aria-hidden="true"
          ></span>
          {{ t(activeRegion.titleKey) }}
        </h2>
        <p class="bx-panel-sum">{{ t(activeRegion.descKey) }}</p>
        <div class="bx-panel-actions">
          <!--
            Deliberately not Vuetify's `color="primary"`: that token is the
            site-wide brand bronze (#8C6A24) and rendered as a filled brown
            button on this page, which fought the black/purple/gold stage. The
            two actions are styled locally instead — gold for the strongest
            action, a soft purple outline for the secondary one.
          -->
          <v-btn
            :to="regionRoute(active!)"
            variant="outlined"
            size="small"
            class="pressable bx-btn bx-btn--ghost"
          >
            {{ t('Body_Panel_ReadMore') }}
          </v-btn>
          <v-btn to="/booking" size="small" elevation="0" class="pressable bx-btn bx-btn--gold">
            {{ t('Body_Panel_Book') }}
            <v-icon end size="16">mdi-calendar-check</v-icon>
          </v-btn>
        </div>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import HumanBody3D from '@/components/body/HumanBody3D.vue';
import { ANATOMY_ORGANS, isOrgan, type AnatomyOrgan } from '@/data/anatomy';
import {
  BACK_BODY_REGIONS,
  FRONT_BODY_REGIONS,
  BODY_REGIONS,
  regionById,
  regionSymptomSlug,
  type BodyRegion,
} from '@/data/body-regions';

const { t, locale } = useI18n();
const router = useRouter();

const pageEl = ref<HTMLElement | null>(null);
const organsEl = ref<HTMLElement | null>(null);
let layoutObs: ResizeObserver | null = null;

/**
 * The strip the organ bar occupies, handed to HumanBody3D so the camera frames
 * the figure above it instead of behind it. Starts at a plausible value so the
 * very first frame is already correct before the first measurement lands.
 */
const bottomInset = ref(96);

/**
 * Height of the top-left heading, but only when it would actually reach the
 * centred figure. On wide viewports the heading sits in the top-left corner
 * and the figure is centred, so they do not collide; on narrow phones the
 * heading is wider and reaches the centre-top where the head is. This is zero
 * by default and only set when the stage is narrow enough for overlap.
 */
const topInset = ref(0);

/**
 * Publishes two measurements as CSS custom properties on the page:
 *
 *   --bx-chrome-top  the public header's height, so the page can be exactly
 *                     "the rest of the viewport" and nothing falls off the
 *                     bottom edge
 *   --bx-organs-h    the organ bar's real height, which changes with wrapping
 *                     at narrow widths, so anything anchored above it (the
 *                     detail card, the body-area list, the organ-loading notice
 *                     inside HumanBody3D) stays clear of it
 *
 * Both are measured rather than guessed: the header wraps to two rows on
 * phones, and the chip bar grows a row when the labels are long. They are set on
 * the page element so the stage, the canvas overlay and HumanBody3D all inherit
 * them.
 */
function syncLayout() {
  const page = pageEl.value;
  if (!page) return;
  const header = document.querySelector('.public-header');
  const headerH =
    header instanceof HTMLElement ? Math.round(header.getBoundingClientRect().height) : 0;
  page.style.setProperty('--bx-chrome-top', `${headerH}px`);
  const bar = organsEl.value;
  const barH = bar ? Math.round(bar.getBoundingClientRect().height) : 0;
  if (barH > 0) {
    page.style.setProperty('--bx-organs-h', `${barH}px`);
    // Bar plus the 14px gap it sits from the stage edge.
    bottomInset.value = barH + 14;
  }

  // On narrow viewports the heading reaches the centre of the stage where the
  // figure's head is. Push the figure down by the heading's height only when
  // the stage is narrow enough for the overlap to happen. The breakpoint is a
  // touch under 720px — that is where the heading (max-width 300px, shifted to
  // top:60px below 900px) first intersects the centred silhouette.
  const head = document.querySelector('.bx-head') as HTMLElement | null;
  const headH = head ? Math.round(head.getBoundingClientRect().height) : 0;
  const stageW = pageEl.value ? pageEl.value.getBoundingClientRect().width : 0;
  topInset.value = stageW < 720 && headH > 0 ? headH : 0;
}

onMounted(() => {
  syncLayout();
  if (typeof ResizeObserver !== 'undefined') {
    layoutObs = new ResizeObserver(() => syncLayout());
    if (organsEl.value) layoutObs.observe(organsEl.value);
    const header = document.querySelector('.public-header');
    if (header) layoutObs.observe(header);
  }
  window.addEventListener('resize', syncLayout);
});

onBeforeUnmount(() => {
  layoutObs?.disconnect();
  layoutObs = null;
  window.removeEventListener('resize', syncLayout);
});

const textDirection = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'));

const humanLabels = computed(() => ({
  front: t('Body_Front'),
  back: t('Body_Back'),
  hint: t('Body_3D_Hint'),
  loading: t('Body_3D_Loading'),
  error: t('Body_3D_Error'),
  retry: t('Body_3D_Retry'),
  preparing: t('Body_3D_Preparing'),
  reset: t('Body_3D_Reset'),
  body: t('Body_3D_Body'),
  organs: t('Body_3D_Organs'),
  credit: t('Body_3D_Credit'),
}));

// Nothing selected by default: the first thing the visitor sees is the whole
// translucent body with every organ visible at full strength.
const active = ref<string>('');

const organs = ANATOMY_ORGANS;
const activeOrgan = computed<AnatomyOrgan | null>(
  () => organs.find((o) => o.id === active.value) ?? null
);

// Body-area landmarks: the same catalogue minus the organs, so a landmark is
// never listed twice in the two groups.
const organIds = new Set(ANATOMY_ORGANS.map((o) => o.id));
const withoutOrgans = (list: BodyRegion[]) => list.filter((r) => !organIds.has(r.id));
const backAreas = withoutOrgans(BACK_BODY_REGIONS);
const frontAreas = withoutOrgans(FRONT_BODY_REGIONS).filter((r) => r.id !== 'chest');

const callout = ref<{ id: string; x: number; y: number } | null>(null);

const allRegions = BODY_REGIONS.map((r) => ({
  id: r.id,
  titleKey: r.titleKey,
  descKey: r.descKey,
}));

function regionRoute(id: string): string {
  if (regionById(id)) return `/organs/${id}`;
  return `/symptoms/${regionSymptomSlug(id)}`;
}

const activeRegion = computed(() =>
  active.value ? allRegions.find((r) => r.id === active.value) ?? null : null
);

function onSelect(id: string | null) {
  active.value = id ?? '';
  if (!id) callout.value = null;
}

function onAnchor(payload: { id: string; x: number; y: number } | null) {
  // Only show the callout for a real 3D anchor.
  callout.value = payload && isOrgan(payload.id) ? payload : null;
}

function openRegion(id: string) {
  router.push(regionRoute(id)).catch(() => {});
}

/**
 * The callout is drawn ABOVE its anchor by default (pill -> stem -> dot), so the
 * pill grows upward, away from the organ-chip bar that sits at the bottom of the
 * stage. That is correct for every organ that projects below the top of the
 * frame, including organs that land low (the pill then simply covers part of the
 * body, which is far less disruptive than covering the controls).
 *
 * The one case that genuinely breaks is an organ near the TOP of the frame: the
 * upward pill would leave the stage and be clipped. Only then do we flip the
 * leader line so the dot stays on the organ and the pill grows downward.
 *
 * Purely presentational: the anchor, the 3D scene, the camera and the controls
 * are untouched.
 */
const calloutBelow = computed(() => {
  const y = callout.value?.y;
  if (y === undefined) return false;
  return y < 30;
});
</script>

<style scoped lang="scss">
/*
 * Orkod /body design system — DARK PURPLE & GOLD ENVIRONMENT.
 *
 * This page uses the global Orkod purple/gold tokens (defined in
 * styles/_themes.scss and exposed as CSS custom properties on :root).
 * The /body page is a dedicated dark visualization environment that layers
 * the global tokens with its own stage-specific glows and depth.
 *
 * Global tokens used:
 *   --color-purple-deepest, --color-purple-dark, --color-purple-deep,
 *   --color-purple-primary, --color-purple-bright, --color-purple-lavender,
 *   --color-gold-primary, --color-gold-champagne, --color-gold-light,
 *   --gradient-body-void, --gradient-body-purple, --gradient-body-gold-core,
 *   --gradient-body-violet, --color-text-primary, --color-border, etc.
 */
.bx-page {
  /* The room — near-black void with subtle depth layers. */
  background-color: var(--color-purple-deepest);
  background-image:
    var(--gradient-body-gold-core),
    var(--gradient-body-violet),
    var(--gradient-body-purple),
    var(--gradient-body-void);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center, center, center, center;

  /* The page itself is exactly the space the stage occupies, so the void runs
     to the bottom of the viewport with no seam under the canvas. */
  height: calc(100svh - var(--bx-chrome-top, 0px));
  min-height: 520px;
  padding-block: 0;
  overflow: hidden;
}

.bx-stage {
  position: relative;
  width: 100%;
  max-width: none;
  margin: 0;
  height: 100%;
  min-height: 520px;
  background-color: transparent; /* Page background shows through */
}

/* ── Heading ── */
.bx-head {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 5;
  max-width: 300px;
  color: var(--color-purple-vlight);
  pointer-events: none;
}

.bx-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-purple-bright);
}

.bx-title {
  margin: 6px 0 0;
  font-size: clamp(19px, 2.1vw, 25px);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 24px rgba(2, 2, 4, 0.9);
}

.bx-hint {
  margin: 6px 0 0;
  color: rgba(206, 192, 246, 0.72);
  font-size: 12.5px;
  line-height: 1.45;
  text-shadow: 0 1px 14px rgba(2, 2, 4, 0.9);
}

/* ── Leader-line callout ── */
.bx-callout {
  position: absolute;
  z-index: 8;
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font: inherit;
  animation: bx-callout-pop 240ms var(--ease-spring, var(--ease-out)) both;
}

/* Flipped leader line: dot touches the organ, pill grows downward. Used when the
   organ sits low in the frame (would collide with the organ-chip bar) or very
   high (pill would leave the stage). */
.bx-callout--below {
  transform: translate(-50%, 0);
  flex-direction: column-reverse;
  /* A filled keyframe transform outranks any normal declaration, so the pop
     animation above was still shifting the whole flipped callout up by its own
     height and lifted the dot off the organ. Point it at a keyframe set that
     keeps the flipped variant anchored where the projection says it is. */
  animation-name: bx-callout-pop-below;
}

.bx-callout-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 15px;
  border-radius: 999px;
  color: #120a04;
  font-size: 0.86rem;
  font-weight: 800;
  /* The one important call to action on the page, so it is the one place gold
     is allowed to be solid. */
  background: var(--gradient-gold-primary);
  border: 1px solid var(--color-gold-champagne);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  transition: transform 160ms var(--ease-out), box-shadow 160ms ease;
}

/* The stem connects the pill to the dot that sits on the organ. */
.bx-callout-stem {
  width: 2px;
  height: 42px;
  background: linear-gradient(180deg, var(--color-gold-champagne), var(--color-purple-bright));
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
}

.bx-callout-dot {
  width: 11px;
  height: 11px;
  margin-top: -5px;
  border-radius: 50%;
  background: var(--color-gold-light);
  border: 2px solid var(--color-gold-champagne);
  box-shadow: 0 0 0 4px rgba(169, 139, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.7);
}

.bx-callout:hover .bx-callout-pill {
  transform: translateY(-2px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.78);
}

.bx-callout:hover .bx-callout-pill :deep(.v-icon) {
  transform: translateX(3px);
}

[dir='rtl'] .bx-callout-pill :deep(.v-icon) {
  transform: scaleX(-1);
}

[dir='rtl'] .bx-callout:hover .bx-callout-pill :deep(.v-icon) {
  transform: scaleX(-1) translateX(3px);
}

@keyframes bx-callout-pop {
  from {
    opacity: 0;
    transform: translate(-50%, -88%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}

/* Same pop for the flipped leader line, but it ends at translate(-50%, 0) so
   the dot — which is the first child when the column is reversed — stays on the
   organ instead of riding up with the animation. */
@keyframes bx-callout-pop-below {
  from {
    opacity: 0;
    transform: translate(-50%, 12%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* ── Organ selector ── */
.bx-organs {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 7;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  width: max-content;
  max-width: calc(100% - 48px);
  padding: 7px;
  border-radius: 999px;
  background: var(--color-purple-deepest);
  border: 1px solid var(--color-purple-primary);
  backdrop-filter: blur(12px);
}

.bx-organ {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid var(--color-purple-primary);
  background: var(--color-purple-soft);
  color: var(--color-purple-vlight);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms var(--ease-out), border-color 150ms var(--ease-out);
}

.bx-organ-swatch {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--organ);
  box-shadow: 0 0 0 2px rgba(243, 239, 255, 0.2), 0 0 9px var(--organ);
}

.bx-organ:hover {
  background: var(--color-purple-pale);
  border-color: var(--color-purple-bright);
}

.bx-organ.active {
  background: var(--color-white);
  border-color: var(--organ);
  color: var(--color-purple-deepest);
  box-shadow: 0 0 0 2px var(--color-gold-champagne);
}

.bx-organ:focus-visible {
  outline: 2px solid var(--color-gold-light);
  outline-offset: 2px;
}

/* ── Collapsed body-area landmarks ── */
.bx-areas {
  position: absolute;
  bottom: calc(var(--bx-organs-h, 56px) + 26px);
  left: 20px;
  z-index: 7;
  max-width: min(290px, calc(100% - 40px));
  border-radius: 16px;
  background: var(--color-purple-deepest);
  border: 1px solid var(--color-purple-primary);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.bx-areas-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  color: var(--color-purple-lavender);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.bx-areas-summary::-webkit-details-marker {
  display: none;
}

.bx-areas-caret {
  margin-inline-start: auto;
  transition: transform 180ms var(--ease-out);
}

.bx-areas[open] .bx-areas-caret {
  transform: rotate(180deg);
}

.bx-areas-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 13px 13px;
  max-height: 40svh;
  overflow: auto;
}

.bx-areas-title {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(178, 148, 255, 0.82);
}

.bx-areas-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bx-area {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(150, 118, 224, 0.22);
  background: rgba(75, 47, 150, 0.16);
  color: #ddd2ff;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Touch only: these chips are ~31px tall on desktop. Coarse pointers get a
   comfortable thumb target; the desktop chip layout is unchanged. */
@media (pointer: coarse) {
  .bx-area {
    min-height: 44px;
    padding: 10px 16px;
  }
}

.bx-area:hover {
  background: rgba(96, 66, 186, 0.34);
}

.bx-area.active {
  background: linear-gradient(135deg, #5b3aa8, #341f66);
  border-color: rgba(178, 148, 255, 0.7);
  color: #fff;
}

.bx-area:focus-visible {
  outline: 2px solid #F1D27A;
  outline-offset: 2px;
}

/* ── Detail card ── */
.bx-panel {
  position: absolute;
  /* Anchored above the organ bar's measured height, so it never sits on it even
     when the chips wrap to a second row. */
  bottom: calc(var(--bx-organs-h, 56px) + 26px);
  right: 20px;
  z-index: 6;
  width: min(310px, calc(100% - 40px));
  padding: 18px;
  border-radius: 18px;
  background: rgba(7, 5, 18, 0.92);
  border: 1px solid rgba(146, 112, 224, 0.36);
  backdrop-filter: blur(14px);
  color: #f3efff;
  overflow: hidden;
  transform-origin: bottom right;
  animation: bx-panel-in 420ms var(--ease-out) both;
}

[dir='rtl'] .bx-panel {
  transform-origin: bottom left;
  animation-name: bx-panel-in-rtl;
}

/* Organ-tinted accent: a soft top-edge glow in the selected organ's own colour. */
.bx-panel-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--bx-accent, #c4b5fd), transparent);
  opacity: 0.9;
}

.bx-panel-accent::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 240% at 50% 0%, var(--bx-accent, #c4b5fd), transparent 70%);
  opacity: 0.35;
  filter: blur(6px);
}

@keyframes bx-panel-in {
  from {
    opacity: 0;
    transform: translate(18px, 10px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
}

@keyframes bx-panel-in-rtl {
  from {
    opacity: 0;
    transform: translate(-18px, 10px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
}

.bx-panel-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(150, 118, 224, 0.32);
  background: rgba(75, 47, 150, 0.22);
  color: #e2d6ff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.bx-panel-eyebrow {
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #b294ff;
  font-weight: 700;
}

.bx-panel-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 6px 0 8px;
  font-size: 20px;
}

.bx-panel-swatch {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  box-shadow: 0 0 10px var(--bx-accent, currentColor);
}

.bx-panel-sum {
  margin: 0;
  color: rgba(226, 214, 255, 0.8);
  font-size: 13.5px;
  line-height: 1.55;
}

.bx-panel-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

/* Local action buttons. These replace Vuetify's `color="primary"` buttons,
   which resolved to the site-wide brand bronze and read as brown against this
   page. `:deep` is needed because v-btn renders its own inner elements. */
.bx-btn {
  letter-spacing: 0.02em;
  font-weight: 700;
  border-radius: 999px;
}

.bx-btn--ghost {
  border: 1px solid rgba(169, 139, 255, 0.5) !important;
  background: rgba(50, 19, 90, 0.35) !important;
  color: #d9ccff !important;
}

.bx-btn--ghost:hover {
  background: rgba(80, 40, 150, 0.45) !important;
  border-color: rgba(199, 184, 255, 0.75) !important;
}

/* The single strongest action on the page, so the one place a solid gold fill
   is allowed. */
.bx-btn--gold {
  background: linear-gradient(135deg, #F1D27A, #D4AF37) !important;
  color: #150d24 !important;
  border: 1px solid rgba(240, 213, 138, 0.7) !important;
}

.bx-btn--gold:hover {
  background: linear-gradient(135deg, #fbe6b0, #F1D27A) !important;
}

.bx-btn:focus-visible {
  outline: 2px solid #F1D27A;
  outline-offset: 2px;
}

@media (max-width: 900px) {
  .bx-page {
    padding-block: 0;
    min-height: 460px;
  }

  .bx-stage {
    width: 100%;
    height: 100%;
    min-height: 460px;
  }

  /* Below this width the layer controls run almost the full width of the stage,
     so the heading moves under them rather than fighting them for the top-left
     corner. The figure is centred and its head starts well below this line. */
  .bx-head {
    top: 60px;
    left: 16px;
    max-width: calc(100% - 32px);
  }

  .bx-areas {
    display: none;
  }

  .bx-panel {
    right: 12px;
    left: 12px;
    bottom: calc(var(--bx-organs-h, 56px) + 26px);
    width: auto;
  }

  .bx-organs {
    bottom: 14px;
    max-width: calc(100% - 24px);
    border-radius: 22px;
  }
}

/* Narrow phones: the seven chips must stay within a compact bar, so they shrink
   rather than wrapping into four rows and pushing the figure's feet off screen. */
@media (max-width: 480px) {
  .bx-organ {
    gap: 5px;
    padding: 5px 9px;
    font-size: 11.5px;
  }

  .bx-organ-swatch {
    width: 9px;
    height: 9px;
  }

  .bx-organs {
    gap: 4px;
    padding: 6px;
  }
}
</style>

<!--
  Not scoped, but anchored to `.bx-page`, so it can only ever affect this page.

  `styles/_global.scss` sets `*:focus-visible { outline: 2px solid
  var(--color-turquoise) }`, and `--color-turquoise` is the site-wide brand
  bronze #8C6A24. Every focusable control on /body that has no local rule of its
  own — the area-list summary, the credit link, the callout, the panel close
  button — was therefore drawing a brown keyboard-focus ring. This one rule
  re-points the whole page's focus ring at the soft gold from the palette above.
  It is deliberately the single authority so the ring cannot drift back to the
  global bronze.
-->
<style lang="scss">
.bx-page *:focus-visible {
  outline: 2px solid #F1D27A;
  outline-offset: 2px;
}

/* Text selection inside the stage should not paint the cream/olive global
   highlight either. */
.bx-page ::selection {
  background: rgba(109, 59, 232, 0.55);
  color: #fff;
}
</style>