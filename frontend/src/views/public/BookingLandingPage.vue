<template>
  <main class="bl">
    <PageHero eyebrow="Booking_Kicker" title="Booking_Subtitle" :subtitle-text="t('Booking_Pick_Specialty')" />

    <section class="bl-body container">
      <div v-if="loading" class="bl-state">
        <v-progress-circular indeterminate color="primary" size="28" width="2" />
        <span>{{ t('Booking_Loading') }}</span>
      </div>

      <div v-else-if="error" class="bl-state bl-state--error">
        <v-icon size="22" color="error">mdi-alert-circle-outline</v-icon>
        <span>{{ t('Booking_Err_Generic') }}</span>
      </div>

      <div v-else-if="specialties.length === 0" class="bl-state">
        <v-icon size="22" color="warning">mdi-account-clock-outline</v-icon>
        <span>{{ t('Booking_NoHealers') }}</span>
      </div>

      <div v-else class="bl-grid">
        <router-link
          v-for="(s, i) in specialties"
          :key="s.specialty"
          :to="`/specialty/${encodeURIComponent(s.specialty)}`"
          class="bl-card card pressable"
          :style="{ '--i': i }"
        >
          <span class="bl-card-ico"><v-icon size="24">mdi-hands-pray</v-icon></span>
          <h2 class="bl-card-title">{{ pretty(s.specialty) }}</h2>
          <p class="bl-card-meta">
            {{ s.healerCount }} {{ t('Booking_Healers') }}
          </p>
          <span class="bl-card-go">
            {{ t('Booking_Explore') }} <v-icon size="16">{{ isRtl ? 'mdi-arrow-left' : 'mdi-arrow-right' }}</v-icon>
          </span>
        </router-link>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';
import SpecialtyService, { PublicSpecialty } from '@/services/SpecialtyService';

const { t, locale } = useI18n();
const isRtl = computed(() => locale.value === 'ar');

const specialties = ref<PublicSpecialty[]>([]);
const loading = ref(true);
const error = ref(false);

function pretty(raw: string): string {
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

onMounted(async () => {
  try {
    specialties.value = await SpecialtyService.getPublicSpecialties();
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.bl {
  min-height: 60vh;
  background: var(--color-background);
  color: var(--color-text-primary);
}

.bl-body {
  padding-block: 48px 96px;
}

.bl-state {
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
  padding: 64px 0;
  color: var(--color-text-secondary);
}

.bl-state--error {
  color: var(--color-error);
}

.bl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.bl-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 26px 24px;
  text-decoration: none;
  color: var(--color-text-primary);
}

.bl-card-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-purple-primary) 22%, transparent);
  color: var(--color-purple-bright);
  margin-bottom: 6px;
}

.bl-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.bl-card-meta {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.bl-card-go {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gold-primary);
}
</style>
