<template>
  <main class="bk-page">
    <PageHero eyebrow="Book_Kicker" title="Book_Title" subtitle="Book_Subtitle" />
    <div class="bk-inner">
      <div class="bk-hero">
        <div class="bk-cover" aria-hidden="true">
          <div class="bk-cover-glow"></div>
          <div class="bk-cover-body">
            <span class="bk-cover-brand">ORKOD</span>
            <span class="bk-cover-title">{{ t('Book_Cover_Title') }}</span>
            <span class="bk-cover-rule"></span>
            <span class="bk-cover-sub">{{ t('Book_Cover_Sub') }}</span>
            <span class="bk-cover-foot">{{ t('Book_Cover_Foot') }}</span>
          </div>
          <div class="bk-cover-spine"></div>
        </div>

        <div class="bk-info">
          <span class="bk-badge"><v-icon size="14">mdi-clock-outline</v-icon> {{ t('Book_ComingSoon') }}</span>
          <h2 class="bk-info-title">{{ t('Book_Info_Title') }}</h2>
          <p class="bk-info-text">{{ t('Book_Info_Text') }}</p>

          <ul class="bk-list">
            <li v-for="item in highlights" :key="item" class="bk-list-item">
              <v-icon size="17" class="bk-list-ico">mdi-check-circle</v-icon>
              {{ item }}
            </li>
          </ul>

          <div class="bk-price-row">
            <span class="bk-price">{{ t('Book_Price') }}<em>&mdash;</em></span>
            <span class="bk-price-note">{{ t('Book_Price_Note') }}</span>
          </div>

          <div class="bk-actions">
            <v-btn color="primary" size="large" elevation="0" class="pressable bk-buy-btn" @click="openCheckout">
              {{ t('Book_Buy') }}
              <v-icon end>mdi-cart-outline</v-icon>
            </v-btn>
            <v-btn to="/symptoms" variant="outlined" color="primary" size="large" class="pressable">
              {{ t('Book_Preview') }}
            </v-btn>
          </div>

          <p class="bk-note">{{ t('Book_Placeholder_Note') }}</p>
        </div>
      </div>
    </div>

    <v-dialog v-model="checkout" max-width="480">
      <v-card class="bk-checkout">
        <v-card-title class="bk-checkout-title">
          <v-icon start color="primary">mdi-cart-outline</v-icon>
          {{ t('Book_Checkout_Title') }}
        </v-card-title>
        <v-card-text v-if="!done">
          <div class="bk-checkout-book">
            <span class="bk-checkout-brand">ORKOD</span>
            <span>{{ t('Book_Cover_Title') }}</span>
          </div>

          <v-text-field
            v-model="buyerName"
            :label="t('Book_Checkout_Buyer')"
            density="comfortable"
            variant="outlined"
            :rules="[() => !!buyerName.trim() || t('Book_Checkout_Buyer_Required')]"
          />
          <v-text-field
            v-model="buyerEmail"
            :label="t('Book_Checkout_Email')"
            density="comfortable"
            variant="outlined"
            type="email"
          />
          <v-text-field
            v-model="qty"
            :label="t('Book_Qty')"
            density="comfortable"
            variant="outlined"
            type="number"
            min="1"
          />

          <p class="bk-checkout-notice">
            <v-icon size="17">mdi-information-outline</v-icon>
            {{ t('Book_Checkout_Notice') }}
          </p>
        </v-card-text>

        <v-card-text v-else class="bk-checkout-done">
          <span class="bk-done-ico"><v-icon size="36" color="white">mdi-check</v-icon></span>
          <h3 class="bk-done-title">{{ t('Book_Checkout_Done_Title') }}</h3>
          <p class="bk-done-sub">{{ t('Book_Checkout_Done_Sub') }}</p>
        </v-card-text>

        <v-card-actions v-if="!done" class="bk-checkout-actions">
          <v-btn variant="text" color="primary" @click="checkout = false">
            {{ t('Book_Close') }}
          </v-btn>
          <v-btn
            color="primary"
            elevation="0"
            :disabled="!buyerName.trim()"
            @click="confirmOrder"
          >
            {{ t('Book_Checkout_Confirm') }}
          </v-btn>
        </v-card-actions>
        <v-card-actions v-else class="bk-checkout-actions">
          <v-btn color="primary" elevation="0" to="/home">
            {{ t('Donations_BackHome') }}
          </v-btn>
          <v-btn variant="text" color="primary" @click="closeCheckout">
            {{ t('Book_Close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';

const { t } = useI18n();

const checkout = ref(false);
const done = ref(false);
const buyerName = ref('');
const buyerEmail = ref('');
const qty = ref(1);

const highlights = computed(() => [t('Book_Hl_1'), t('Book_Hl_2'), t('Book_Hl_3')]);

function openCheckout() {
  done.value = false;
  buyerName.value = '';
  buyerEmail.value = '';
  qty.value = 1;
  checkout.value = true;
}

function confirmOrder() {
  if (!buyerName.value.trim()) return;
  done.value = true;
}

function closeCheckout() {
  checkout.value = false;
  done.value = false;
}
</script>

<style scoped lang="scss">
.bk-page {
  background: #0B0718;
  color: #F3EFFC;
  min-height: 70svh;
  padding: 0 0 70px;
}

.bk-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
  padding-top: 44px;
}

.bk-title {
  margin: 8px 0 6px;
  font-size: clamp(26px, 3.6vw, 38px);
}

.bk-sub {
  margin: 0 0 34px;
  color: rgba(240, 236, 250, 0.6);
  line-height: 1.6;
  max-width: 620px;
}

.bk-hero {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 46px;
  align-items: start;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 38px;
}

.bk-cover {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 6px 16px 16px 6px;
  overflow: hidden;
  background: linear-gradient(155deg, #4A3612 0%, #D4AF37 55%, #D4AF37 100%);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

.bk-cover-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 75% 15%, rgba(255, 255, 255, 0.28), transparent 45%),
    radial-gradient(circle at 20% 85%, rgba(0, 0, 0, 0.3), transparent 55%);
}

.bk-cover-body {
  position: absolute;
  inset: 0;
  padding: 34px 28px;
  display: flex;
  flex-direction: column;
  color: #f8fafc;
}

.bk-cover-brand {
  font-size: 11px;
  letter-spacing: 0.34em;
  font-weight: 700;
  opacity: 0.85;
}

.bk-cover-title {
  margin-top: auto;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.bk-cover-rule {
  width: 54px;
  height: 3px;
  border-radius: 3px;
  background: #D4AF37;
  margin: 16px 0;
}

.bk-cover-sub {
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.88;
}

.bk-cover-foot {
  margin-top: auto;
  font-size: 11.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.75;
}

.bk-cover-spine {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 16px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.4), transparent);
}

.bk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 2px;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.35);
  color: #E9C766;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bk-info-title {
  margin: 16px 0 8px;
  font-size: clamp(21px, 2.6vw, 28px);
  font-weight: 500;
}

html[dir="ltr"] .bk-info-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.bk-info-text {
  margin: 0;
  color: rgba(240, 236, 250, 0.6);
  line-height: 1.65;
  max-width: 520px;
}

.bk-list {
  list-style: none;
  margin: 22px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.bk-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14.5px;
}

.bk-list-ico {
  color: #D4AF37;
  flex: none;
}

.bk-price-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
  padding: 16px;
  border-radius: 3px;
  background: #0B0718;
  border: 1px dashed rgba(212, 175, 55, 0.4);
}

.bk-price {
  font-size: 24px;
  font-weight: 600;

  em {
    font-style: normal;
    color: #D4AF37;
    margin-inline-start: 6px;
  }
}

html[dir="ltr"] .bk-price {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.bk-price-note {
  font-size: 13px;
  color: rgba(240, 236, 250, 0.6);
}

.bk-actions {
  display: flex;
  gap: 14px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.bk-buy-btn {
  opacity: 1;
}

.bk-note {
  margin: 16px 0 0;
  font-size: 12.5px;
  color: rgba(240, 236, 250, 0.55);
}

.bk-checkout-title {
  font-weight: 600;
}

.bk-checkout-book {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 18px;
  margin-bottom: 14px;
  border-radius: 3px;
  background: linear-gradient(155deg, #2a1450, #6d28d9);
  color: #f8fafc;
  font-weight: 600;
  font-size: 20px;
}

html[dir="ltr"] .bk-checkout-book {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.bk-checkout-brand {
  font-size: 10px;
  letter-spacing: 0.32em;
  font-weight: 700;
  opacity: 0.85;
}

.bk-checkout-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 12px 0 0;
  padding: 12px 14px;
  border-radius: 3px;
  background: #0B0718;
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: #4a3612;
  font-size: 13px;
  line-height: 1.5;
}

.bk-checkout-actions {
  padding: 4px 16px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.bk-checkout-done {
  text-align: center;
  padding: 26px 24px;
}

.bk-done-ico {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: linear-gradient(135deg, #f1d27a, #d4af37);
}

.bk-done-title {
  margin: 0 0 8px;
  font-weight: 500;
}

html[dir="ltr"] .bk-done-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.bk-done-sub {
  margin: 0 auto;
  max-width: 360px;
  color: rgba(240, 236, 250, 0.6);
  line-height: 1.6;
  font-size: 14px;
}

@media (max-width: 860px) {
  .bk-hero {
    grid-template-columns: 1fr;
    padding: 26px;
    gap: 30px;
  }

  .bk-cover {
    max-width: 280px;
    margin-inline: auto;
  }
}
</style>