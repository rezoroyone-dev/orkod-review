<template>
  <div id="content">
    <div v-if="person && person.firstName">
        <v-card color="primary">
          <v-card-actions>
            <v-card-title primary-title v-if="person && person.firstName" class="mx-5">
              <h4>{{ person.firstName }} {{ person.lastName }}</h4>
            </v-card-title>
            <v-spacer />
            <v-card-title v-if="person">
              <h4>{{ $t('Folder_Number') }} {{ person.folderNumber ? person.folderNumber : person?.id }}</h4>
            </v-card-title>
          </v-card-actions>
        </v-card>
        <div class="mt-4">
          <v-card text color="blue">
            <v-card-title>{{ $t("List_Future_Events") }}</v-card-title>
            <v-data-table :headers="headers" :items="events" class="elevation-10 tableClass">
              <template v-slot:[`item.start`]="{ item }">
                {{ item && item.start ? dateFormater(item.start, ['YYYY-MM-DDTHH:mm:ssZ','YYYY-MM-DDTHH:mm:ss.SSSSZ'],'DD-MM-YYYY') : '' }}
              </template>
              <template v-slot:[`item.time`]="{ item }">
                {{ item && item.start ? dateFormater(item.start, ['YYYY-MM-DDTHH:mm:ssZ','YYYY-MM-DDTHH:mm:ss.SSSSZ'],'HH:mm') : '' }}
              </template>
            </v-data-table>
          </v-card>
        </div>
      <ProgressBar :loading="loading" />
      <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    </div>
    <div v-else>
      <br>
      <br>
      <h2>{{ $t("selectPersonForDetails") }}</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from '@/dialogs/MessageBoxDialog.vue';
import ProgressBar from '@/dialogs/ProgressBar.vue';
import Schedule from '@/interfaces/Schedule';
import SchedulerService from '@/services/SchedulerService';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { dateFormater } from '@/utilities/dateTime';
import { addYears, format } from 'date-fns';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const appStore = useAppStore();
const userStore = useUserStore();
const { t } = useI18n();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const loading = ref(false);
const events = ref<Schedule[]>([]);
const headers = ref([
  {
    title: t('Title'),
    align: 'start' as const,
    sortable: false,
    key: 'title',
    class: "tableClass"
  },
  {
    title: t('Date'),
    key: 'start',
    align: 'start' as const,
    sortable: true
  },
  {
    title: t('Time'),
    key: 'time',
    align: 'start' as const,
    sortable: true
  },
]);

const person = computed(() => appStore.activePerson);

function translateContents() {
  headers.value.forEach((item) => {
    item.title = t(item.key)
  })
}

async function updateEventsList() {
  try {
    loading.value = true
    let personID = person.value.id;
    if (personID === undefined) {
      return;
    }
    const now = new Date();
    const startRange = format(now, "yyyy-MM-dd'T'HH:mm:ssxxx");
    const endRange = format(addYears(now, 1), "yyyy-MM-dd'T'HH:mm:ssxxx");
    if (userStore.superUser) {
        events.value = await SchedulerService.getFutureSchedules( personID, startRange, endRange);
    }
  } catch (error) {
    showMsgBox("Error", String(error))
  } finally { loading.value = false }
}

onMounted(() => {
  translateContents();
  if (userStore.superUser && userStore.superUser.id !== -1) {
    updateEventsList();
  }
});

watch(person, () => {
    if (userStore.superUser && userStore.superUser.id !== -1) {
        updateEventsList();
    }
});

watch(() => appStore.locale, () => {
  translateContents();
});

watch(() => userStore.superUser, (newUser) => {
    if (newUser && newUser.id !== -1) {
        updateEventsList();
    }
}, { deep: true });

</script>

<style lang="css" scoped>
  .tableClass {
    background-color: rgb(223, 230, 204);
    font-weight: bold;
    size: 15px;
  }

  /* #content {
        background-color: rgb(95, 74, 116);
    } */
</style>
