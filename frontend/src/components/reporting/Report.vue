<template>
  <div>
    <v-progress-circular v-if="loading" :size="70" :width="7" color="purple" indeterminate></v-progress-circular>
    <v-tabs v-model="reportTabsStore.activeTab" centered background-color="rgba(222, 161, 250, 0.863)" grow
      class="elevation-10">
      <v-tab :value="0">
        {{ t('Patients') }}
        <v-icon>mdi-account-box</v-icon>
      </v-tab>
      <v-tab :value="1">
        {{ t('Treatments') }}
        <v-icon>mdi-assignment-ind</v-icon>
      </v-tab>
    </v-tabs>

    <v-window v-model="reportTabsStore.activeTab">
      <v-window-item :value="0">
        <PatientsTable />
      </v-window-item>
      <v-window-item :value="1">
        <TreatmentsTable />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import PatientsTable from "@/components/reporting/PatientsTable.vue";
import TreatmentsTable from "@/components/reporting/TreatmentsTable.vue";
import { useReportTabsStore } from '@/stores/reportTabs';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';

const { t } = useI18n();
const reportTabsStore = useReportTabsStore();

const loading = ref(false);

onBeforeRouteLeave((to, from, next) => {
  // No need to save the active tab, as it's already bound to the store
  next();
});
</script>
