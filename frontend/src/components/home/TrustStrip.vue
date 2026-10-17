<template>
  <section class="trust-strip" :aria-label="t('Trust_Aria')">
    <div class="container trust-inner">
      <div class="trust-items">
        <div class="trust-item" v-for="(item, i) in items" :key="item.key" v-reveal :style="{ '--reveal-delay': `${i * 140}ms` }">
          <v-icon size="30" color="#D4AF37" class="trust-icon">{{ item.icon }}</v-icon>
          <span class="trust-label">{{ t(item.key) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Honest capability claims — no invented statistics, ratings or numbers.
const items = [
  { key: 'Trust_Certified', icon: 'mdi-medal' },
  { key: 'Trust_Remote', icon: 'mdi-wifi' },
  { key: 'Trust_Private', icon: 'mdi-security' },
  { key: 'Trust_Guided', icon: 'mdi-compass-outline' },
  { key: 'Trust_Easy', icon: 'mdi-calendar-check' },
];
</script>

<style scoped lang="scss">
.trust-strip {
  background: #0B0718;
  border-block: 1px solid rgba(212, 175, 55, 0.28);
}

.trust-inner {
  padding-block: 40px;
}

.trust-items {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px 32px;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trust-icon {
  flex-shrink: 0;
}

.trust-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #F3EFFC;
}

@media (max-width: 600px) {
  .trust-inner { padding-block: 32px; }
  .trust-items { flex-direction: column; align-items: flex-start; gap: 18px; }
}
</style>