<template>
  <div>
    <PageHero
      eyebrow="Community_Eyebrow"
      :title="t('Community_Title')"
      :subtitle="t('Community_Subtitle')"
    />

    <section class="cm-section">
      <div class="cm-inner">
        <div class="cm-preview" v-reveal.up>
          <p class="cm-preview-eyebrow">{{ t('Community_Preview_Title') }}</p>
          <div class="cm-preview-grid">
            <div v-for="(feature, i) in features" :key="feature.key" class="cm-feature stagger-in hover-lift hover-zoom-img" :style="{ '--i': i }">
              <span class="cm-feature-icon">
                <v-icon size="24">{{ feature.icon }}</v-icon>
              </span>
              <div class="cm-feature-body">
                <h3 class="cm-feature-title">{{ t(feature.titleKey) }}</h3>
                <p class="cm-feature-desc">{{ t(feature.descKey) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="cm-card" v-reveal.up :style="{ '--reveal-delay': '200ms' }">
          <span class="cm-badge"><v-icon size="14">mdi-clock-outline</v-icon> {{ t('Community_Coming') }}</span>
          <span class="cm-icon"><v-icon size="40">mdi-account-group-outline</v-icon></span>
          <h2 class="cm-title">{{ t('Community_Coming') }}</h2>
          <p class="cm-desc">{{ t('Community_Coming_desc') }}</p>
          <div class="cm-actions">
            <v-btn color="primary" rounded="pill" elevation="0" to="/contact" class="pressable sheen">
              {{ t('Academy_Enquire') }}
            </v-btn>
            <v-btn variant="outlined" color="primary" rounded="pill" to="/contact" class="pressable">
              {{ t('Contact_Link') }}
            </v-btn>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';

const { t } = useI18n();

const features = [
  { key: 'discussions', icon: 'mdi-forum-outline', titleKey: 'Community_Feature_1', descKey: 'Community_Feature_1_desc' },
  { key: 'stories', icon: 'mdi-heart-flash-outline', titleKey: 'Community_Feature_2', descKey: 'Community_Feature_2_desc' },
  { key: 'ask', icon: 'mdi-help-circle-outline', titleKey: 'Community_Feature_3', descKey: 'Community_Feature_3_desc' },
  { key: 'events', icon: 'mdi-calendar-star-outline', titleKey: 'Community_Feature_4', descKey: 'Community_Feature_4_desc' },
];
</script>

<style scoped lang="scss">
.cm-section {
  padding-block: clamp(64px, 9vw, 112px);
  background: #0B0718;
  color: #F3EFFC;
}

.cm-inner {
  width: min(100% - 32px, 960px);
  margin-inline: auto;
  display: grid;
  gap: 28px;
}

/* ── Feature preview ── */
.cm-preview {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 36px 32px;
}

.cm-preview-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 22px;

  &::before {
    content: '';
    width: 36px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.9));
  }
}

.cm-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.cm-feature {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 22px;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  background: #160D2B;
  transition: border-color 240ms var(--ease-out), transform 240ms var(--ease-out);
}

.cm-feature:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.cm-feature-icon {
  flex-shrink: 0;
  width: 54px;
  height: 54px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #2a1450 0%, #6d28d9 100%);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
  overflow: hidden;
}

.cm-feature:hover .cm-feature-icon {
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.85);
}

.cm-feature-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 8px;
  line-height: 1.25;
}

html[dir="ltr"] .cm-feature-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.cm-feature-desc {
  font-size: 0.9rem;
  line-height: 1.65;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
}

/* ── Coming-soon card ── */
.cm-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 64px 40px;
  overflow: hidden;
}

.cm-card::before {
  content: '';
  position: absolute;
  top: 0;
  inset-inline: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}

.cm-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0;
}

html[dir="ltr"] .cm-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.cm-desc {
  font-size: 0.96rem;
  line-height: 1.7;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
  max-width: 540px;
}

.cm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}

.cm-actions .v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

@media (max-width: 760px) {
  .cm-preview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .cm-card {
    padding: 40px 22px;
  }
}
</style>