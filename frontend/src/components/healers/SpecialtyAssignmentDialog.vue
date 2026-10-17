<template>
  <v-dialog :model-value="visible" max-width="560" @update:model-value="onClose">
    <v-card class="sa-dialog">
      <v-card-title class="sa-title">
        <v-icon start color="primary">mdi-account-cowboy-hat</v-icon>
        {{ t('Healer_Specialties') }}
        <span class="sa-healer">{{ healer.healerName }}</span>
      </v-card-title>

      <v-card-text>
        <p class="sa-sub">{{ t('Healer_Specialties_Sub') }}</p>

        <v-progress-circular v-if="loading" indeterminate color="primary" size="24" />

        <div v-else class="sa-list">
          <label
            v-for="opt in options"
            :key="opt.slug"
            class="sa-item"
            :class="{ checked: selected.includes(opt.slug) }"
          >
            <v-checkbox
              :model-value="selected.includes(opt.slug)"
              density="comfortable"
              color="primary"
              hide-details
              class="sa-check"
              @update:model-value="toggle(opt.slug, $event)"
            />
            <span class="sa-item-body">
              <strong>{{ opt.title }}</strong>
              <span class="sa-item-tag">{{ opt.slug }}</span>
            </span>
          </label>
        </div>

        <p v-if="statusMsg" class="sa-status" :class="{ error: isError }">
          <v-icon size="16" :color="isError ? 'error' : 'success'">
            {{ isError ? 'mdi-alert-circle-outline' : 'mdi-check-circle' }}
          </v-icon>
          {{ statusMsg }}
        </p>
      </v-card-text>

      <v-card-actions class="sa-actions">
        <v-btn variant="text" color="primary" @click="onClose(false)">
          {{ t('Book_Close') }}
        </v-btn>
        <v-btn color="primary" elevation="0" :disabled="saving" :loading="saving" @click="save">
          {{ t('Healer_Specialty_Save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import HealerService from '@/services/HealerService';
import Healer from '@/models/Healer';
import { TOPICS, LangCode } from '@/data/wellness';

const props = defineProps<{
  visible: boolean;
  healer: Healer;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const { t, locale } = useI18n();

const loading = ref(false);
const saving = ref(false);
const selected = ref<string[]>([]);
const statusMsg = ref('');
const isError = ref(false);

const currentLocale = computed(() => (locale.value as LangCode) || 'en');

const options = computed(() =>
  TOPICS.map((topic) => ({
    slug: topic.slug,
    title: (topic.content[currentLocale.value] || topic.content.en).title,
  }))
);

watch(
  () => props.visible,
  async (open) => {
    if (!open) return;
    if (!props.healer.id) return;
    selected.value = [];
    statusMsg.value = '';
    isError.value = false;
    loading.value = true;
    try {
      selected.value = await HealerService.getHealerSpecialties(props.healer.id);
    } catch {
      statusMsg.value = t('Settings_SaveError');
      isError.value = true;
    } finally {
      loading.value = false;
    }
  }
);

function toggle(slug: string, value: unknown) {
  const checked = Boolean(value);
  if (checked) {
    if (!selected.value.includes(slug)) selected.value.push(slug);
  } else {
    selected.value = selected.value.filter((s) => s !== slug);
  }
}

function onClose(value: boolean) {
  emit('update:visible', value);
}

async function save() {
  if (!props.healer.id) return;
  saving.value = true;
  statusMsg.value = '';
  isError.value = false;
  try {
    await HealerService.saveHealerSpecialties(props.healer.id, selected.value);
    statusMsg.value = t('Healer_Specialty_Saved');
  } catch {
    statusMsg.value = t('Settings_SaveError');
    isError.value = true;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.sa-title {
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 4px;
}

.sa-healer {
  margin-inline-start: auto;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.sa-sub {
  color: var(--color-text-muted);
  font-size: 13.5px;
  line-height: 1.6;
  margin: 0 0 14px;
}

.sa-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
  padding-inline-end: 4px;
}

.sa-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: var(--color-surface-alt);
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;

  &.checked {
    border-color: rgba(140, 106, 36, 0.5);
    background: rgba(212, 175, 55, 0.08);
  }
}

.sa-check {
  margin: 0;
}

.sa-item-body {
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: 14.5px;
  }
}

.sa-item-tag {
  font-size: 11.5px;
  color: var(--color-text-muted);
}

.sa-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  margin: 14px 0 0;
}

.sa-actions {
  padding: 4px 16px 16px;
  justify-content: flex-end;
}
</style>