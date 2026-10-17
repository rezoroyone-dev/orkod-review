<template>
  <div>
    <template v-if="found">
      <PageHero
        eyebrow="Practitioners_Eyebrow"
        :title="fullName"
        :subtitle="t('Practitioners_Subtitle')"
        back-to="/practitioners"
        back-label="Practitioner_Back_Link"
      >
        <template #breadcrumb>{{ t('Practitioners_Title') }}</template>
      </PageHero>

      <section class="pd-section">
        <div class="pd-inner">
          <div class="pd-card">
            <div class="pd-avatar">{{ initials }}</div>
            <div class="pd-body">
              <h2 class="pd-name">{{ fullName }}</h2>
              <p class="pd-meta">
                <span class="pd-pill">
                  <v-icon size="14">mdi-map-marker-outline</v-icon>
                  {{ healer.city ?? t('Practitioners_City_Unknown') }}
                </span>
                <span class="pd-pill pd-pill--level">
                  <v-icon size="14">mdi-certificate-outline</v-icon>
                  {{ t('Practitioners_Level', { level: healer.level ?? '—' }) }}
                </span>
              </p>
              <p class="pd-desc">{{ t('Practitioners_Detail_Intro') }}</p>
              <div class="pd-actions">
                <v-btn color="primary" size="large" rounded="pill" elevation="0" :to="bookingTarget">
                  {{ t('Consultations_Book') }}
                </v-btn>
                <v-btn
                  variant="outlined"
                  color="primary"
                  size="large"
                  rounded="pill"
                  to="/contact"
                >
                  {{ t('Contact_Link') }}
                </v-btn>
              </div>
            </div>
          </div>

          <div class="pd-disclaimer">
            <Disclaimer variant="notice">
              {{ t('Consultations_Desc') }}
            </Disclaimer>
          </div>
        </div>
      </section>
    </template>

    <v-container v-else-if="loading" class="pd-state">
      <v-progress-linear indeterminate color="turquoise" class="pd-loader" />
    </v-container>

    <v-container v-else class="pd-state">
      <v-empty-state
        :title="t('Practitioner_NotFound')"
        icon="mdi-account-question-outline"
      >
        <v-btn color="primary" rounded="pill" to="/practitioners">
          {{ t('Practitioner_Back_Link') }}
        </v-btn>
      </v-empty-state>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import { usePublicHealers } from '@/composables/usePublicHealers';

const { t } = useI18n();
const route = useRoute();

const { healers, loading } = usePublicHealers();

const requestedId = Number(route.params.id);
const healer = computed(() => healers.value.find((h) => h.id === requestedId));

const found = computed(() => !!healer.value);

const fullName = computed(() => {
  if (!healer.value) return '—';
  const parts = [healer.value.firstName, healer.value.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
});

const bookingTarget = computed(() => ({
  path: '/booking',
  query: healer.value?.id ? { healer: String(healer.value.id) } : {},
}));

const initials = computed(() => {
  if (fullName.value === '—') return '?';
  return fullName.value
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
});
</script>

<style scoped lang="scss">
.pd-section {
  padding-block: clamp(56px, 8vw, 96px);
  background: #0B0718;
  color: #F3EFFC;
}

.pd-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

.pd-card {
  display: flex;
  gap: 28px;
  align-items: flex-start;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 32px;
}

.pd-avatar {
  flex-shrink: 0;
  width: 92px;
  height: 92px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  font-weight: 700;
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.pd-body {
  flex: 1;
  min-width: 0;
}

.pd-name {
  font-size: 1.7rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 10px;
}

html[dir="ltr"] .pd-name {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.pd-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 16px;
}

.pd-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(212, 175, 55, 0.1);
  color: #E9C766;
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 2px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.pd-pill--level {
  background: #0B0718;
  color: #E9C766;
  border-color: rgba(212, 175, 55, 0.34);
}

.pd-desc {
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(240, 236, 250, 0.6);
  margin: 0 0 24px;
  max-width: 640px;
}

.pd-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.pd-actions .v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.pd-disclaimer {
  margin-top: 32px;
  max-width: 860px;
}

.pd-state {
  padding-block: 72px;
}

.pd-loader {
  max-width: 420px;
  margin-inline: auto;
  border-radius: 3px;
}

@media (max-width: 640px) {
  .pd-card {
    flex-direction: column;
  }
}
</style>