<template>
  <div>
    <v-col cols="12">
      <v-card class="CardTitleClass elevation-10">
        <v-card-title>
          <h4>{{ t('List_healers') }}</h4>
          <v-spacer></v-spacer>
          <v-icon large color="primary" @click="showDialog = true">mdi-account-plus</v-icon>
          <FindUsers :showDialog="showDialog" @searchResultChanged="addNewHealers"
            @CloseSearchDialog="showDialog = false" />
        </v-card-title>
        <v-data-table :headers="translatedHeaders" :items="healers" class="elevation-1">
          <template v-slot:[`item.level`]="{ item }">
            {{ t(getHealerLevelAsString(item.level)) }}
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-icon color="primary" @click="confirmDeletion(item)">mdi-account-off</v-icon>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
    <ProgressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useMessageBox } from '@/composables/useMessageBox';
import ConfirmDialog from "@/dialogs/ConfirmDialog.vue";
import FindUsers from "@/dialogs/FindUsers.vue";
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from '@/dialogs/ProgressBar.vue';
import { HealingLevelEnum } from '@/enumerators/HealingLevelEnum';
import Healer from '@/models/Healer';
import HealerService from "@/services/HealerService";
import { useUserStore } from '@/stores/user';
import { getIndexOfArrayObject } from '@/utilities/MyUtilities';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();
const { confirmDialogContents, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();

const showDialog = ref(false);
const loading = ref(false);
const healers = ref<Healer[]>([]);

const headers = ref([
  { title: 'First_Name', key: 'firstName', sortable: true },
  { title: 'Last_Name', key: 'lastName', sortable: true },
  { title: 'level', key: 'level', sortable: true },
  { title: 'phone', key: 'phone', sortable: true },
  { title: 'actions', key: 'actions', sortable: false }
]);

const translatedHeaders = computed(() => {
  return headers.value.map(header => ({
    ...header,
    title: t(header.title)
  }));
});



onMounted(async () => {
  await updateHealersList();
});

async function updateHealersList() {
  loading.value = true;
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    const result = await HealerService.getAllHealers();
    healers.value = result.map(item => new Healer(item));
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function confirmDeletion(healer: Healer) {
  showConfirmDialog(t("Confirmation"), t('ARE_YOU_SURE_REMOVE_FROM_LIST'), () => deleteHealer(healer), null);
}

async function deleteHealer(healer: Healer) {
  closeConfirmDialog();
  loading.value = true;
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    if (!healer.id) return;
    await HealerService.deleteHealer( healer.id);
    const index = getIndexOfArrayObject(healers.value, healer);
    if (index !== -1) {
      healers.value.splice(index, 1);
    }
  } catch (error) {
    showMsgBox(t("Error"), `${t("Failed_to_delete_healer")}: ${error}`);
  } finally {
    loading.value = false;
  }
}

async function addNewHealers(selectedNewHealers: Healer[]) {
  if (!selectedNewHealers || selectedNewHealers.length === 0) return;
  loading.value = true;
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    for (const healer of selectedNewHealers) {
      if (!healers.value.some(h => h.personID === healer.personID)) {
        if (healer.personID) {
          const newHealer = await HealerService.createHealer( healer);
          if (newHealer) {
            healers.value.push(newHealer);
          }
        }
      }
    }
  } catch (error) {
    showMsgBox(t("Error"), `${t("Error_adding_new_healer")}: ${error}`);
  } finally {
    loading.value = false;
  }
}

function getHealerLevelAsString(level: number): string {
  return HealingLevelEnum.getLevelToStringByID(level);
}
</script>

<style scoped>
.CardTitleClass {
  background-color: rgba(79, 138, 24, 0.623);
}
</style>
