<template>
  <div>
    <PageHero
      eyebrow="Practitioners_Eyebrow"
      :title="t('Practitioners_Title')"
      :subtitle="t('Practitioners_Subtitle')"
    />

    <section class="prk-section">
      <div class="prk-inner">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="turquoise"
          class="prk-loader"
        />

        <div v-else-if="healers.length" class="prk-grid">
          <router-link
            v-for="healer in healers"
            :key="healer.id"
            class="prk-card hover-lift-premium"
            :to="'/practitioners/' + healer.id"
          >
            <div class="prk-avatar">{{ initials(healer) }}</div>
            <div class="prk-body">
              <h3 class="prk-name">{{ fullName(healer) }}</h3>
              <p class="prk-city">
                <v-icon size="14">mdi-map-marker-outline</v-icon>
                {{ healer.city ?? t('Practitioners_City_Unknown') }}
              </p>
              <span class="prk-level">
                <v-icon size="12">mdi-certificate-outline</v-icon>
                {{ t('Practitioners_Level', { level: healer.level ?? '—' }) }}
              </span>
            </div>
            <v-icon class="prk-arrow" size="20">mdi-chevron-right</v-icon>
          </router-link>
        </div>

        <v-empty-state
          v-else-if="error"
          :title="t('Practitioners_Empty')"
          icon="mdi-wifi-off"
          :text="error"
        />
        <v-empty-state v-else :title="t('Practitioners_Empty')" icon="mdi-account-group-outline" />

        <div class="prk-guide">
          <Disclaimer variant="notice">
            {{ t('Consultations_Desc') }}
          </Disclaimer>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import { usePublicHealers, type PublicHealer } from '@/composables/usePublicHealers';

const { t } = useI18n();
const { healers, loading, error } = usePublicHealers();

function fullName(h: PublicHealer): string {
  const parts = [h.firstName, h.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

function initials(h: PublicHealer): string {
  const name = fullName(h);
  if (name === '—') return '?';
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
</script>

<style scoped lang="scss">
.prk-section {
  position: relative;
  padding-block: clamp(64px, 9vw, 112px);
  background: #0B0718;
  color: #F3EFFC;
}

.prk-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

.prk-loader {
  margin-bottom: 24px;
  border-radius: 8px;
}

.prk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.prk-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 26px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  text-decoration: none;
  transition: border-color 240ms var(--ease-out), transform 240ms var(--ease-out);
}

.prk-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.prk-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
  background: linear-gradient(135deg, #2a1450 0%, #6d28d9 100%);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.45);
}

.prk-card:hover .prk-avatar {
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.85);
}

.prk-body {
  flex: 1;
  min-width: 0;
}

.prk-name {
  font-size: 1.15rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 6px;
  line-height: 1.25;
}

html[dir="ltr"] .prk-name {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.prk-city {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.88rem;
  color: rgba(240, 236, 250, 0.6);
  margin: 0 0 8px;
  line-height: 1.5;
}

.prk-level {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #E9C766;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 2px;
  padding: 3px 9px;
}

.prk-arrow {
  color: #D4AF37;
}

.prk-card:hover .prk-arrow {
  transform: none;
}

[dir='rtl'] .prk-arrow {
  transform: scaleX(-1);
}

[dir='rtl'] .prk-card:hover .prk-arrow {
  transform: scaleX(-1);
}

.prk-guide {
  margin-top: 44px;
  max-width: 860px;
}
</style>