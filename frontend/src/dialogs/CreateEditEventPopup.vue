<template>
  <div>
    <v-dialog id="dialog" :model-value="show" @update:model-value="$emit('update:show', $event)" transition="dialog-bottom-transition">
      <v-card>
        <v-tabs v-model="activeTab" centered color="primary" icons-and-text>
          <v-tab id="tab-1">
            {{ $t("Event_Informations") }}
            <v-icon>mdi-account-box</v-icon>
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <v-window-item>
            <v-form ref="form">
              <v-card-text>
                <v-container fluid>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field :label="$t('Subject')" v-model="schedule.title" :rules="titleRules" required @change="updateTitleInStore()" />
                      <v-radio-group v-model="schedule.isLocal" row mandatory @change="updateSelectedCenter()">
                        <v-radio :label="$t('Local')" :value="true"></v-radio>
                        <v-radio :label="$t('Remote')" :value="false"></v-radio>
                      </v-radio-group>
                      <CenterList v-if="schedule.isLocal" />
                      <SearchHealers />
                      <SearchAttendees />
                    </v-col>
                    <v-col cols="12" md="6">
                      <SicknessNatureList v-if="attendees.length <= 1" :show="showSicknessNatureList" />
                      <MeditationList :show="showMeditationList" />
                      <v-text-field v-model="startDateTime" :label="$t('Select_Start_Date')" prepend-icon="mdi-calendar" readonly @click="modalStartDate = true" />
                      <v-text-field v-model="endDateTime" :label="$t('Select_End_Date')" prepend-icon="mdi-calendar" readonly @click="modalEndDate = true" />

                      <!-- Recurrence section — 3 rows × 2 columns -->
                      <v-divider class="my-2" />
                      <v-row dense align="center">
                        <!-- Row 1: toggle (left) | type selector (right, only when enabled) -->
                        <v-col cols="6">
                          <v-switch
                            v-model="enableRecurrence"
                            :label="$t('Enable_Recurrence')"
                            color="primary"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6">
                          <v-select
                            v-if="enableRecurrence"
                            v-model="recurrenceType"
                            :label="$t('Recurrence_Type')"
                            :items="recurrenceTypeItems"
                            item-title="label"
                            item-value="value"
                            prepend-icon="mdi-repeat"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                      </v-row>
                      <v-row dense v-if="enableRecurrence">
                        <!-- Row 2: occurrences count (left) | end date (right) -->
                        <v-col cols="6">
                          <v-text-field
                            v-model.number="recurrenceInterval"
                            :label="$t('Number_of_Occurrences')"
                            type="number"
                            min="2"
                            max="52"
                            prepend-icon="mdi-counter"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6">
                          <v-text-field
                            v-model="recurrenceEndDateDisplay"
                            :label="$t('Recurrence_End_Date')"
                            prepend-icon="mdi-calendar-end"
                            readonly
                            clearable
                            density="compact"
                            hide-details
                            @click="modalRecurrenceEndDate = true"
                            @click:clear="recurrenceEndDate = ''"
                          />
                        </v-col>
                      </v-row>
                      <!-- Row 3: summary alert (full width) -->
                      <v-row dense v-if="enableRecurrence && recurrenceSummary">
                        <v-col cols="12">
                          <v-alert type="info" density="compact" variant="tonal" class="mt-1">
                            {{ recurrenceSummary }}
                          </v-alert>
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="red darken-1" text @click="closeMe">{{ $t("Cancel") }}</v-btn>
                <v-btn color="green darken-1" text @click="saveSchedule()">OK</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="copySchedule">
                  <v-icon left>mdi-content-copy</v-icon>
                  Copy
                </v-btn>
                <v-btn color="blue darken-1" text @click="pasteSchedule">
                  <v-icon left>mdi-content-paste</v-icon>
                  Paste
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-window-item>
        </v-window>
      </v-card>
    </v-dialog>

    <v-dialog v-model="modalStartDate" width="auto">
      <v-card>
        <v-row>
          <v-col>
            <v-date-picker v-model="startDate" scrollable landscape :locale="$i18n.locale"></v-date-picker>
          </v-col>
          <v-col>
            <v-time-picker v-model="startTime" format="24hr"></v-time-picker>
          </v-col>
        </v-row>
        <v-card-actions>
          <v-btn color="primary" @click="modalStartDate = false">{{ $t("Cancel") }}</v-btn>
          <v-btn color="primary" @click="modalStartDate = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="modalEndDate" width="auto">
      <v-card>
        <v-row>
          <v-col>
            <v-date-picker v-model="endDate" scrollable landscape :locale="$i18n.locale"></v-date-picker>
          </v-col>
          <v-col>
            <v-time-picker v-model="endTime" format="24hr"></v-time-picker>
          </v-col>
        </v-row>
        <v-card-actions>
          <v-btn color="primary" @click="modalEndDate = false">{{ $t("Cancel") }}</v-btn>
          <v-btn color="primary" @click="saveEndDate">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Recurrence end-date picker dialog -->
    <v-dialog v-model="modalRecurrenceEndDate" width="auto">
      <v-card>
        <v-date-picker v-model="recurrenceEndDate" scrollable landscape :locale="$i18n.locale"></v-date-picker>
        <v-card-actions>
          <v-btn color="primary" @click="modalRecurrenceEndDate = false">{{ $t("Cancel") }}</v-btn>
          <v-btn color="primary" @click="modalRecurrenceEndDate = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </div>
</template>

<script setup lang="ts">
import { useMessageBox } from '@/composables/useMessageBox';
import CenterList from "@/dialogs/CenterList.vue";
import MeditationList from "@/dialogs/MeditationList.vue";
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import SearchAttendees from '@/dialogs/SearchAttendees.vue';
import SearchHealers from '@/dialogs/SearchHealers.vue';
import SicknessNatureList from "@/dialogs/SicknessNatureList.vue";
import Person from '@/interfaces/Person';
import Schedule from '@/interfaces/Schedule';
import Healer from '@/models/Healer';
import Meditation from '@/models/Meditation';
import SchedulerService from '@/services/SchedulerService';
import { useAppStore } from '@/stores/app';
import { useEventsPopUpStore } from "@/stores/eventsPopUp";
import { useUserStore } from '@/stores/user';
import { dateFormater } from "@/utilities/dateTime";
import { format, isAfter, isValid, parse } from 'date-fns';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VForm } from 'vuetify/components';
import SicknessNature from '../interfaces/SicknessNature';

defineProps<{
  show?: boolean;
}>();

const emit = defineEmits(['closeEventPopUp', 'update:show']);

const { t } = useI18n();
const appStore = useAppStore();
const eventsPopUpStore = useEventsPopUpStore();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const activeTab = ref(0);

const titleRules = [(value: string) => (!!value && value.length > 0) || t('Field_Required')];
const modalStartDate = ref(false);
const modalEndDate = ref(false);
const modalRecurrenceEndDate = ref(false);
const showMeditationList = ref(true);
const showSicknessNatureList = ref(true);
const startDate = ref<Date | string>(''); // Vuetify v-date-picker returns Date objects
const startTime = ref('');
const endDate = ref<Date | string>('');   // Vuetify v-date-picker returns Date objects
const endTime = ref('');
const free = ref(false);

/** Normalize a Date | string value to a 'yyyy-MM-dd' string, or '' if empty */
function toDateString(val: Date | string): string {
  if (!val) return '';
  if (val instanceof Date) return isValid(val) ? format(val, 'yyyy-MM-dd') : '';
  return val;
}

// Recurrence state
const enableRecurrence = ref(false);
const recurrenceType = ref('weekly');
const recurrenceInterval = ref(4);
const recurrenceEndDate = ref<Date | string>(''); // Date object from v-date-picker or '' when cleared

const recurrenceTypeItems = computed(() => [
  { value: 'daily',    label: t('Recurrence_Daily') },
  { value: 'weekly',   label: t('Recurrence_Weekly') },
  { value: 'biweekly', label: t('Recurrence_Biweekly') },
  { value: 'monthly',  label: t('Recurrence_Monthly') },
]);

const recurrenceEndDateDisplay = computed(() => {
  const str = toDateString(recurrenceEndDate.value);
  if (!str) return '';
  const d = parse(str, 'yyyy-MM-dd', new Date());
  return isValid(d) ? format(d, 'dd-MM-yyyy') : '';
});

const recurrenceSummary = computed(() => {
  if (!enableRecurrence.value || !startDateTime.value) return '';
  const typeLabel = recurrenceTypeItems.value.find(i => i.value === recurrenceType.value)?.label ?? recurrenceType.value;
  return t('Recurrence_summary', {
    n: recurrenceInterval.value,
    type: typeLabel,
    date: startDateTime.value,
  });
});

const schedule = ref<Schedule>({
  id: undefined,
  sicknessNatures: [] as SicknessNature[],
  attendees: [] as Person[],
  meditations: [] as Meditation[],
  centerID: undefined,
  center: undefined,
  calendarID: "1",
  title: '',
  category: 'time',
  dueDateClass: '',
  start: '',
  end: '',
  isAllDay: false,
  busy: false,
  isLocal: false,
  color: "white",
  bgColor: "blue",
  location: '',
});

const form = ref<VForm | null>(null);

const startDateTime = computed(() => {
  const startDateStr = toDateString(startDate.value);
  if (!startDateStr || !startTime.value) {
    if (schedule.value.start) {
      return format(new Date(schedule.value.start), 'dd-MM-yyyy HH:mm');
    } else {
      return '';
    }
  } else {
    const datePart = parse(startDateStr, 'yyyy-MM-dd', new Date());
    const [hours, minutes] = startTime.value.split(':').map(Number);
    datePart.setHours(hours);
    datePart.setMinutes(minutes);
    return format(datePart, 'dd-MM-yyyy HH:mm');
  }
});

const endDateTime = computed(() => {
  const endDateStr = toDateString(endDate.value);
  if (!endDateStr || !endTime.value) {
    if (schedule.value.end) {
      return format(new Date(schedule.value.end), 'dd-MM-yyyy HH:mm');
    } else {
      return '';
    }
  } else {
    const datePart = parse(endDateStr, 'yyyy-MM-dd', new Date());
    const [hours, minutes] = endTime.value.split(':').map(Number);
    datePart.setHours(hours);
    datePart.setMinutes(minutes);
    return format(datePart, 'dd-MM-yyyy HH:mm');
  }
});

const isFormValid = async (): Promise<boolean> => {
  const validationResult = await form.value?.validate();
  if (validationResult && !validationResult.valid) {
    showMsgBox(t("Warning"), "Form has missing or invalid items");
    return false;
  }
  let centerID = eventsPopUpStore.getCenter?.id;
  if (centerID == undefined) {
    if (schedule.value.isLocal) {
      showMsgBox(t("Warning"), t("Center_not_empty"));
      return false;
    }
    schedule.value.centerID = undefined;
  } else {
    schedule.value.centerID = centerID;
  }
  const start = parse(startDateTime.value, 'dd-MM-yyyy HH:mm', new Date());
  const end = parse(endDateTime.value, 'dd-MM-yyyy HH:mm', new Date());
  if (isAfter(start, end)) {
    showMsgBox(t("Warning"), t("Enddate_after_Startdate"));
    return false;
  }
  if (schedule.value.title == undefined || schedule.value.title.trim() == "") {
    showMsgBox(t("Warning"), t("Event_Title_can_not_be_empty"));
    return false;
  }
  if (!eventsPopUpStore.getIsAllHealersAvailable && (schedule.value.healers == undefined || schedule.value.healers.length == 0)) {
    showMsgBox(t("Warning"), t("No_healer_selected"));
    return false;
  }
  if (schedule.value.attendees == undefined || schedule.value.attendees.length == 0 || schedule.value.attendees[0].id == undefined) {
    showMsgBox(t("Warning"), t("No_participant_selected"));
    return false;
  }
  // Validate recurrence interval
  if (enableRecurrence.value) {
    if (recurrenceInterval.value < 2 || recurrenceInterval.value > 52) {
      showMsgBox(t("Warning"), t("Recurrence_interval_hint"));
      return false;
    }
  }
  return true;
};

const buildSchedulePayload = (): Schedule => {
  const payload: Schedule = { ...schedule.value };
  payload.start = dateFormater(startDateTime.value, 'DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ');
  payload.end = dateFormater(endDateTime.value, 'DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ');
  payload.calendarID = "1";
  payload.meditations = (eventsPopUpStore.meditations || []).filter(m => typeof m === 'object' && m !== null);
  payload.sicknessNatures = attendees.value.length > 1 ? undefined : eventsPopUpStore.eventSicknessNatures;

  if (enableRecurrence.value) {
    payload.recurrenceType = recurrenceType.value;
    payload.recurrenceInterval = recurrenceInterval.value;
    const recEndStr = toDateString(recurrenceEndDate.value);
    if (recEndStr) {
      payload.recurrenceEndDate = dateFormater(recEndStr, 'yyyy-MM-dd', 'YYYY-MM-DDTHH:mm:ssZ');
    }
  }
  return payload;
};

const saveSchedule = async () => {
  schedule.value.healers = eventsPopUpStore.getHealers;

  if (!await isFormValid()) {
    return;
  }

  const payload = buildSchedulePayload();

  try {
    if (enableRecurrence.value && !schedule.value.id) {
      // Create recurring sessions
      const result = await SchedulerService.createRecurringSchedule(payload);
      showMsgBox(t("Success"), t("Recurrence_created", { n: result.created }));
    } else if (schedule.value.id) {
      await SchedulerService.updateSchedule(payload);
    } else {
      await SchedulerService.createSchedule(payload);
    }
    appStore.setScheduleListNeedsUpdate(true);
  } catch (error: unknown) {
    showMsgBox("Error", error instanceof Error ? error.message : String(error));
  }
  closeMe();
};

const closeMe = () => {
  resetData();
  emit("closeEventPopUp");
};

const resetData = () => {
  startDate.value = "";
  startTime.value = "";
  endDate.value = "";
  endTime.value = "";
  free.value = false;
  enableRecurrence.value = false;
  recurrenceType.value = 'weekly';
  recurrenceInterval.value = 4;
  recurrenceEndDate.value = '';
  eventsPopUpStore.clearActiveSchedule();
  eventsPopUpStore.clearHealers();
  eventsPopUpStore.setIsAllHealersAvailable(true);
  eventsPopUpStore.clearAttendees();
  eventsPopUpStore.clearMeditations();
  eventsPopUpStore.clearCenter();
  eventsPopUpStore.clearEventSicknessNatures();

  schedule.value.id = undefined;
  schedule.value.attendees = [] as Person[];
  schedule.value.calendarID = "1";
  schedule.value.title = "";
  schedule.value.category = 'time';
  schedule.value.dueDateClass = "";
  schedule.value.start = "";
  schedule.value.end = "";
  schedule.value.isAllDay = false;
  schedule.value.busy = false;
  schedule.value.isLocal = false;
  schedule.value.healers = [] as Healer[];
  schedule.value.color = "white";
  schedule.value.bgColor = "blue";
  schedule.value.recurrenceType = undefined;
  schedule.value.recurrenceInterval = undefined;
  schedule.value.recurrenceEndDate = undefined;
};

const copySchedule = async () => {
  if (!await isFormValid()) {
    return;
  }
  appStore.copyScheduleToClipBoard();
};

const pasteSchedule = () => {
  eventsPopUpStore.pasteScheduleClipBoard();
};

const saveEndDate = () => {
  modalEndDate.value = false;
};

const attendees = computed(() => eventsPopUpStore.getAttendees);
const healers = computed(() => eventsPopUpStore.getHealers);
const activeScheduleStore = computed(() => eventsPopUpStore.getActiveSchedule);

watch(activeScheduleStore, (newSchedule) => {
  if (!newSchedule) return;

  schedule.value.id = newSchedule.id;
  schedule.value.title = newSchedule.title;
  schedule.value.centerID = newSchedule.centerID;
  schedule.value.start = newSchedule.start;
  schedule.value.end = newSchedule.end;
  schedule.value.isLocal = newSchedule.isLocal;

  // Handle start date/time
  let valStart = newSchedule.start;
  if (valStart) {
    const startParsed = parse(valStart, 'yyyy-MM-dd HH:mm', new Date());
    if (isValid(startParsed)) {
      startDate.value = format(startParsed, 'yyyy-MM-dd');
      startTime.value = format(startParsed, 'HH:mm');
    }
  }

  // Handle end date/time
  let valEnd = newSchedule.end;
  if (valEnd) {
    const endParsed = parse(valEnd, 'yyyy-MM-dd HH:mm', new Date());
    if (isValid(endParsed)) {
      endDate.value = format(endParsed, 'yyyy-MM-dd');
      endTime.value = format(endParsed, 'HH:mm');
    }
  }

  if (newSchedule.healers && newSchedule.healers.length > 0) {
    eventsPopUpStore.setHealers(newSchedule.healers);
    eventsPopUpStore.setIsAllHealersAvailable(false);
  } else {
    eventsPopUpStore.setIsAllHealersAvailable(true);
    eventsPopUpStore.clearHealers();
  }
  schedule.value.attendees = Array.from(attendees.value);
}, { deep: true, immediate: true });

watch(attendees, () => {
  schedule.value.attendees = attendees.value;
});

watch(healers, (newHealers) => {
  schedule.value.healers = newHealers;
});

const updateSelectedCenter = () => {
  appStore.setIsLocal(schedule.value.isLocal);
};

const updateTitleInStore = () => {
  appStore.setTitle(schedule.value.title);
};

onMounted(() => {
  // Any mounted logic if needed
});
</script>

<style scoped>
.vcardClass {
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.v-dialog {
  width: unset;
  box-shadow: none !important;
}
</style>
