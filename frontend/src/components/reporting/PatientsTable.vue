<template>
  <div>
    <v-card color="green-lighten-2" flat class="elevation-10" width="100%">
      <v-card-actions>
        <v-btn color="success" @click="populateTable()" class="mr-5">
          <h4> {{$t('Run_Report')}}</h4>
          <v-icon end>mdi-magnify</v-icon>
        </v-btn>
        <v-btn @click="exportToExcel()" color="success" class="ma-2">
          <h4> {{$t('Export')}} </h4>
          <v-icon end>mdi-file-export</v-icon>
        </v-btn>
      </v-card-actions>
      <v-data-table :headers="headers" :items="tableData" class="elevation-10">
        <template v-slot:[`item.firstname`]="{ item }">
          {{item.firstName}}
        </template>
        <template v-slot:[`item.lastname`]="{ item }">
          {{item.lastName}}
        </template>
        <template v-slot:[`item.phonenumber`]="{ item }">
          {{item.phone}}
        </template>
      </v-data-table>
    </v-card>
    <ProgressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </div>
</template>

<script setup lang="ts">
import AppConfigs from "@/AppConfigs";
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from '@/dialogs/ProgressBar.vue';
import PatientsTableEntry from "@/interfaces/report/PatientsTableEntry";
import AuthenticationService from '@/services/AuthenticationService';
import ReportingService from "@/services/ReportingService";
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import axios from "axios";
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const loading = ref(false);
const headers = ref([
  {
    title: t("First Name"),
    align: 'start' as const,
    sortable: true,
    key: 'firstname',
    width: "auto"
  },
  {
    title: t("Last Name"),
    align: 'start' as const,
    sortable: true,
    key: 'lastname',
    width: "auto", //15%
  },
  {
    title: t("Phone"),
    key: 'phone',
    align: 'start' as const,
    width: "auto", //15%
    sortable: true
  },
]);
const tableData = ref<PatientsTableEntry[]>([]);

async function populateTable() {
  loading.value = true;
  try {
    tableData.value = [] as PatientsTableEntry[];
    if (userStore.superUser) {
        tableData.value = await ReportingService.getPatientsReportData();
    }
  } catch (error) {
    showMsgBox("Error", String(error));
  } finally { loading.value = false; }
}

function translateContents() {
  headers.value.forEach((item) => {
    item.title = t(item.key);
  });
}

onMounted(() => {
  translateContents();
});

watch(() => appStore.locale, () => {
  translateContents();
});

async function exportToExcel() {
  loading.value = true;
  try {
    if (tableData.value == undefined || tableData.value.length == 0) {
      throw new Error("No report data to export, Please generate the report first");
    }
    let data: string[][] = tableData.value.map((item) => {
      return Array.from([item.firstName, item.lastName, item.phone]);
    });
    data.unshift([t("firstname"), t("lastname"), t("phone")]);
    if (userStore.superUser) {
        await ReportingService.export(data);
        loading.value = false;
        await downloadWithAxios();
    }
  } catch (error) {
    showMsgBox("Error", String(error));
  } finally { loading.value = false; }
}

async function downloadWithAxios() {
  let url: string = AppConfigs.getServerURL() + "/uploadedFiles/Report.xlsx";
  if (userStore.superUser) {
    let config = AuthenticationService.getAxiosConfig(userStore.superUser);
    config.url = url;
    config.method = 'get';
    config.responseType = 'arraybuffer';
    await axios(config)
        .then(response => {
        forceFileDownload(response, "Report.xlsx");
        })
        .catch((error) => {
        showMsgBox("Error downloading Report.xlsx file", error);
        });
  }
}

function forceFileDownload(response: { data: ArrayBuffer }, fileName: string) {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
}

</script>
