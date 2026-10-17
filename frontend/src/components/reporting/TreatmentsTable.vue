<template>
  <div>
    <v-form ref="form">
      <v-card color="green-lighten-2" flat class="elevation-10" width="100%">
        <v-card-actions>
          <v-text-field v-model="startDate" :label="$t('Start_Date')" placeholder=" DD-MM-YYYY" :rules="validateDates(startDate)" />
          <v-spacer />
          <v-text-field v-model="endDate" :label="$t('End_Date')" placeholder=" DD-MM-YYYY" :rules="validateDates(endDate)" />
        </v-card-actions>
        <v-card-actions>
          <v-select :items="statusList" v-model="status" :label="$t('status')" />
          <v-spacer />
          <v-select v-model.number="healerID" :label="$t('Healers').toString()" :items="healers" item-title="fullName" item-value="id" />
          <v-spacer />

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
          <template v-slot:[`item.patientName`]="{ item }">
            {{ item.patientFN + " " + item.patientLN}}
          </template>

          <template v-slot:[`item.nature`]="{ item }">
            {{ getNatureDescription(item.nature)}}
          </template>

          <template v-slot:[`item.diagnostic`]="{ item }">
            {{ getDiagnosticDescription(item.nature,item.diagnostic)}}
          </template>

          <template v-slot:[`item.startDate`]="{ item }">
            {{ dateFormater(item.startDate, 'YYYY-MM-DDTHH:mm:ssZ','DD-MM-YYYY') }}
          </template>

          <template v-slot:[`item.rest`]="{ item }">
            <v-chip :color="getColor(item)"> {{ (item.totalCost - item.payed).toFixed(2) }}</v-chip>
          </template>

          <template v-slot:[`item.healerName`]="{ item }">
            {{ (item.healerFN || '').trim() }}
          </template>
        </v-data-table>
      </v-card>
    </v-form>
    <ProgressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </div>
</template>

<script setup lang="ts">
import AppConfigs from "@/AppConfigs";
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from '@/dialogs/ProgressBar.vue';
import { TreatmentStatusEnum } from '@/enumerators/TreatmentStatusEnum';
import { langsEnum } from '@/enumerators/enums';
import TreatmentsTableEntry from "@/interfaces/report/TreatmentsTableEntry";
import Healer from '@/models/Healer';
import AuthenticationService from '@/services/AuthenticationService';
import HealerService from "@/services/HealerService";
import ReportingService from "@/services/ReportingService";
import SicknessNatureService from "@/services/SicknessNatureService";
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import Language from '@/utilities/Language';
import { dateFormater, isValidDate } from "@/utilities/dateTime";
import axios from "axios";
import { endOfDay, format, getYear, isAfter, parse, startOfDay } from 'date-fns';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VForm } from 'vuetify/components';

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const loading = ref(false);
const colWidth = ref("5%");
const startDate = ref("");
const endDate = ref(format(new Date(), 'dd-MM-yyyy'));
const headers = ref([
  {
    title: t("Patient Name"),
    align: 'start' as const,
    sortable: false,
    key: 'patientName',
    width: "auto"
  },
  {
    title: t("Nature"),
    align: 'start' as const,
    sortable: true,
    key: 'nature',
    width: "auto", //15%
  },
  {
    title: t("Diagnostic"),
    key: 'diagnostic',
    align: 'start' as const,
    width: "auto", //15%
    sortable: true
  },
  {
    title: t("Date"),
    key: 'startDate',
    align: 'start' as const,
    width: "10%",
    sortable: true
  },
  {
    title: t("TotalCost"),
    key: 'totalCost',
    align: 'start' as const,
    sortable: true,
    width: colWidth.value
  },
  {
    title: t("payed"),
    key: 'payed',
    align: 'start' as const,
    sortable: true,
    width: colWidth.value
  },
  {
    title: t("Reste"),
    key: 'rest',
    sortable: false,
    align: 'start' as const,
    width: colWidth.value
  },
  {
    title: t("Status"),
    key: 'status',
    align: 'start' as const,
    sortable: true,
    width: colWidth.value
  },
  {
    title: t("Healer Name"),
    align: 'end' as const,
    sortable: false,
    key: 'healerName',
    width: "auto"
  }
]);
const healers = ref<Healer[]>([]);
const healerID = ref(-1);
const status = ref<TreatmentStatusEnum.Status>(TreatmentStatusEnum.Status.ALL);
const statusList = ref([
   { title: t('All'), value: TreatmentStatusEnum.Status.ALL },
  { title: t('Open'), value: TreatmentStatusEnum.Status.OPEN },
  { title: t('Closed'), value: TreatmentStatusEnum.Status.CLOSED }
]);
const tableData = ref<TreatmentsTableEntry[]>([]);
const form = ref<VForm | null>(null);

function validateDates(date: string): (string | boolean)[] {
  const msg: string = "Should be a valid Date";
  if (!date || date.trim() == '' || !isValidDate(date, 'DD-MM-YYYY')) {
    return [msg];
  }
  if (isAfter(parse(startDate.value, 'dd-MM-yyyy', new Date()), parse(endDate.value, 'dd-MM-yyyy', new Date()))) {
    return ["Start date should never be greater than End date"];
  }
  return [true];
}

async function exportToExcel() {
  loading.value = true;
  try {
    if (tableData.value == undefined || tableData.value.length == 0) {
      throw new Error("No report data to export, Please generate the report first");
    }
    let data: string[][] = tableData.value.map((item) => {
      let sicknessNatureDescription: string = getNatureDescription(item.nature);
      let sicknessNatureDiagnostic: string = getDiagnosticDescription(item.nature, item.diagnostic);
      return Array.from([
        item.patientFN + " " + item.patientLN, sicknessNatureDescription, sicknessNatureDiagnostic, dateFormater(item.startDate, 'YYYY-MM-DDTHH:mm:ssZ', 'DD-MM-YYYY'), item.totalCost.toString(), item.payed.toString(), (item.totalCost - item.payed).toString(), item.status, item.healerFN + " " + item.healerLN
      ]);
    });
    data.unshift([t("patientName"), t("nature"), t("diagnostic"), t("startDate"), t("totalCost"), t("payed"), t("rest"), t("status"), t("healerName")]);
    if (userStore.superUser) {
        await ReportingService.export(data);
        loading.value = false;
        await downloadWithAxios();
    }
  } catch (error) {
    showMsgBox("Error", String(error));
  } finally { loading.value = false; }
}

async function populateTable() {
  const validationResult = await form.value?.validate();
  if (validationResult && !validationResult.valid) {
    showMsgBox("Warning", "Form has validation errors");
    return;
  }
  loading.value = true;
  try {
    tableData.value = [] as TreatmentsTableEntry[];
    const statusValue: TreatmentStatusEnum.Status = status.value;
    let startDateValue = startDate.value;
    let endDateValue = endDate.value;
    const healerIDValue = healerID.value;
    startDateValue = format(startOfDay(parse(startDateValue, 'dd-MM-yyyy', new Date())), "yyyy-MM-dd'T'HH:mm:ssxxx");
    endDateValue = format(endOfDay(parse(endDateValue, 'dd-MM-yyyy', new Date())), "yyyy-MM-dd'T'HH:mm:ssxxx");
    if (userStore.superUser) {
        tableData.value = await ReportingService.getTreatmentsReportData(statusValue, startDateValue, endDateValue, healerIDValue);
    }
  } catch (error) {
    showMsgBox("Error", String(error));
  } finally { loading.value = false; }
}

function getColor(item: TreatmentsTableEntry) {
  const rest: number = item.totalCost - item.payed;
  if (rest > 0) {
    return 'red';
  }
  if (item.totalCost == 0 && item.payed == 0) {
    return 'yellow';
  } else return 'green';
}

function translateContents() {
  headers.value.forEach((item) => {
    item.title = t(item.key);
  });
}

function getNatureDescription(natureID: number): string {
  const activeLang: langsEnum = Language.getActiveLang(appStore.locale);
  return SicknessNatureService.getNatureDescription(natureID, activeLang);
}

function getDiagnosticDescription(natureID: number, diagnosticID: number): string {
  const activeLang: langsEnum = Language.getActiveLang(appStore.locale);
  return SicknessNatureService.getDiagnosticDescription(natureID, diagnosticID, activeLang);
}

onMounted(async () => {
  const today = new Date();
  const month = format(today, 'MM');
  let monthStart: string = "01-" + month + "-" + getYear(today).toString();
  startDate.value = monthStart;

  if (userStore.superUser) {
    const healersData = await HealerService.getAllHealers();
    if (healersData !== undefined && healersData.length > 0) {
        const defaultHealer = new Healer({
          id: -1,
          level: 0,
          firstName: t("ALL"),
          lastName: "",
          phone: ""
        });
        healers.value = [defaultHealer, ...healersData];
    }
  }
  translateContents();
});

watch(() => appStore.locale, () => {
  translateContents();
});

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
