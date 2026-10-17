<template>
  <v-container fluid class="dashboard-container pa-4">
    <!-- Header -->
    <v-row class="mb-2" align="center">
      <v-col>
        <h1 class="text-h5 font-weight-bold">
          <v-icon class="mr-2" color="primary">mdi-view-dashboard</v-icon>
          {{ t('Dashboard') }}
        </h1>
        <p class="text-caption text-medium-emphasis mt-1">
          {{ t('Dashboard_subtitle') }}
        </p>
      </v-col>
      <v-col cols="auto">
        <v-btn
          :loading="loading"
          icon="mdi-refresh"
          variant="tonal"
          color="primary"
          size="small"
          @click="loadStats"
        />
      </v-col>
    </v-row>

    <!-- Error alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <!-- ── KPI Cards Row 1: Patients & Appointments ── -->
    <v-row dense>
      <!-- Total Patients -->
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="lg" elevation="2" class="kpi-card">
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar color="blue-lighten-4" size="52" class="mr-3">
              <v-icon color="blue-darken-2" size="28">mdi-account-group</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h5 font-weight-bold">
                <span v-if="loading"><v-progress-circular indeterminate size="20" width="2" /></span>
                <span v-else>{{ stats.totalPatients }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ t('Total_Patients') }}</div>
              <div class="d-flex align-center gap-1 mt-1">
                <v-chip
                  v-if="!loading && stats.newPatientsThisMonth > 0"
                  size="x-small"
                  color="blue"
                  variant="tonal"
                >
                  +{{ stats.newPatientsThisMonth }} {{ t('New_This_Month') }}
                </v-chip>
                <TrendBadge v-if="!loading" :value="stats.newPatientsThisMonth" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Appointments Today -->
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="lg" elevation="2" class="kpi-card">
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar color="green-lighten-4" size="52" class="mr-3">
              <v-icon color="green-darken-2" size="28">mdi-calendar-today</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h5 font-weight-bold">
                <span v-if="loading"><v-progress-circular indeterminate size="20" width="2" /></span>
                <span v-else>{{ stats.appointmentsToday }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ t('Appointments_Today') }}</div>
              <div class="d-flex align-center gap-1 mt-1">
                <v-chip
                  v-if="!loading"
                  size="x-small"
                  color="green"
                  variant="tonal"
                >
                  {{ stats.appointmentsThisWeek }} {{ t('This_Week') }}
                </v-chip>
                <TrendBadge v-if="!loading" :value="stats.appointmentsToday" :neutral-zero="true" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Upcoming Appointments -->
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="lg" elevation="2" class="kpi-card">
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar color="orange-lighten-4" size="52" class="mr-3">
              <v-icon color="orange-darken-2" size="28">mdi-calendar-clock</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h5 font-weight-bold">
                <span v-if="loading"><v-progress-circular indeterminate size="20" width="2" /></span>
                <span v-else>{{ stats.upcomingAppointments }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ t('Upcoming_7_Days') }}</div>
              <TrendBadge v-if="!loading" :value="stats.upcomingAppointments" :neutral-zero="true" class="mt-1" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Total Healers -->
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="lg" elevation="2" class="kpi-card">
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar color="purple-lighten-4" size="52" class="mr-3">
              <v-icon color="purple-darken-2" size="28">mdi-account-tie</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h5 font-weight-bold">
                <span v-if="loading"><v-progress-circular indeterminate size="20" width="2" /></span>
                <span v-else>{{ stats.totalHealers }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ t('Total_Healers') }}</div>
              <TrendBadge v-if="!loading" :value="stats.totalHealers" :neutral-zero="true" class="mt-1" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── KPI Cards Row 2: Treatments & Revenue ── -->
    <v-row dense class="mt-2">
      <!-- Open Treatments -->
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="lg" elevation="2" class="kpi-card">
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar color="teal-lighten-4" size="52" class="mr-3">
              <v-icon color="teal-darken-2" size="28">mdi-medical-bag</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h5 font-weight-bold">
                <span v-if="loading"><v-progress-circular indeterminate size="20" width="2" /></span>
                <span v-else>{{ stats.openTreatments }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ t('Open_Treatments') }}</div>
              <TrendBadge v-if="!loading" :value="stats.openTreatments" :neutral-zero="true" :invert="true" class="mt-1" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Treatment Completion Rate -->
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="lg" elevation="2" class="kpi-card">
          <v-card-text class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-avatar color="indigo-lighten-4" size="52" class="mr-3">
                <v-icon color="indigo-darken-2" size="28">mdi-check-circle-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold">
                  <span v-if="loading"><v-progress-circular indeterminate size="20" width="2" /></span>
                  <span v-else>{{ completionRateDisplay }}%</span>
                </div>
                <div class="text-caption text-medium-emphasis">{{ t('Treatment_Completion') }}</div>
              </div>
            </div>
            <v-progress-linear
              v-if="!loading"
              :model-value="stats.treatmentCompletionRate"
              color="indigo"
              bg-color="indigo-lighten-4"
              rounded
              height="6"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Revenue This Month -->
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="lg" elevation="2" class="kpi-card">
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar color="green-lighten-4" size="52" class="mr-3">
              <v-icon color="green-darken-3" size="28">mdi-cash-multiple</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">
                <span v-if="loading"><v-progress-circular indeterminate size="20" width="2" /></span>
                <span v-else>{{ formatCurrency(stats.revenueThisMonth) }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ t('Revenue_This_Month') }}</div>
              <v-chip
                v-if="!loading"
                size="x-small"
                color="green"
                variant="tonal"
                class="mt-1"
              >
                {{ t('Total') }}: {{ formatCurrency(stats.totalRevenue) }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Unpaid Balance -->
      <v-col cols="12" sm="6" md="3">
        <v-card rounded="lg" elevation="2" class="kpi-card">
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar color="red-lighten-4" size="52" class="mr-3">
              <v-icon color="red-darken-2" size="28">mdi-cash-remove</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">
                <span v-if="loading"><v-progress-circular indeterminate size="20" width="2" /></span>
                <span v-else>{{ formatCurrency(stats.totalUnpaid) }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ t('Unpaid_Balance') }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Charts Row ── -->
    <v-row class="mt-4" dense>
      <!-- Treatment Status Breakdown (donut) -->
      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="2" height="100%">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-0">
            <v-icon class="mr-1" size="20" color="primary">mdi-chart-donut</v-icon>
            {{ t('Treatment_Status_Breakdown') }}
          </v-card-title>
          <v-card-text class="d-flex flex-column align-center justify-center" style="min-height:220px">
            <template v-if="loading">
              <v-progress-circular indeterminate color="primary" />
            </template>
            <template v-else-if="stats.openTreatments === 0 && stats.closedTreatments === 0">
              <v-icon size="48" color="grey-lighten-2">mdi-chart-donut</v-icon>
              <p class="text-caption text-medium-emphasis mt-2">{{ t('No_data_available') }}</p>
            </template>
            <template v-else>
              <!-- SVG donut chart — no external chart library needed -->
              <svg viewBox="0 0 120 120" width="160" height="160">
                <circle
                  cx="60" cy="60" r="45"
                  fill="none"
                  stroke="#E8EAF6"
                  stroke-width="18"
                />
                <!-- Closed (completed) arc -->
                <circle
                  cx="60" cy="60" r="45"
                  fill="none"
                  stroke="#5C6BC0"
                  stroke-width="18"
                  stroke-dasharray="0 283"
                  :style="closedArcStyle"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)"
                />
                <!-- Open arc -->
                <circle
                  cx="60" cy="60" r="45"
                  fill="none"
                  stroke="#EF9A9A"
                  stroke-width="18"
                  :style="openArcStyle"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="64" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">
                  {{ completionRateDisplay }}%
                </text>
              </svg>
              <div class="d-flex gap-4 mt-2">
                <div class="d-flex align-center">
                  <span class="legend-dot" style="background:#5C6BC0"></span>
                  <span class="text-caption ml-1">{{ t('Closed') }} ({{ stats.closedTreatments }})</span>
                </div>
                <div class="d-flex align-center ml-4">
                  <span class="legend-dot" style="background:#EF9A9A"></span>
                  <span class="text-caption ml-1">{{ t('Open') }} ({{ stats.openTreatments }})</span>
                </div>
              </div>
            </template>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Revenue Summary -->
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="2" height="100%">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-0">
            <v-icon class="mr-1" size="20" color="primary">mdi-chart-bar</v-icon>
            {{ t('Revenue_Summary') }}
          </v-card-title>
          <v-card-text style="min-height:220px">
            <template v-if="loading">
              <div class="d-flex justify-center align-center" style="height:180px">
                <v-progress-circular indeterminate color="primary" />
              </div>
            </template>
            <template v-else>
              <v-list density="compact" class="mt-2">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="green-darken-2" class="mr-2">mdi-cash-check</v-icon>
                  </template>
                  <v-list-item-title>{{ t('Revenue_This_Month') }}</v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold text-green-darken-2">{{ formatCurrency(stats.revenueThisMonth) }}</span>
                  </template>
                </v-list-item>
                <v-divider />
                <v-list-item>
                  <template #prepend>
                    <v-icon color="blue-darken-2" class="mr-2">mdi-cash-multiple</v-icon>
                  </template>
                  <v-list-item-title>{{ t('Total_Revenue_All_Time') }}</v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold text-blue-darken-2">{{ formatCurrency(stats.totalRevenue) }}</span>
                  </template>
                </v-list-item>
                <v-divider />
                <v-list-item>
                  <template #prepend>
                    <v-icon color="red-darken-2" class="mr-2">mdi-cash-remove</v-icon>
                  </template>
                  <v-list-item-title>{{ t('Unpaid_Balance') }}</v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold text-red-darken-2">{{ formatCurrency(stats.totalUnpaid) }}</span>
                  </template>
                </v-list-item>
                <v-divider />
                <v-list-item>
                  <template #prepend>
                    <v-icon color="teal-darken-2" class="mr-2">mdi-percent</v-icon>
                  </template>
                  <v-list-item-title>{{ t('Collection_Rate') }}</v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold text-teal-darken-2">{{ collectionRateDisplay }}%</span>
                  </template>
                </v-list-item>
              </v-list>

              <!-- Collection rate bar -->
              <div class="px-2 mt-2">
                <v-progress-linear
                  :model-value="collectionRate"
                  color="teal"
                  bg-color="teal-lighten-4"
                  rounded
                  height="8"
                />
              </div>
            </template>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Quick Links ── -->
    <v-row class="mt-4" dense>
      <v-col cols="12">
        <v-card rounded="lg" elevation="2">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
            <v-icon class="mr-1" size="20" color="primary">mdi-lightning-bolt</v-icon>
            {{ t('Quick_Actions') }}
          </v-card-title>
          <v-card-text class="pt-0">
            <v-row dense>
              <v-col v-for="action in quickActions" :key="action.name" cols="6" sm="4" md="2">
                <v-btn
                  :to="{ name: action.route }"
                  :color="action.color"
                  variant="tonal"
                  block
                  class="quick-action-btn"
                  height="64"
                >
                  <div class="d-flex flex-column align-center">
                    <v-icon size="24" class="mb-1">{{ action.icon }}</v-icon>
                    <span class="text-caption">{{ t(action.label) }}</span>
                  </div>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Last refreshed -->
    <div class="text-caption text-medium-emphasis text-right mt-3" v-if="lastRefreshed">
      {{ t('Last_Refreshed') }}: {{ lastRefreshed }}
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import DashboardService, { type DashboardStats } from '@/services/DashboardService';
import { format } from 'date-fns';
import TrendBadge from '@/components/widgets/TrendBadge.vue';

const { t } = useI18n();
const userStore = useUserStore();

const loading = ref(false);
const error = ref('');
const lastRefreshed = ref('');

const stats = ref<DashboardStats>({
  totalPatients: 0,
  newPatientsThisMonth: 0,
  appointmentsToday: 0,
  appointmentsThisWeek: 0,
  openTreatments: 0,
  closedTreatments: 0,
  treatmentCompletionRate: 0,
  revenueThisMonth: 0,
  totalRevenue: 0,
  totalUnpaid: 0,
  totalHealers: 0,
  upcomingAppointments: 0,
});

// ── Computed ──────────────────────────────────────────────────────────────────

const completionRateDisplay = computed(() =>
  stats.value.treatmentCompletionRate.toFixed(1)
);

const collectionRate = computed(() => {
  const total = stats.value.totalRevenue + stats.value.totalUnpaid;
  if (total === 0) return 0;
  return (stats.value.totalRevenue / total) * 100;
});

const collectionRateDisplay = computed(() => collectionRate.value.toFixed(1));

// SVG donut arc helpers (circumference = 2π × 45 ≈ 283)
const CIRCUMFERENCE = 2 * Math.PI * 45;

const closedArcStyle = computed(() => {
  const total = stats.value.openTreatments + stats.value.closedTreatments;
  if (total === 0) return { strokeDasharray: `0 ${CIRCUMFERENCE}` };
  const closedFraction = stats.value.closedTreatments / total;
  const dash = closedFraction * CIRCUMFERENCE;
  return { strokeDasharray: `${dash} ${CIRCUMFERENCE - dash}` };
});

const openArcStyle = computed(() => {
  const total = stats.value.openTreatments + stats.value.closedTreatments;
  if (total === 0) return { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: '0' };
  const closedFraction = stats.value.closedTreatments / total;
  const closedDash = closedFraction * CIRCUMFERENCE;
  const openDash = (stats.value.openTreatments / total) * CIRCUMFERENCE;
  // offset so open arc starts where closed arc ends
  return {
    strokeDasharray: `${openDash} ${CIRCUMFERENCE - openDash}`,
    strokeDashoffset: `${-closedDash}`,
  };
});

// ── Quick Actions ─────────────────────────────────────────────────────────────

const quickActions = [
  { name: 'scheduler',  route: 'Scheduler',  icon: 'mdi-calendar-plus',    label: 'Scheduler',        color: 'green'  },
  { name: 'people',     route: 'People',     icon: 'mdi-account-plus',     label: 'People',           color: 'blue'   },
  { name: 'healers',    route: 'healers',    icon: 'mdi-account-tie',      label: 'Healers',          color: 'purple' },
  { name: 'report',     route: 'report',     icon: 'mdi-chart-bar',        label: 'Reporting',        color: 'orange' },
  { name: 'bill',       route: 'bill',       icon: 'mdi-cash-multiple',    label: 'Bill',             color: 'teal'   },
  { name: 'inbox',      route: 'Inbox',      icon: 'mdi-email-outline',    label: 'Inbox',            color: 'indigo' },
];

// ── Methods ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

async function loadStats() {
  if (!userStore.superUser) return;
  loading.value = true;
  error.value = '';
  try {
    stats.value = await DashboardService.getStats();
    lastRefreshed.value = format(new Date(), 'HH:mm:ss');
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
}

.kpi-card {
  transition: box-shadow 0.2s ease;
}
.kpi-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.quick-action-btn {
  text-transform: none;
  letter-spacing: 0;
}
</style>
