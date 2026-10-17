<template>
  <div>
    <PageHero
      eyebrow="Organ_Kicker"
      :title="regionKey(activeRegion)"
      :subtitle="regionDescKey(activeRegion)"
      back-to="/body"
      :back-label="pageBackLabel"
    />

    <section class="org-section">
      <div class="org-inner">
        <template v-if="activeRegion">
          <!-- Identity strip: ties this page back to the 3D selection so the
               journey reads as one continuous experience. -->
          <div class="org-identity" v-reveal.up>
            <span class="org-identity-swatch" :style="{ background: regionColor }" aria-hidden="true"></span>
            <div class="org-identity-text">
              <span class="org-identity-label">{{ t('Organ_Identity_Label') }}</span>
              <strong class="org-identity-name">{{ t(regionKey(activeRegion)) }}</strong>
            </div>
            <router-link to="/body" class="org-identity-back pressable">
              <v-icon size="16" class="org-identity-back-ico">mdi-human-male-height</v-icon>
              {{ t('Organ_Identity_Reopen') }}
            </router-link>
          </div>

          <!-- Placeholder for the medical/healing content that has not been
               supplied yet. Deliberately says so rather than inventing copy. -->
          <section class="org-about" v-reveal.up>
            <h2 class="org-about-title">{{ t('Organ_About_Title') }}</h2>
            <div class="org-about-placeholder">
              <v-icon size="22" class="org-about-ico">mdi-file-document-outline</v-icon>
              <p class="org-about-text">{{ t('Organ_About_Pending') }}</p>
              <span class="org-about-note">{{ t('Organ_About_Placeholder_Note') }}</span>
            </div>
          </section>

          <div class="org-guides-head" v-reveal.up>
            <h2 class="org-guides-title">{{ t('Organ_Guides_Title') }}</h2>
            <p class="org-guides-sub">{{ t('Organ_Guides_Intro') }}</p>
          </div>

          <div v-if="guides.length" class="org-grid">
            <router-link
              v-for="(g, i) in guides"
              :key="g.slug"
              class="org-card card-interactive"
              :to="'/symptoms/' + g.slug"
              v-reveal
              :style="{ '--reveal-delay': `${40 + (i % 8) * 60}ms` }"
            >
              <span class="org-card-ico"><v-icon size="26">{{ g.icon }}</v-icon></span>
              <div class="org-card-body">
                <h3 class="org-card-title">{{ g.title }}</h3>
                <p class="org-card-summary">{{ g.summary }}</p>
                <span class="org-card-link">
                  {{ t('Symptoms_Topic_Guide') }}
                  <v-icon size="16" class="org-card-arrow arrow-shift">mdi-arrow-right</v-icon>
                </span>
              </div>
            </router-link>
          </div>

          <v-empty-state
            v-else
            :text="t('Search_No_All')"
            icon="mdi-map-marker-question"
          />

          <div class="org-actions">
            <v-btn :to="`/specialty/${primarySlug}`" color="primary" elevation="0" size="large" class="pressable">
              {{ t('Symptom_Book_CTA') }}
              <v-icon end>mdi-calendar-check</v-icon>
            </v-btn>
            <v-btn to="/body" variant="outlined" color="primary" size="large" class="pressable">
              {{ t('Body_CTA') }}
              <v-icon end>mdi-human</v-icon>
            </v-btn>
          </div>

          <div class="org-disclaimer">
            <Disclaimer variant="notice">
              {{ t('Symptoms_Disclaimer') }}
            </Disclaimer>
          </div>
        </template>

        <v-empty-state
          v-else
          icon="mdi-map-marker-question"
          :title="t('Body_Fallback')"
          :text="t('Search_No_All')"
        >
          <template #actions>
            <v-btn to="/body" color="primary" elevation="0">{{ t('Organ_Back_Link') }}</v-btn>
          </template>
        </v-empty-state>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import { regionById } from '@/data/body-regions';
import { ANATOMY_ORGANS } from '@/data/anatomy';
import { TOPICS, LangCode } from '@/data/wellness';

const { t, locale } = useI18n();
const route = useRoute();

const currentLocale = computed(() => (locale.value as LangCode) || 'en');

const regionParam = computed(() =>
  typeof route.params.region === 'string' ? route.params.region : ''
);

const activeRegion = computed(() =>
  regionParam.value ? regionById(regionParam.value) : undefined
);

const pageBackLabel = computed(() =>
  locale.value === 'ar' ? 'Organ_Back_Link' : 'Body_CTA'
);

function regionKey(region: { titleKey: string } | undefined): string {
  return region ? region.titleKey : 'Organs_NotFound';
}

function regionDescKey(region: { descKey: string } | undefined): string {
  return region ? region.descKey : 'Body_Fallback';
}

const primarySlug = computed(() => activeRegion.value?.symptomSlug ?? 'back-pain');

/**
 * Reuse the exact organ colour from the 3D body so the swatch here matches what
 * the user just clicked. Surface regions that are not organs fall back to the
 * skin tone already used by the anatomy palette.
 */
const regionColor = computed(() => {
  const id = activeRegion.value?.id;
  if (!id) return '#EDE7FA';
  return ANATOMY_ORGANS.find((o) => o.id === id)?.color ?? '#EDE7FA';
});

const guides = computed(() => {
  const region = activeRegion.value;
  if (!region) return [];
  return region.topicSlugs
    .map((slug) => {
      const topic = TOPICS.find((tp) => tp.slug === slug);
      if (!topic) return null;
      const content = topic.content[currentLocale.value] || topic.content.en;
      return {
        slug,
        icon: topic.icon,
        title: content.title,
        summary: content.summary,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
});
</script>

<style scoped lang="scss">
.org-section {
  padding-block: clamp(64px, 9vw, 112px);
  background: #0B0718;
  color: #F3EFFC;
}

.org-inner {
  width: min(100% - 48px, 1000px);
  margin-inline: auto;
}

// ── identity strip ──────────────────────────────────────────────────────────
.org-identity {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 20px;
  margin-bottom: 28px;
  border-radius: 3px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
}

.org-identity-swatch {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(240, 236, 250, 0.14);
}

.org-identity-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.org-identity-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #D4AF37;
}

.org-identity-name {
  font-size: 1.15rem;
  font-weight: 500;
  color: #F3EFFC;
  line-height: 1.2;
}

html[dir="ltr"] .org-identity-name {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.org-identity-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  min-height: 40px;
  border-radius: 2px;
  border: 1px solid rgba(212, 175, 55, 0.4);
  background: transparent;
  color: #E9C766;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background 180ms var(--ease-out), border-color 180ms var(--ease-out);

  &:hover {
    background: rgba(212, 175, 55, 0.1);
    border-color: #D4AF37;
  }

  &:focus-visible {
    outline: 2px solid #D4AF37;
    outline-offset: 2px;
  }
}

.org-identity-back-ico {
  flex: none;
}

[dir='rtl'] .org-identity-back-ico {
  transform: scaleX(-1);
}

// ── about / placeholder ─────────────────────────────────────────────────────
.org-about {
  margin-bottom: 40px;
}

.org-about-title {
  margin: 0 0 14px;
  font-size: clamp(1.35rem, 2.4vw, 1.8rem);
  font-weight: 500;
  color: #F3EFFC;
}

html[dir="ltr"] .org-about-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.org-about-placeholder {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 24px;
  border-radius: 3px;
  /* Dashed, muted: visibly a reserved slot rather than finished content. */
  border: 1px dashed rgba(212, 175, 55, 0.4);
  background: #0B0718;
}

.org-about-ico {
  color: #D4AF37;
  opacity: 0.9;
}

.org-about-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(240, 236, 250, 0.7);
  max-width: 68ch;
}

.org-about-note {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(240, 236, 250, 0.55);
}

@media (max-width: 560px) {
  .org-identity {
    gap: 12px;
  }

  .org-identity-back {
    width: 100%;
    justify-content: center;
  }
}

.org-guides-head {
  text-align: center;
  margin-bottom: 40px;

  h2 {
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    font-weight: 500;
    color: #F3EFFC;
    margin: 0 0 10px;
  }

  p {
    max-width: 620px;
    margin: 0 auto;
    font-size: 1rem;
    line-height: 1.7;
    color: rgba(240, 236, 250, 0.6);
  }
}

html[dir="ltr"] .org-guides-head h2 {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.org-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.org-card {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  text-decoration: none;
  transition: border-color 200ms ease, transform 200ms ease;

  &:hover {
    border-color: #D4AF37;
    transform: translateY(-2px);
  }
}

.org-card-ico {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.org-card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.org-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #F3EFFC;
  margin: 0 0 8px;
  line-height: 1.3;
}

html[dir="ltr"] .org-card-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.org-card-summary {
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgba(240, 236, 250, 0.6);
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.org-card-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #D4AF37;
  transition: color 180ms ease;
}

.org-card-arrow {
  transition: transform 200ms var(--ease-out);
}

[dir='rtl'] .org-card-arrow { transform: scaleX(-1); }
.org-card:hover .org-card-arrow { transform: none; }
[dir='rtl'] .org-card:hover .org-card-arrow { transform: none; }

.org-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 40px;
}

.org-disclaimer {
  margin-top: 48px;
}
</style>