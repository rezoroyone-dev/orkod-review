<template>
  <v-chip
    v-if="show"
    :color="chipColor"
    variant="tonal"
    size="x-small"
    class="trend-badge"
    label
  >
    <v-icon start size="12">{{ icon }}</v-icon>
    <span class="text-caption">{{ label }}</span>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  /** The numeric value to evaluate (e.g. newPatientsThisMonth) */
  value: number;
  /** If true, treat zero as neutral instead of down */
  neutralZero?: boolean;
  /** If true, invert the color logic (high = bad, e.g. open treatments) */
  invert?: boolean;
}>();

type Trend = 'up' | 'down' | 'neutral';

const trend = computed<Trend>(() => {
  if (props.value > 0) return 'up';
  if (props.value === 0 && props.neutralZero) return 'neutral';
  return 'down';
});

/** Only show the badge when there's something meaningful to display */
const show = computed(() => props.value !== undefined && props.value !== null);

const chipColor = computed(() => {
  if (trend.value === 'neutral') return 'grey';
  if (props.invert) {
    return trend.value === 'up' ? 'warning' : 'success';
  }
  return trend.value === 'up' ? 'success' : 'error';
});

const icon = computed(() => {
  if (trend.value === 'neutral') return 'mdi-minus';
  return trend.value === 'up' ? 'mdi-trending-up' : 'mdi-trending-down';
});

const label = computed(() => {
  if (trend.value === 'neutral') return t('Trend_Neutral');
  return trend.value === 'up' ? t('Trend_Up') : t('Trend_Down');
});
</script>

<style scoped>
.trend-badge {
  font-size: 10px;
  height: 18px;
}
</style>
