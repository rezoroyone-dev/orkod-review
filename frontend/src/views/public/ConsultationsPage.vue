<template>
  <div>
    <PageHero
      eyebrow="Consultations_Eyebrow"
      :title="t('Consultations_Title')"
      :subtitle="t('Consultations_Subtitle')"
    />

    <section class="cs-section">
      <div class="cs-inner">
        <!-- How it works -->
        <div class="cs-how" v-reveal.up>
          <p class="cs-how-eyebrow">{{ t('Consultations_How_Eyebrow') }}</p>
          <h2 class="cs-how-title">{{ t('Consultations_How_Title') }}</h2>
          <div class="cs-how-grid">
            <div v-for="(step, idx) in howSteps" :key="step.step" class="cs-how-item card" v-reveal :style="{ '--reveal-delay': `${idx * 80}ms` }">
              <span class="cs-how-num">{{ step.step }}</span>
              <h3 class="cs-how-name">{{ t(step.titleKey) }}</h3>
              <p class="cs-how-desc">{{ t(step.descKey) }}</p>
            </div>
          </div>
        </div>

        <!-- Service cards -->
        <div class="cs-grid" v-reveal.up :style="{ '--reveal-delay': '100ms' }">
          <div v-for="card in cards" :key="card.key" class="cs-card card-interactive">
            <span class="cs-icon"><v-icon size="28">{{ card.icon }}</v-icon></span>
            <h2 class="cs-title">{{ t(card.titleKey) }}</h2>
            <p class="cs-desc">{{ t(card.descKey) }}</p>
            <v-btn
              color="primary"
              rounded="pill"
              elevation="0"
              class="cs-cta pressable"
              to="/booking"
            >
              {{ t('Consultations_Book') }}
            </v-btn>
          </div>
        </div>

        <!-- Ask a question -->
        <div class="cs-ask" v-reveal.up :style="{ '--reveal-delay': '200ms' }">
          <div class="cs-ask-head">
            <span class="cs-ask-ico"><v-icon size="28">mdi-message-text-outline</v-icon></span>
            <div>
              <h2 class="cs-ask-title">{{ t('Consultations_Ask_Title') }}</h2>
              <p class="cs-ask-desc">{{ t('Consultations_Ask_Desc') }}</p>
            </div>
          </div>

          <div v-if="submitted" class="cs-success" v-reveal>
            <v-avatar color="success" size="72" class="mb-3">
              <v-icon size="38" color="white">mdi-check-circle</v-icon>
            </v-avatar>
            <h3 class="cs-success-title">{{ t('Consultations_Form_Success_Title') }}</h3>
            <p class="cs-success-desc">{{ t('Consultations_Form_Success_Desc') }}</p>
          </div>

          <v-form v-else ref="askForm" v-model="isFormValid">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="ask.name" :label="t('First_Name')" :rules="[v => !!v || t('Field_Required')]" variant="outlined" density="comfortable" required />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="ask.email" :label="t('Email')" type="email" :rules="[v => !!v || t('Field_Required'), v => /.+@.+\..+/.test(v) || t('Email_must_be_valid')]" variant="outlined" density="comfortable" required />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="ask.subject"
                  :label="t('Consultations_Form_Subject')"
                  :items="subjectOptions"
                  :rules="[v => !!v || t('Field_Required')]"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="ask.message"
                  :label="t('Consultations_Form_Message')"
                  :placeholder="t('Consultations_Form_Message_Placeholder')"
                  :rules="[v => !!v || t('Field_Required')]"
                  variant="outlined"
                  density="comfortable"
                  rows="4"
                  required
                />
              </v-col>
            </v-row>
            <div class="cs-ask-actions">
              <v-btn
                color="primary"
                size="large"
                rounded="pill"
                elevation="0"
                :loading="sending"
                :disabled="!isFormValid"
                @click="sendQuestion"
                class="pressable sheen"
              >
                {{ t('Consultations_Form_Send') }}
              </v-btn>
            </div>
          </v-form>

          <div class="cs-ask-note">
            <Disclaimer variant="notice">
              {{ t('Consultations_Desc') }}
            </Disclaimer>
          </div>
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
import ContactMessageService from '@/services/ContactMessageService';

const { t } = useI18n();

const cards = [
  { key: 'individual', titleKey: 'Diag_Individual', descKey: 'Diag_Individual_desc', icon: 'mdi-account-heart' },
  { key: 'couple', titleKey: 'Diag_Couple', descKey: 'Diag_Couple_desc', icon: 'mdi-heart-multiple' },
  { key: 'family', titleKey: 'Diag_Family', descKey: 'Diag_Family_desc', icon: 'mdi-home-heart' },
];

const howSteps = [
  { step: '1', titleKey: 'Consultations_Step_1', descKey: 'Consultations_Step_1_desc' },
  { step: '2', titleKey: 'Consultations_Step_2', descKey: 'Consultations_Step_2_desc' },
  { step: '3', titleKey: 'Consultations_Step_3', descKey: 'Consultations_Step_3_desc' },
];

const subjectOptions = computed(() => [
  t('Consultations_Subject_General'),
  t('Consultations_Subject_Booking'),
  t('Consultations_Subject_Symptom'),
]);

const askForm = ref<any>(null);
const isFormValid = ref(false);
const sending = ref(false);
const submitted = ref(false);

const ask = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
});

async function sendQuestion() {
  sending.value = true;
  try {
    await ContactMessageService.saveContactMessage({
      name: ask.value.name,
      email: ask.value.email,
      subject: ask.value.subject,
      message: ask.value.message,
    });
    submitted.value = true;
  } catch (e) {
    if (askForm.value) askForm.value.validate();
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped lang="scss">
.cs-section {
  padding-block: clamp(64px, 9vw, 112px);
  background: #0B0718;
  color: #F3EFFC;
}

.cs-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

/* ── How it works ── */
.cs-how {
  margin-bottom: 48px;
}

.cs-how-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 18px;

  &::before {
    content: '';
    width: 36px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.9));
  }
}

html[dir="rtl"] .cs-how-eyebrow::before { width: 0; }

.cs-how-title {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 500;
  line-height: 1.1;
  color: #F3EFFC;
  margin: 0 0 28px;
  text-align: center;
}

html[dir="ltr"] .cs-how-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.cs-how-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.cs-how-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 28px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  transition: border-color 240ms var(--ease-out), transform 240ms var(--ease-out);
}

@media (hover: hover) {
  .cs-how-item:hover {
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateY(-2px);
  }
}

.cs-how-num {
  width: 48px;
  height: 48px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1d27a, #d4af37);
  color: #1c1327;
  font-weight: 700;
  font-size: 1.1rem;
}

.cs-how-name {
  font-size: 1.15rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 16px 0 8px;
}

html[dir="ltr"] .cs-how-name {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.cs-how-desc {
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
}

/* ── Service cards ── */
.cs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 64px;
}

.cs-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 36px 32px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  transition: border-color 240ms var(--ease-out), transform 240ms var(--ease-out);
}

@media (hover: hover) {
  .cs-card:hover {
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateY(-2px);
  }
}

.cs-icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
  overflow: hidden;
}

@media (hover: hover) {
  .cs-card:hover .cs-icon {
    transform: none;
  }
}

.cs-title {
  font-size: 1.3rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0;
  line-height: 1.2;
}

html[dir="ltr"] .cs-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.cs-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
  flex: 1;
}

.cs-cta {
  align-self: flex-start;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

/* ── Ask form ── */
.cs-ask {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 40px 36px;
}

.cs-ask-head {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 28px;
}

.cs-ask-ico {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.cs-ask-title {
  font-size: 1.45rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 8px;
}

html[dir="ltr"] .cs-ask-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.cs-ask-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
  max-width: 680px;
}

.cs-ask-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.cs-ask-actions .v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.cs-ask-note {
  margin-top: 32px;
  max-width: 860px;
}

.cs-success {
  text-align: center;
  padding: 36px 0 16px;
}

.cs-success-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-green);
  margin: 0 0 10px;
}

.cs-success-desc {
  font-size: 0.95rem;
  color: var(--color-charcoal-light);
  margin: 0;
}

@media (max-width: 640px) {
  .cs-ask { padding: 24px; }
  .cs-ask-actions { justify-content: stretch; }
  .cs-ask-actions .v-btn { width: 100%; }
}
</style>