<template>
  <aside class="dis-box" :class="'dis-box--' + variant" role="note">
    <span class="dis-ico" :aria-hidden="true">
      <v-icon :size="iconSize">{{ icon }}</v-icon>
    </span>
    <div class="dis-body">
      <strong class="dis-title">{{ title }}</strong>
      <template v-if="variant === 'redflags'">
        <ul class="dis-list">
          <li v-for="flag in redFlags" :key="flag">{{ flag }}</li>
        </ul>
        <p v-if="$slots.default" class="dis-note"><slot /></p>
        <p v-else class="dis-note">{{ t('Red_Flag_Note') }}</p>
      </template>
      <template v-else>
        <p class="dis-text"><slot /></p>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    variant?: 'notice' | 'info' | 'redflags';
    title?: string;
  }>(),
  { variant: 'notice' }
);

const { t } = useI18n();

const icon = computed(() => {
  switch (props.variant) {
    case 'info':
      return 'mdi-lightbulb-on-outline';
    case 'redflags':
      return 'mdi-alert-outline';
    default:
      return 'mdi-shield-heart-outline';
  }
});

const iconSize = computed(() => (props.variant === 'redflags' ? 26 : 22));

const title = computed(() => {
  if (props.title) return props.title;
  if (props.variant === 'redflags') return t('Red_Flag_Title');
  if (props.variant === 'info') return '';
  return t('Disclaimer_Notice_Title');
});

const redFlags = (['Red_Flag_1', 'Red_Flag_2', 'Red_Flag_3', 'Red_Flag_4'] as const).map((k) => t(k));

defineExpose({});
</script>

<style scoped lang="scss">
.dis-box {
  display: flex;
  gap: 14px;
  border-radius: 16px;
  padding: 18px 20px;
  line-height: 1.6;
}

.dis-ico {
  display: inline-flex;
  align-items: flex-start;
  padding-top: 2px;
  flex-shrink: 0;
}

.dis-title {
  display: block;
  font-size: 0.92rem;
  margin-bottom: 6px;
}

.dis-text {
  margin: 0;
  font-size: 0.88rem;
}

.dis-list {
  margin: 0 0 4px;
  padding-inline-start: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
}

.dis-note {
  margin: 10px 0 0;
  font-size: 0.85rem;
  font-weight: 600;
}

.dis-box--notice {
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.25);
  color: var(--color-text-secondary);

  .dis-ico {
    color: #D4AF37;
  }

  .dis-title {
    color: #D4AF37;
  }
}

.dis-box--info {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.28);
  color: var(--color-text-secondary);

  .dis-ico {
    color: #D4AF37;
  }

  .dis-title {
    color: #D4AF37;
  }
}

.dis-box--redflags {
  background: rgba(211, 47, 47, 0.12);
  border: 1px solid rgba(239, 83, 80, 0.35);
  color: #F5B5B0;

  .dis-ico {
    color: #EF5350;
  }

  .dis-title {
    color: #EF5350;
  }
}
</style>