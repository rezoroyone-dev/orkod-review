<template>
  <section class="ph-page-hero" :dir="textDirection">
    <span class="ph-grain" aria-hidden="true"></span>
    <div class="ph-inner">
      <div v-if="backTo || $slots.breadcrumb" class="ph-crumbs">
        <router-link v-if="backTo" :to="backTo" class="ph-back">
          <v-icon start size="18">{{ backIcon }}</v-icon>
          {{ t(backLabel) }}
        </router-link>
        <span v-if="backTo && $slots.breadcrumb" class="ph-sep" aria-hidden="true">/</span>
        <span v-if="$slots.breadcrumb" class="ph-crumb"><slot name="breadcrumb" /></span>
      </div>
      <p v-if="eyebrow" class="ph-eyebrow">{{ t(eyebrow) }}</p>
      <SplitHeading tag="h1" class="ph-title" :text="resolvedTitle" />
      <p v-if="resolvedSubtitle" class="ph-subtitle">{{ resolvedSubtitle }}</p>
      <div v-if="$slots.actions" class="ph-actions"><slot name="actions" /></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SplitHeading from '@/components/common/SplitHeading.vue';

const props = withDefaults(
  defineProps<{
    eyebrow?: string;
    title?: string;
    titleText?: string;
    subtitle?: string;
    subtitleText?: string;
    backTo?: string;
    backLabel?: string;
  }>(),
  { backLabel: 'PageHero_Back' }
);

const { t, locale } = useI18n();
const textDirection = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'));
const backIcon = computed(() => (locale.value === 'ar' ? 'mdi-arrow-right' : 'mdi-arrow-left'));

// `title` / `subtitle` are i18n keys; `titleText` / `subtitleText` let a caller
// pass an already-resolved string (e.g. a topic name from the route) verbatim.
const resolvedTitle = computed(() => props.titleText ?? (props.title ? t(props.title) : ''));
const resolvedSubtitle = computed(() => props.subtitleText ?? (props.subtitle ? t(props.subtitle) : ''));
</script>

<style scoped lang="scss">
.ph-page-hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(120% 150% at 88% -14%, rgba(212, 175, 55, 0.16), transparent 55%),
    radial-gradient(100% 130% at -6% 118%, rgba(139, 92, 246, 0.10), transparent 62%),
    linear-gradient(160deg, #140C29 0%, #0B0718 52%, #160D2B 100%);
  padding-block: 88px 96px;
}

.ph-grain {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.35;
  mix-blend-mode: soft-light;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
}

.ph-page-hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  inset-inline: 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0.55) 50%, rgba(212, 175, 55, 0) 100%);
}

.ph-inner {
  position: relative;
  z-index: 1;
  width: min(100% - 32px, 1280px);
  margin-inline: auto;
  animation: ph-hero-rise 620ms var(--ease-out) both;
}

@keyframes ph-hero-rise {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ph-crumbs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  font-size: 0.85rem;
}

.ph-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #F3EFFC;
  text-decoration: none;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 3px;
  background: rgba(240, 236, 250, 0.04);
  border: 1px solid rgba(240, 236, 250, 0.12);
  transition: color 180ms ease, background 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.ph-back:hover {
  color: #E9C766;
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.4);
}

[dir="rtl"] .ph-back:hover { transform: translateX(3px); }

.ph-sep { color: rgba(240, 236, 250, 0.3); }

.ph-crumb {
  color: #E9C766;
  font-weight: 600;
}

.ph-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 20px;

  &::before {
    content: '';
    width: 40px;
    height: 1px;
    border-radius: 1px;
    background: #D4AF37;
  }
}

html[dir="rtl"] .ph-eyebrow::before { width: 0; }

.ph-title {
  font-size: clamp(2.4rem, 5.4vw, 4rem);
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.03em;
  color: #F3EFFC;
  margin: 0 0 20px;
  max-width: 820px;
}

html[dir="ltr"] .ph-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.ph-subtitle {
  font-size: 1.15rem;
  line-height: 1.8;
  color: rgba(240, 236, 250, 0.62);
  margin: 0;
  max-width: 720px;
}

.ph-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 36px;
}

@media (max-width: 640px) {
  .ph-page-hero { padding-block: 56px 68px; }
  .ph-crumbs { margin-bottom: 20px; }
  .ph-eyebrow { justify-content: center; }
  .ph-actions { justify-content: center; }
}
</style>