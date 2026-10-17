<template>
  <div>
    <PageHero
      eyebrow="Doctors_Eyebrow"
      :title="t('Doctors_Title')"
      :subtitle="t('Doctors_Subtitle')"
    />

    <section class="dr-section">
      <div class="dr-inner">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="turquoise"
          class="dr-loader"
        />

        <template v-else-if="doctors.length">
          <!-- Search toolbar -->
          <div class="dr-toolbar">
            <v-text-field
              v-model="search"
              variant="outlined"
              density="comfortable"
              hide-details
              :placeholder="t('Doctors_Search_Placeholder')"
              prepend-inner-icon="mdi-magnify"
              class="dr-search"
              clearable
            />
            <v-select
              v-model="specialty"
              variant="outlined"
              density="comfortable"
              hide-details
              :label="t('Doctors_Specialty')"
              :items="specialtyOptions"
              class="dr-specialty"
              clearable
            />
          </div>

          <!-- Editorial intro -->
          <div class="dr-editorial" v-reveal.up>
            <p class="dr-editorial-eyebrow">{{ t('Doctors_Editorial_Eyebrow') }}</p>
            <h2 class="dr-editorial-title">{{ t('Doctors_Editorial_Title') }}</h2>
            <p class="dr-editorial-text">{{ t('Doctors_Editorial_Text') }}</p>
          </div>

          <div v-if="filteredDoctors.length" class="dr-grid">
            <router-link
              v-for="doctor in filteredDoctors"
              :key="doctor.id"
              class="dr-card-link card-interactive"
              :to="'/doctors/' + doctor.id"
              v-reveal
              :style="{ '--reveal-delay': `${(indexOf(doctor) % 8) * 60}ms` }"
            >
              <div class="dr-card-body">
                <div class="dr-avatar">{{ initials(doctor) }}</div>
                <h3 class="dr-name">{{ fullName(doctor) }}</h3>
                <p v-if="doctor.specialty" class="dr-specialty-line">
                  <v-icon size="16">mdi-briefcase-outline</v-icon>
                  {{ doctor.specialty }}
                </p>
                <p v-if="doctor.city" class="dr-city">
                  <v-icon size="16">mdi-map-marker-outline</v-icon>
                  {{ doctor.city }}
                </p>
                <span v-if="doctor.verified" class="dr-verified">
                  <v-icon size="14">mdi-check-circle</v-icon>
                  {{ t('Doctors_Verified') }}
                </span>
              </div>
            </router-link>
          </div>

          <v-empty-state
            v-else
            :title="t('Doctors_No_Results')"
            icon="mdi-account-search-outline"
          />
        </template>

        <v-empty-state
          v-else-if="error"
          :title="t('Doctors_Unavailable')"
          icon="mdi-stethoscope"
          :text="t('Doctors_Unavailable_Desc')"
        >
          <v-btn color="primary" rounded="pill" to="/consultations">
            {{ t('Consultations_Ask_Title') }}
          </v-btn>
        </v-empty-state>

        <div v-else class="dr-empty">
          <span class="dr-empty-ico"><v-icon size="48">mdi-stethoscope</v-icon></span>
          <h2 class="dr-empty-title">{{ t('Doctors_Unavailable') }}</h2>
          <p class="dr-empty-desc">{{ t('Doctors_Unavailable_Desc') }}</p>
          <p class="dr-empty-sched">{{ t('Doctors_Schedule_Note') }}</p>
          <div class="dr-empty-actions">
            <v-btn color="primary" rounded="pill" elevation="0" to="/consultations">
              {{ t('Consultations_Ask_Title') }}
            </v-btn>
            <v-btn variant="outlined" color="primary" rounded="pill" to="/practitioners">
              {{ t('Nav_Practitioners') }}
            </v-btn>
          </div>
        </div>

        <div class="dr-note">
          <Disclaimer variant="redflags">
            {{ t('Doctors_Note') }}
          </Disclaimer>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import { useDoctors, type Doctor } from '@/composables/useDoctors';

const { t } = useI18n();
const { doctors, loading, error } = useDoctors();

const search = ref('');
const specialty = ref<string | null>(null);

const specialties = computed(() => Array.from(new Set(doctors.value.map((d) => d.specialty).filter((s): s is string => Boolean(s)))));

const specialtyOptions = computed(() => specialties.value.map((s) => ({ title: s, value: s })));

const filteredDoctors = computed(() => {
  const q = search.value.trim().toLowerCase();
  return doctors.value.filter((d) => {
    if (specialty.value && d.specialty !== specialty.value) return false;
    if (!q) return true;
    const hay = [d.firstName, d.lastName, d.specialty, d.city].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
});

function indexOf(d: Doctor): number {
  return filteredDoctors.value.findIndex((doc) => doc.id === d.id);
}

function fullName(d: Doctor): string {
  const parts = [d.firstName, d.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

function initials(d: Doctor): string {
  const name = fullName(d);
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
.dr-section {
  padding-block: clamp(64px, 9vw, 112px);
  background: #0B0718;
  color: #F3EFFC;
}

.dr-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

.dr-loader {
  margin-bottom: 28px;
  border-radius: 3px;
  height: 3px;
}

.dr-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
  margin-bottom: 40px;
}

.dr-search { max-width: 100%; }
.dr-specialty { width: 100%; }

/* ── Editorial ── */
.dr-editorial {
  max-width: 760px;
  margin: 0 auto 48px;
  padding: 0 24px;
  text-align: center;
}

.dr-editorial-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 16px;
  justify-content: center;

  &::before {
    content: '';
    width: 40px;
    height: 1px;
    border-radius: 1px;
    background: #D4AF37;
  }
}

html[dir="rtl"] .dr-editorial-eyebrow::before { width: 0; }

.dr-editorial-title {
  font-size: clamp(1.5rem, 3vw, 2.4rem);
  font-weight: 500;
  line-height: 1.2;
  color: #F3EFFC;
  margin: 0 0 16px;
}

html[dir="ltr"] .dr-editorial-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.dr-editorial-text {
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
  max-width: 680px;
  margin-inline: auto;
}

/* ── Grid ── */
.dr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.dr-card-link {
  display: block;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  text-decoration: none;
  transition: border-color 200ms var(--ease-out), transform 200ms var(--ease-out);
}

.dr-card-link:hover {
  border-color: #D4AF37;
  transform: translateY(-2px);
}

.dr-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 32px;
}

.dr-avatar {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
  margin-bottom: 8px;
}

.dr-name {
  font-size: 1.25rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0;
  line-height: 1.25;
}

html[dir="ltr"] .dr-name {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.dr-specialty-line,
.dr-city {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
  line-height: 1.5;
}

.dr-verified {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #E9C766;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.32);
  border-radius: 2px;
  padding: 5px 10px;
  align-self: flex-start;
  margin-top: 8px;
}

/* Empty states */
.dr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
  background: #160D2B;
  border: 1px dashed rgba(240, 236, 250, 0.16);
  border-radius: 3px;
  padding: 80px 40px;
}

.dr-empty-ico {
  width: 96px;
  height: 96px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.dr-empty-title {
  font-size: 1.6rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0;
}

html[dir="ltr"] .dr-empty-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.dr-empty-desc {
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
  max-width: 620px;
}

.dr-empty-sched {
  font-size: 0.95rem;
  color: rgba(240, 236, 250, 0.55);
  margin: 0;
  max-width: 560px;
}

.dr-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
}

.dr-empty-actions .v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.dr-note {
  margin-top: 64px;
  max-width: 860px;
  margin-inline: auto;
}

@media (max-width: 760px) {
  .dr-toolbar { grid-template-columns: 1fr; }
}
</style>