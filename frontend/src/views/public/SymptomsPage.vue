<template>
  <div>
    <PageHero eyebrow="Symptoms_Eyebrow" :title="t('Symptoms_Title')" :subtitle="t('Symptoms_Subtitle')" />

    <section class="sym-section">
      <div class="sym-inner">
        <!-- Body map sidebar + search -->
        <div class="sym-toolbar">
          <div class="sym-figure" role="group" :aria-label="t('Symptoms_Title')">
            <BodySilhouette />
            <svg class="sym-zones" viewBox="0 0 477 1000" role="img" :aria-label="t('Symptoms_Title')">
              <ellipse
                v-for="zone in zones"
                :key="zone.region"
                class="sym-zone"
                :class="{ active: activeRegion === zone.region }"
                :cx="zone.cx"
                :cy="zone.cy"
                :rx="zone.rx"
                :ry="zone.ry"
                :data-region="zone.region"
                role="button"
                :aria-label="t(regionKey(zone.region))"
                :aria-pressed="activeRegion === zone.region"
                :tabindex="0"
                @click="toggleRegion(zone.region)"
                @keydown.enter="toggleRegion(zone.region)"
              />
            </svg>
            <span v-if="activeRegion !== 'all'" class="sym-figure-tag">
              {{ t(regionKey(activeRegion)) }}
            </span>
          </div>

          <div class="sym-controls">
            <v-text-field
              v-model="search"
              variant="outlined"
              density="comfortable"
              hide-details
              :placeholder="t('Symptoms_Search_Placeholder')"
              prepend-inner-icon="mdi-magnify"
              class="sym-search"
              clearable
            />

            <p class="sym-chips-label">{{ t('Explore_Browse') }}</p>
            <div class="sym-chips">
              <v-chip
                v-for="region in regionOptions"
                :key="region.id"
                variant="flat"
                class="sym-chip"
                :class="{ active: activeRegion === region.id }"
                :aria-pressed="activeRegion === region.id"
                @click="toggleRegion(region.id)"
              >
                {{ region.id === 'all' ? t('Symptoms_Region_All') : t(region.labelKey) }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Editorial intro -->
        <div class="sym-editorial" v-reveal.up>
          <p class="sym-editorial-eyebrow">{{ t('Symptoms_Editorial_Eyebrow') }}</p>
          <h2 class="sym-editorial-title">{{ t('Symptoms_Editorial_Title') }}</h2>
          <p class="sym-editorial-text">{{ t('Symptoms_Editorial_Text') }}</p>
        </div>

        <!-- Grid -->
        <div v-if="filteredTopics.length" class="sym-grid">
          <router-link
            v-for="(topic, i) in filteredTopics"
            :key="topic.slug"
            class="topic-card card-interactive"
            :to="'/symptoms/' + topic.slug"
            v-reveal
            :style="{ '--reveal-delay': `${40 + (i % 8) * 60}ms` }"
          >
            <span class="tc-icon"><v-icon size="28">{{ topic.icon }}</v-icon></span>
            <div class="tc-body">
              <h3 class="tc-title">{{ contentOf(topic).title }}</h3>
              <p class="tc-summary">{{ contentOf(topic).summary }}</p>
              <span class="tc-link">{{ t('Symptoms_Topic_Guide') }}
                <v-icon size="16" class="tc-arrow arrow-shift">mdi-arrow-right</v-icon>
              </span>
            </div>
          </router-link>
        </div>

        <v-empty-state
          v-else
          :text="t('Symptoms_No_Results')"
          icon="mdi-magnify-close"
        />

        <div class="sym-disclaimer">
          <Disclaimer variant="notice">
            {{ t('Symptoms_Disclaimer') }}
          </Disclaimer>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import BodySilhouette from '@/components/body/BodySilhouette.vue';
import { TOPICS, type LangCode, type RegionId, type Topic } from '@/data/wellness';

const { t, locale } = useI18n();
const route = useRoute();

const VALID_REGIONS: (RegionId | 'all')[] = ['all', 'head', 'neck', 'shoulders', 'back', 'abdomen', 'legs'];

function regionFromQuery(): RegionId | 'all' {
  const r = route.query.region;
  return typeof r === 'string' && (VALID_REGIONS as string[]).includes(r) ? (r as RegionId) : 'all';
}

const activeRegion = ref<RegionId | 'all'>(regionFromQuery());
const search = ref('');

watch(
  () => route.query.region,
  () => { activeRegion.value = regionFromQuery(); }
);

interface RegionOption {
  id: RegionId | 'all';
  labelKey: string;
}

const regionOptions: RegionOption[] = [
  { id: 'all', labelKey: 'Symptoms_Region_All' },
  { id: 'head', labelKey: 'Region_Head' },
  { id: 'neck', labelKey: 'Region_Neck' },
  { id: 'shoulders', labelKey: 'Region_Shoulder' },
  { id: 'back', labelKey: 'Region_Back' },
  { id: 'abdomen', labelKey: 'Region_Abdomen' },
  { id: 'legs', labelKey: 'Region_Legs' },
];

const regionKeyMap: Record<RegionId, string> = {
  head: 'Region_Head',
  neck: 'Region_Neck',
  shoulders: 'Region_Shoulder',
  chest: 'Region_Chest',
  arms: 'Region_Arms',
  abdomen: 'Region_Abdomen',
  back: 'Region_Back',
  pelvis: 'Region_Pelvis',
  legs: 'Region_Legs',
  hands: 'Region_Arms',
  feet: 'Region_Legs',
};

function regionKey(region: RegionId): string {
  return regionKeyMap[region];
}

const zones: { region: RegionId; cx: number; cy: number; rx: number; ry: number }[] = [
  { region: 'head', cx: 253, cy: 80, rx: 58, ry: 70 },
  { region: 'neck', cx: 255, cy: 163, rx: 54, ry: 30 },
  { region: 'shoulders', cx: 252, cy: 240, rx: 176, ry: 58 },
  { region: 'abdomen', cx: 240, cy: 432, rx: 88, ry: 46 },
  { region: 'legs', cx: 240, cy: 725, rx: 100, ry: 170 },
];

function toggleRegion(id: RegionId | 'all') {
  activeRegion.value = activeRegion.value === id ? 'all' : id;
}

function contentOf(topic: Topic) {
  const lang = (locale.value as LangCode) in topic.content ? (locale.value as LangCode) : 'en';
  return topic.content[lang];
}

const filteredTopics = computed(() => {
  const q = search.value.trim().toLowerCase();
  return TOPICS.filter((topic) => {
    if (activeRegion.value !== 'all' && topic.region !== activeRegion.value) return false;
    if (!q) return true;
    const c = contentOf(topic);
    return (
      c.title.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q)
    );
  });
});
</script>

<style scoped lang="scss">
.sym-section {
  position: relative;
  padding-block: clamp(64px, 9vw, 112px);
  background: #0B0718;
  color: #F3EFFC;
}

.sym-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

.sym-toolbar {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 36px;
  align-items: start;
  margin-bottom: 48px;
}

.sym-figure {
  position: relative;
  width: 100%;
  max-width: 280px;
  margin-inline: auto;
  aspect-ratio: 477 / 1000;
  background: linear-gradient(180deg, rgba(109, 40, 217, 0.1) 0%, rgba(240, 236, 250, 0.05) 100%);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 3px;
}

.sym-zones {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.sym-zone {
  fill: rgba(212, 175, 55, 0.08);
  stroke: rgba(212, 175, 55, 0.4);
  stroke-width: 1.2;
  stroke-dasharray: 3 4;
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center;
  transition: fill 200ms ease, stroke 200ms ease;
}

.sym-zone:hover,
.sym-zone.active {
  fill: rgba(212, 175, 55, 0.25);
  stroke: var(--color-turquoise);
  stroke-width: 2;
  stroke-dasharray: none;
}

.sym-zone.active {
  fill: var(--color-gold-strong);
  stroke: var(--color-gold-strong);
}

.sym-figure-tag {
  position: absolute;
  inset-inline-start: 10px;
  bottom: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 700;
}

.sym-controls {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
}

.sym-search { max-width: 100%; }

.sym-chips-label {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 12px;
}

.sym-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sym-chip {
  font-weight: 600;
  background: transparent;
  border: 1px solid rgba(240, 236, 250, 0.16);
  border-radius: 2px;
  color: #F3EFFC;
  text-transform: none;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
}

.sym-chip:hover {
  border-color: #D4AF37;
  color: #D4AF37;
}

.sym-chip.active {
  background: linear-gradient(135deg, #f1d27a 0%, #d4af37 100%);
  border-color: transparent;
  color: #1c1327;
}

/* ── Editorial ── */
.sym-editorial {
  max-width: 720px;
  margin: 0 auto 56px;
  padding: 0 24px;
  text-align: center;
}

.sym-editorial-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 18px;
  justify-content: center;

  &::before {
    content: '';
    width: 36px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.9));
  }
}

html[dir="rtl"] .sym-editorial-eyebrow::before { width: 0; }

.sym-editorial-title {
  font-size: clamp(1.8rem, 3.4vw, 2.8rem);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: #F3EFFC;
  margin: 0 0 18px;
}

html[dir="ltr"] .sym-editorial-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

html[dir="rtl"] .sym-editorial-title {
  font-family: var(--font-family-arabic);
}

.sym-editorial-text {
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
  max-width: 640px;
  margin-inline: auto;
}

/* ── Grid ── */
.sym-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.topic-card {
  display: flex;
  gap: 20px;
  padding: 32px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  text-decoration: none;
  transition: border-color 240ms var(--ease-out), transform 240ms var(--ease-out);
}

.topic-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.tc-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #2a1450 0%, #6d28d9 100%);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.tc-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tc-title {
  font-size: 1.15rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 10px;
  line-height: 1.25;
}

html[dir="ltr"] .tc-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.tc-summary {
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(240, 236, 250, 0.6);
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tc-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #D4AF37;
  transition: color 180ms ease;
}

.topic-card:hover .tc-link {
  color: #E9C766;
}

.tc-arrow {
  transition: transform 200ms var(--ease-out);
}

[dir='rtl'] .tc-arrow { transform: scaleX(-1); }
.topic-card:hover .tc-arrow { transform: none; }
[dir='rtl'] .topic-card:hover .tc-arrow { transform: none; }

.sym-disclaimer {
  margin-top: 56px;
  max-width: 860px;
  margin-inline: auto;
}

@media (max-width: 900px) {
  .sym-toolbar {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .sym-figure { width: 220px; }
}

@media (max-width: 640px) {
  .sym-figure { display: none; }
  .sym-editorial { padding: 0; }
}
</style>