<template>
  <v-container>
    <v-col cols="12">
      <v-card class="CardTitleClass elevation-10">
        <v-card-title>
          <h4>{{ t('My_Availability') }}</h4>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="addSlot">
            <v-icon left>mdi-plus</v-icon>
            {{ t('Add_Slot') }}
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-table>
            <thead>
              <tr>
                <th>{{ t('Day') }}</th>
                <th>{{ t('Start_Time') }}</th>
                <th>{{ t('End_Time') }}</th>
                <th>{{ t('Active') }}</th>
                <th>{{ t('Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(slot, index) in availability" :key="index">
                <td>
                  <v-select
                    v-model="slot.dayOfWeek"
                    :items="days"
                    item-title="label"
                    item-value="value"
                    density="compact"
                    hide-details
                  ></v-select>
                </td>
                <td>
                  <v-text-field
                    v-model="slot.startTime"
                    type="time"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </td>
                <td>
                  <v-text-field
                    v-model="slot.endTime"
                    type="time"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </td>
                <td>
                  <v-checkbox v-model="slot.isActive" hide-details density="compact"></v-checkbox>
                </td>
                <td>
                  <v-icon color="error" @click="removeSlot(index)">mdi-delete</v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="saveAvailability">{{ t('Save_Availability') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
    <ProgressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AvailabilityService, { HealerAvailability } from '@/services/AvailabilityService';
import { useUserStore } from '@/stores/user';
import { useMessageBox } from '@/composables/useMessageBox';
import ProgressBar from '@/dialogs/ProgressBar.vue';
import MessageBoxDialog from '@/dialogs/MessageBoxDialog.vue';

import UserService from '@/services/UserService';

const { t } = useI18n();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const loading = ref(false);
const availability = ref<HealerAvailability[]>([]);
const currentHealerID = ref<number | null>(null);

const days = [
  { label: t('Sunday'), value: 0 },
  { label: t('Monday'), value: 1 },
  { label: t('Tuesday'), value: 2 },
  { label: t('Wednesday'), value: 3 },
  { label: t('Thursday'), value: 4 },
  { label: t('Friday'), value: 5 },
  { label: t('Saturday'), value: 6 },
];

onMounted(async () => {
  await loadHealerInfo();
});

async function loadHealerInfo() {
  if (!userStore.superUser) return;
  loading.value = true;
  try {
    const me = await UserService.getMe();
    if (me.healerID > 0) {
      currentHealerID.value = me.healerID;
      await loadAvailability();
    } else {
      showMsgBox(t("Info"), t('You_are_not_registered_as_a_healer'));
    }
  } catch (e) {
    showMsgBox(t("Error"), `${t("Failed_to_load_healer_info")}: ${e}`);
  } finally {
    loading.value = false;
  }
}

async function loadAvailability() {
  if (!userStore.superUser || !currentHealerID.value) return;
  loading.value = true;
  try {
    availability.value = await AvailabilityService.getHealerAvailability(true, currentHealerID.value);
  } catch (e) {
    showMsgBox(t("Error"), `${t("Failed_to_load_availability")}: ${e}`);
  } finally {
    loading.value = false;
  }
}

function addSlot() {
  if (!currentHealerID.value) return;
  availability.value.push({
    healerID: currentHealerID.value,
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    isActive: true
  });
}

function removeSlot(index: number) {
  availability.value.splice(index, 1);
}

async function saveAvailability() {
  if (!userStore.superUser || !currentHealerID.value) return;
  loading.value = true;
  try {
    await AvailabilityService.saveHealerAvailability( currentHealerID.value, availability.value);
    showMsgBox(t("Success"), t('Availability_saved_successfully'));
  } catch (e) {
    showMsgBox(t("Error"), `${t("Failed_to_save_availability")}: ${e}`);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.CardTitleClass {
  background-color: rgba(79, 138, 24, 0.623);
}
</style>
