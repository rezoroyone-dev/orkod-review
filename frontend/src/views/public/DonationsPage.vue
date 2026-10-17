<template>
  <main class="dn-page">
    <PageHero eyebrow="Donations_Kicker" title="Donations_Title" subtitle="Donations_Subtitle" />
    <div class="dn-inner">
      <div v-if="!loading && !feed.enabled" class="dn-offline">
        <v-icon size="36" color="primary">mdi-heart-off-outline</v-icon>
        <h2>{{ t('Donations_Offline_Title') }}</h2>
        <p>{{ t('Donations_Offline_Sub') }}</p>
        <v-btn to="/home" variant="outlined" color="primary" class="pressable">{{ t('Donations_BackHome') }}</v-btn>
      </div>

      <template v-else>
        <div class="dn-layout">
          <section class="dn-feed">
            <div v-if="loading" class="dn-loading">
              <v-progress-circular indeterminate color="primary" size="26" width="2" />
            </div>

            <div v-else-if="feed.donations.length === 0" class="dn-empty">
              <v-icon size="32" color="primary">mdi-hand-heart-outline</v-icon>
              <p>{{ t('Donations_Empty') }}</p>
            </div>

            <div v-else class="dn-list" v-reveal>
              <article
                v-for="(d, i) in feed.donations"
                :key="d.id"
                class="dn-item stagger-in"
                :style="{ '--i': Math.min(i, 10) }"
              >
                <div class="dn-item-top">
                  <span class="dn-item-amount">{{ t('Currency') }}{{ d.amount }}</span>
                  <span class="dn-item-name">{{ d.name }}</span>
                </div>
                <p v-if="d.message" class="dn-item-msg">&ldquo;{{ d.message }}&rdquo;</p>
              </article>
            </div>
          </section>

          <aside class="dn-form-card" v-reveal.up :style="{ '--reveal-delay': '140ms' }">
            <h2 class="dn-form-title">{{ t('Donations_Form_Title') }}</h2>
            <p class="dn-form-note">{{ t('Donations_Form_Note') }}</p>

            <v-text-field v-model="form.name" :label="t('Donations_Form_Name')" density="comfortable" variant="outlined" />
            <v-text-field
              v-model="form.amount"
              :label="t('Donations_Form_Amount')"
              density="comfortable"
              variant="outlined"
              type="number"
              min="1"
              :prefix="t('Currency')"
            />
            <v-textarea
              v-model="form.message"
              :label="t('Donations_Form_Message')"
              density="comfortable"
              variant="outlined"
              rows="3"
              :counter="500"
            />

            <v-switch
              v-model="form.isPublic"
              color="primary"
              hide-details
              inset
              class="dn-form-switch"
              :label="t('Donations_Form_Public')"
            />
            <p class="dn-form-switch-sub">{{ t('Donations_Form_Public_Sub') }}</p>

            <v-btn
              color="primary"
              size="large"
              elevation="0"
              block
              :disabled="!canSubmit"
              :loading="submitting"
              class="pressable"
              @click="submit"
            >
              {{ t('Donations_Form_Cta') }}
            </v-btn>

            <p v-if="sent" class="dn-sent">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              {{ t('Donations_Form_Sent') }}
            </p>
            <p v-if="errorMsg" class="dn-error">{{ errorMsg }}</p>
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';
import DonationService, { DonationFeed } from '@/services/DonationService';

const { t } = useI18n();

const loading = ref(true);
const submitting = ref(false);
const sent = ref(false);
const errorMsg = ref('');
const feed = ref<DonationFeed>({ enabled: false, donations: [] });

const form = reactive({
  name: '',
  amount: '',
  message: '',
  isPublic: true,
});

const canSubmit = computed(
  () => form.name.trim() !== '' && Number(form.amount) > 0 && !submitting.value
);

async function load() {
  loading.value = true;
  try {
    feed.value = await DonationService.getPublicDonations();
  } catch {
    feed.value = { enabled: false, donations: [] };
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  errorMsg.value = '';
  sent.value = false;
  try {
    await DonationService.createDonation(
      form.name.trim(),
      Number(form.amount),
      form.message.trim(),
      form.isPublic
    );
    form.name = '';
    form.amount = '';
    form.message = '';
    form.isPublic = true;
    sent.value = true;
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { error?: string } } })?.response?.data;
    errorMsg.value = data?.error || t('Donations_Form_Error');
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<style scoped lang="scss">
.dn-page {
  background: #0B0718;
  color: #F3EFFC;
  min-height: 70svh;
  padding: 0 0 70px;
}

.dn-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
  padding-top: 44px;
}

.dn-title {
  margin: 8px 0 6px;
  font-size: clamp(26px, 3.6vw, 38px);
}

.dn-sub {
  margin: 0 0 28px;
  color: var(--color-text-muted);
  line-height: 1.6;
  max-width: 620px;
}

.dn-offline {
  display: grid;
  place-items: center;
  gap: 12px;
  text-align: center;
  padding: 60px 24px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;

  h2 {
    margin: 0;
  }

  p {
    color: rgba(240, 236, 250, 0.6);
    max-width: 420px;
    margin: 0;
  }
}

.dn-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 22px;
  align-items: start;
}

.dn-loading,
.dn-empty {
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 50px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  color: rgba(240, 236, 250, 0.6);
}

.dn-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.dn-item {
  padding: 18px;
  border-radius: 3px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  transition: transform 200ms var(--ease-out), border-color 200ms var(--ease-out);

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(212, 175, 55, 0.5);
  }
}

.dn-item-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.dn-item-amount {
  font-size: 21px;
  font-weight: 600;
  color: #D4AF37;
}

html[dir="ltr"] .dn-item-amount {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.dn-item-name {
  font-size: 13px;
  color: rgba(240, 236, 250, 0.6);
}

.dn-item-msg {
  margin: 10px 0 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: rgba(240, 236, 250, 0.75);
}

.dn-form-card {
  padding: 26px;
  border-radius: 3px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
}

.dn-form-title {
  margin: 0 0 6px;
  font-size: 21px;
  font-weight: 500;
}

html[dir="ltr"] .dn-form-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.dn-form-note {
  margin: 0 0 16px;
  font-size: 13.5px;
  color: rgba(240, 236, 250, 0.6);
}

.dn-form-switch {
  margin-top: 14px;
}

.dn-form-switch-sub {
  margin: 6px 0 0 8px;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.dn-sent {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 14px 0 0;
  font-size: 14px;
  color: #16a34a;
  animation: fade-in-up 420ms var(--ease-out) both;
}

.dn-error {
  margin: 12px 0 0;
  font-size: 14px;
  color: #dc2626;
}

@media (max-width: 880px) {
  .dn-layout {
    grid-template-columns: 1fr;
  }
}
</style>