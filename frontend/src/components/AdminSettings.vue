<template>
  <v-container fluid>
    <v-toolbar-title class="font-weight-bold mb-4">
      <v-icon class="mr-1" color="primary">mdi-cog-outline</v-icon>
      {{ t('Settings_Title') }}
    </v-toolbar-title>

    <v-card rounded="lg" elevation="2" max-width="620">
      <v-card-text>
        <v-text-field
          v-model="price"
          type="number"
          min="0"
          step="0.01"
          :label="t('Settings_SessionPrice')"
          :suffix="t('Currency')"
          density="comfortable"
          variant="outlined"
        />
        <p class="text-body-2 text-medium-emphasis mb-4">{{ t('Settings_SessionPrice_Sub') }}</p>

        <p v-if="statusMsg" class="settings-status" :class="{ error: isError }">
          <v-icon size="16" :color="isError ? 'error' : 'success'">
            {{ isError ? 'mdi-alert-circle-outline' : 'mdi-check-circle' }}
          </v-icon>
          {{ statusMsg }}
        </p>

        <v-btn
          color="primary"
          elevation="0"
          :disabled="saving"
          :loading="saving"
          @click="save"
        >
          {{ t('Settings_Save') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SpecialtyService from '@/services/SpecialtyService';

const { t } = useI18n();

const price = ref<number | null>(null);
const saving = ref(false);
const statusMsg = ref('');
const isError = ref(false);

async function load() {
  try {
    const config = await SpecialtyService.getPublicConfig();
    price.value = config.sessionPrice || 0;
  } catch {
    statusMsg.value = t('Settings_SaveError');
    isError.value = true;
  }
}

async function save() {
  const value = Number(price.value ?? 0);
  if (Number.isNaN(value) || value < 0) {
    statusMsg.value = t('Settings_SaveError');
    isError.value = true;
    return;
  }
  saving.value = true;
  isError.value = false;
  try {
    await SpecialtyService.setSessionPrice(value);
    statusMsg.value = t('Settings_Saved');
  } catch {
    statusMsg.value = t('Settings_SaveError');
    isError.value = true;
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped lang="scss">
.settings-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  margin: 0 0 14px;
  font-weight: 600;
}
</style>