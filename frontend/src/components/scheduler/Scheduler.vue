<template>
  <div class="d-flex flex-column fill-height">
    <!-- Quick Details Popup Dialog -->
    <v-dialog
      v-model="showMyDetailsPopup"
      max-width="450"
    >
      <v-card v-if="activeSchedule" elevation="10">
        <v-toolbar color="primary" density="compact">
          <v-toolbar-title class="text-white font-weight-bold">
            {{ activeSchedule.title || 'Event Details' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon size="small" @click="showMyDetailsPopup = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-list density="compact">
          <v-list-item v-if="activeSchedule.start">
            <template v-slot:prepend>
              <v-icon color="primary">mdi-alarm</v-icon>
            </template>
            <v-list-item-title>
              {{ getDetailsPopUpTime() }}
            </v-list-item-title>
          </v-list-item>
          
          <v-list-item>
            <template v-slot:prepend>
              <v-icon color="primary">mdi-map-marker-radius</v-icon>
            </template>
            <v-radio-group color="primary" :model-value="activeSchedule.isLocal" row mandatory readonly hide-details density="compact">
              <v-radio :label="$t('Local')" :value="true"></v-radio>
              <v-radio :label="$t('Remote')" :value="false"></v-radio>
            </v-radio-group>
          </v-list-item>

          <v-list-item v-if="activeSchedule.isLocal && activeSchedule.center">
            <template v-slot:prepend>
              <v-icon color="primary">mdi-map-marker</v-icon>
            </template>
            <v-list-item-title>
              {{ activeSchedule.center.name }}
            </v-list-item-title>
          </v-list-item>

          <v-list-item v-if="clickedScheduleHealers && clickedScheduleHealers.length">
            <template v-slot:prepend>
              <v-icon color="primary">mdi-account-tie</v-icon>
            </template>
            <v-list-item-title>
              <div class="d-flex flex-wrap gap-1">
                <v-chip v-for="(healer, index) in clickedScheduleHealers" :key="index" color="purple" text-color="white" size="small" class="mr-1 mb-1">
                  {{ (healer.firstName || healer.person?.firstName) + " " + (healer.lastName || healer.person?.lastName) }}
                </v-chip>
              </div>
            </v-list-item-title>
          </v-list-item>
        </v-list>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-3 max-height-400 overflow-y-auto">
          <div v-if="currentAttendees && currentAttendees.length" class="mb-3">
            <div class="d-flex align-center mb-1">
              <v-icon start size="small" color="primary">mdi-account-multiple</v-icon>
              <span class="text-subtitle-2 font-weight-bold ml-2">Attendees</span>
            </div>
            <div class="d-flex flex-wrap gap-1">
              <v-chip v-for="(person, i) in currentAttendees" :key="i" color="green" text-color="white" size="x-small" class="ma-1">
                {{ person.firstName + " " + person.lastName }}
              </v-chip>
            </div>
          </div>
          
          <div v-if="currentSicknessNatures && currentSicknessNatures.length" class="mb-3">
            <div class="d-flex align-center mb-1">
              <v-icon start size="small" color="primary">mdi-heart-pulse</v-icon>
              <span class="text-subtitle-2 font-weight-bold ml-2">Sickness Nature</span>
            </div>
            <div class="d-flex flex-wrap gap-1">
              <v-chip v-for="(sicknessNature, i) in currentSicknessNatures" :key="i" color="purple" text-color="white" size="x-small" class="ma-1">
                {{ sicknessNature.description }}
              </v-chip>
            </div>
          </div>
          
          <div v-if="currentMeditations && currentMeditations.length">
            <div class="d-flex align-center mb-1">
              <v-icon start size="small" color="primary">mdi-meditation</v-icon>
              <span class="text-subtitle-2 font-weight-bold ml-2">Meditations</span>
            </div>
            <div class="d-flex flex-wrap gap-1">
              <v-chip v-for="(meditation, i) in currentMeditations" :key="i" color="indigo" text-color="white" size="x-small" class="ma-1">
                {{ meditation.name }}
              </v-chip>
            </div>
          </div>

          <div v-if="(!currentAttendees || !currentAttendees.length) && (!currentSicknessNatures || !currentSicknessNatures.length) && (!currentMeditations || !currentMeditations.length)" class="text-center text-grey italic py-4">
            No detailed information available for this event.
          </div>
        </v-card-text>

        <v-divider></v-divider>
        
        <v-card-actions class="justify-space-around bg-grey-lighten-4 pa-2">
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon variant="text" color="success" size="small" @click="editSchedule">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>{{ $t("edit") }}</span>
          </v-tooltip>
          
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon variant="text" color="error" size="small" @click="confirmDeleteEvent(activeSchedule)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
            <span>{{ $t("delete") }}</span>
          </v-tooltip>

          <v-btn color="grey-darken-1" variant="text" size="small" @click="showMyDetailsPopup = false">
            {{ $t("close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div id="menu">
      <v-toolbar>
        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" color="primary" rounded>
              <h4>{{ $t("CalendarOptions") }}</h4>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="vuecal.view.switch('day')">
              <template v-slot:prepend>
                <v-icon>mdi-view-day</v-icon>
              </template>
              <v-list-item-title>{{ $t("Day") }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="vuecal.view.switch('week')">
              <template v-slot:prepend>
                <v-icon>mdi-view-week</v-icon>
              </template>
              <v-list-item-title>{{ $t("Week") }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="vuecal.view.switch('month')">
              <template v-slot:prepend>
                <v-icon>mdi-view-module</v-icon>
              </template>
              <v-list-item-title>{{ $t("Month") }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <span id="menu-navi">
          <v-btn text icon @click="today">
            <v-icon color="primary">mdi-home</v-icon>
          </v-btn>
          <v-btn text icon @click="previous">
            <v-icon size="large" color="primary">mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn text icon @click="next">
            <v-icon size="large" color="primary">mdi-chevron-right</v-icon>
          </v-btn>
        </span>
        <span class="text-lg-center">
          <v-chip>{{ viewTitle }}</v-chip>
        </span>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" color="primary" @click="modal = true" class="mx-3">mdi-calendar</v-icon>
          </template>
          <span>{{ $t("Go_specific_date") }}</span>
        </v-tooltip>
        <v-dialog v-model="modal" persistent width="290px">
          <v-date-picker v-model="picker" :locale="$i18n.locale" week-start="1">
            <template v-slot:actions>
              <v-btn color="primary" @click="modal = false">Cancel</v-btn>
              <v-btn color="primary" @click="moveToDate(picker)">OK</v-btn>
            </template>
          </v-date-picker>
        </v-dialog>
        <v-spacer></v-spacer>
        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" 
               :class="`dayColorClass day-color-${dayColor}`" 
               rounded elevation="5">
              <h4>{{ $t("dayColor") }}</h4>
            </v-btn>
          </template>
          <v-list color="grey-lighten-3">
            <v-list-item>
              <v-btn block color="blue">
                <h4>{{ $t("weekDays.Monday") }}</h4>
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn block color="red">
                <h4>{{ $t("weekDays.Tuesday") }}</h4>
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn block color="white">
                <h4>{{ $t("weekDays.Wednesday") }}</h4>
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn block color="black">
                <h4>{{ $t("weekDays.Thursday") }}</h4>
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn block color="yellow">
                <h4>{{ $t("weekDays.Friday") }}</h4>
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn block color="purple">
                <h4>{{ $t("weekDays.Saturday") }}</h4>
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn block color="green">
                <h4>{{ $t("weekDays.Sunday") }}</h4>
              </v-btn>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar>
    </div>
    <vue-cal
      class="flex-grow-1"
      ref="vuecal"
      :events="scheduleList"
      :time-step="30"
      :today-button="false"
      :views-bar="false"
      :title-bar="false" 
      :views="['day', 'week','month']"
      :events-on-month-view="true"
      :editableEvents="{ drag: true, resize: true, delete: false, create: true }"
      :resize-x="false"
      :resize-y="true"
      @cell-click="onCellClick"
      @event-click="onEventClick"
      @event-dropped="onEventDragDrop"
      @event-resize-end="onEventDurationChange"
      :active-view="activeView"
      :selected-date="selectedDate"
      @view-change="onViewChange"
      @ready="onViewChange"
      :locale="locale=='en'?'en-us':locale"
    >
      <template #event="{ event }">
        <div class="vuecal__event-title" @contextmenu.prevent.stop="showContextMenu($event, event)">
          {{ event.title }}
          <v-btn 
            @click.prevent.stop="confirmDeleteEvent(event)" 
            class="event-delete-btn"
            size="x-small"
            icon
            variant="text"
          >
            <v-icon size="12">mdi-close</v-icon>
          </v-btn>
        </div>
      </template>
    </vue-cal>
    <CreateEditEventPopup :show="showEventPopup" @closeEventPopUp="closeEventPopUp" />
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <!-- Context Menu -->
    <!-- <div 
      v-if="contextMenu.show" 
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <v-card>
        <v-list>
          <v-list-item @click="editEvent">
            <template v-slot:prepend>
              <v-icon>mdi-pencil</v-icon>
            </template>
            <v-list-item-title>Edit</v-list-item-title>
          </v-list-item>
          <v-list-item @click="confirmDeleteEvent">
            <template v-slot:prepend>
              <v-icon>mdi-delete</v-icon>
            </template>
            <v-list-item-title>Delete</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </div> -->
    
    <!-- Overlay to close context menu -->
    <div v-if="contextMenu.show" class="context-menu-overlay" @click="contextMenu.show = false"></div>
  </div>
</template>

<script setup lang="ts">
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useMessageBox } from '@/composables/useMessageBox';
import ConfirmDialog from "@/dialogs/ConfirmDialog.vue";
import CreateEditEventPopup from "@/dialogs/CreateEditEventPopup.vue";
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import Schedule from '@/interfaces/Schedule';
import HealerService from '@/services/HealerService';
import SchedulerService from '@/services/SchedulerService';
import { useAppStore } from '@/stores/app';
import { useEventsPopUpStore } from "@/stores/eventsPopUp";
import { useUserStore } from '@/stores/user';
import { format, addDays, addWeeks, addMonths, addYears, subWeeks, subDays, subMonths, subYears, addMinutes, setHours, setMinutes, startOfISOWeek, endOfISOWeek, getISODay, parse, isValid } from 'date-fns';
import { computed, onMounted, ref, watch } from 'vue';
import { VueCal } from 'vue-cal';
import 'vue-cal/style';

// Vue-cal click data interface
interface VueCalClickData {
  cursor?: {
    date: string | Date;
  };
  cell?: {
    start: string | Date;
  };
}

const vuecal = ref<InstanceType<typeof VueCal> | null>(null);

// Pinia Stores
const appStore = useAppStore();
const eventsPopUpStore = useEventsPopUpStore();
const userStore = useUserStore();

// Composables
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();
const { confirmDialogContents, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();

// Reactive State
const activeSchedule = ref<Schedule | null>(null);
const scheduleList = ref<Schedule[]>([]);
const showEventPopup = ref(false);
const loading = ref(false);

const activeView = ref('week');
const viewTitle = ref('');
const modal = ref(false);
const picker = ref(new Date());
const selectedDate = ref(new Date());

// Quick Details Popup State
const showMyDetailsPopup = ref(false);

// Flag to prevent accidental clicks during drag/resize
const isActionOngoing = ref(false);

// Computed derived from store to ensure reactivity
const clickedScheduleHealers = computed(() => eventsPopUpStore.healers);
const currentAttendees = computed(() => eventsPopUpStore.attendees);
const currentMeditations = computed(() => eventsPopUpStore.meditations);
const currentSicknessNatures = computed(() => eventsPopUpStore.eventSicknessNatures);

const dayColor = computed(() => {
  const today = getISODay(new Date()); // 1=Monday, 2=Tuesday, ..., 7=Sunday
  console.log('DEBUG: Scheduler.vue - isoWeekday:', today);
  let color = 'blue';
  switch (today) {
    case 1: color = 'blue'; break;
    case 2: color = 'red'; break;
    case 3: color = 'white'; break;
    case 4: color = 'black'; break;
    case 5: color = 'yellow'; break;
    case 6: color = 'purple'; break;
    case 7: color = 'green'; break;
    default: color = 'blue';
  }
  console.log('DEBUG: Scheduler.vue - assigned color:', color);
  return color;
});

const contextMenu = ref({ show: false, x: 0, y: 0, event: null as Schedule | null });

// Methods

const getDetailsPopUpTime = (): string => {
  if (!activeSchedule.value || !activeSchedule.value.start) {
    return ""
  }
  let res: string = ""
  const start = activeSchedule.value.start;
  const end = activeSchedule.value.end;
  
  let startDateStr = format(new Date(start), 'dd-MM-yyyy');
  let endDateStr = format(new Date(end), 'dd-MM-yyyy');
  let startTimeStr = format(new Date(start), 'HH:mm');
  let endTimeStr = format(new Date(end), 'HH:mm');
  
  if (startDateStr == endDateStr) {
    res = startDateStr + " " + startTimeStr + " - " + endTimeStr;
  } else {
    res = startDateStr + " " + startTimeStr + " " + endDateStr + " " + endTimeStr;
  }
  return res
}

const editSchedule = () => {
  showMyDetailsPopup.value = false;
  showEventPopup.value = true;
}

const updateViewTitle = () => {
  try {
    if (!vuecal.value || !vuecal.value.view) {
      // Fallback when vuecal is not ready
      if (activeView.value === 'month') {
        viewTitle.value = format(selectedDate.value, 'MMMM yyyy');
      } else if (activeView.value === 'week') {
        const weekStart = startOfISOWeek(selectedDate.value);
        const weekEnd = endOfISOWeek(selectedDate.value);
        viewTitle.value = `${format(weekStart, 'dd-MM-yyyy')} - ${format(weekEnd, 'dd-MM-yyyy')}`;
      } else if (activeView.value === 'day') {
        viewTitle.value = format(selectedDate.value, 'dd MMMM yyyy');
      }
      return;
    }

    const view = vuecal.value.view;
    if (activeView.value === 'month') {
      viewTitle.value = format(new Date(view.start), 'MMMM yyyy');
    } else if (activeView.value === 'week') {
      viewTitle.value = `${format(new Date(view.start), 'dd-MM-yyyy')} - ${format(new Date(view.end), 'dd-MM-yyyy')}`;
    } else if (activeView.value === 'day') {
      viewTitle.value = format(new Date(view.start), 'dd MMMM yyyy');
    }
  } catch (error) {
    console.error('Error updating view title:', error instanceof Error ? error.message : 'Unknown error');
    viewTitle.value = format(selectedDate.value, 'dd-MM-yyyy');
  }
};

const onViewChange = () => {
  setTimeout(() => updateViewTitle(), 50);
};

const moveToDate = (date: Date) => {
  const specifiedDate = new Date(date);
  selectedDate.value = specifiedDate;
  if (vuecal.value) {
    vuecal.value.view.updateSelectedDate(specifiedDate);
    vuecal.value.view.updateViewDate(specifiedDate);
  }
  modal.value = false;
  setTimeout(() => updateViewTitle(), 50);
};

const previous = () => {
  if (activeView.value === 'month') {
    selectedDate.value = subMonths(selectedDate.value, 1);
  } else if (activeView.value === 'week') {
    selectedDate.value = subWeeks(selectedDate.value, 1);
  } else if (activeView.value === 'day') {
    selectedDate.value = subDays(selectedDate.value, 1);
  }
  if (vuecal.value) vuecal.value.view.previous();
  setTimeout(() => updateViewTitle(), 50);
};

const next = () => {
  if (activeView.value === 'month') {
    selectedDate.value = addMonths(selectedDate.value, 1);
  } else if (activeView.value === 'week') {
    selectedDate.value = addWeeks(selectedDate.value, 1);
  } else if (activeView.value === 'day') {
    selectedDate.value = addDays(selectedDate.value, 1);
  }
  if (vuecal.value) vuecal.value.view.next();
  setTimeout(() => updateViewTitle(), 50);
};

const today = () => {
  selectedDate.value = new Date();
  if (vuecal.value) vuecal.value.view.goToToday();
  setTimeout(() => updateViewTitle(), 50);
};

// Computed Properties
const scheduleListNeedsUpdate = computed({
  get: () => appStore.scheduleListNeedsUpdate,
  set: (value: boolean) => appStore.setScheduleListNeedsUpdate(value),
});

const locale = computed(() => {
  return appStore.locale;
});

// Methods
const onCellClick = (clickData: VueCalClickData | string | Date | null) => {
  if (isActionOngoing.value) return;

  eventsPopUpStore.clearHealers();
  eventsPopUpStore.clearCenter();
  eventsPopUpStore.clearActiveSchedule();

  const freshSchedule = {
    id: undefined,
    calendarID: "1",
    title: "",
    start: "",
    end: "",
    isLocal: false,
    attendees: [],
    meditations: [],
    sicknessNatures: []
  } as unknown as Schedule;

  let startDate: Date;

  // Handle vue-cal's click data format
  if (clickData && typeof clickData === 'object' && !(clickData instanceof Date)) {
    const vueCalData = clickData as VueCalClickData;
    if (vueCalData.cursor && vueCalData.cursor.date) {
      startDate = new Date(vueCalData.cursor.date);
    } else if (vueCalData.cell && vueCalData.cell.start) {
      startDate = setHours(setMinutes(new Date(vueCalData.cell.start), 0), 9);
    } else {
      startDate = new Date();
    }
  } else if (typeof clickData === 'string') {
    const parsed = parse(clickData, 'yyyy-MM-dd', new Date());
    startDate = isValid(parsed) ? setHours(setMinutes(parsed, 0), 9) : new Date();
  } else if (clickData instanceof Date) {
    startDate = clickData;
  } else {
    startDate = new Date();
  }

  freshSchedule.start = format(startDate, 'yyyy-MM-dd HH:mm');
  freshSchedule.end = format(addMinutes(startDate, 30), 'yyyy-MM-dd HH:mm');

  activeSchedule.value = freshSchedule;
  eventsPopUpStore.setActiveSchedule(freshSchedule);
  showEventPopup.value = true;
};

const onEventClick = async (eventHolder: { e: Event, event: Schedule }) => {
  if (isActionOngoing.value) return;

  const e: Event = eventHolder.e;
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  // Clear previous data in store
  eventsPopUpStore.clearHealers();
  eventsPopUpStore.clearAttendees();
  eventsPopUpStore.clearMeditations();
  eventsPopUpStore.clearEventSicknessNatures();
  eventsPopUpStore.clearCenter();

  // Get the clicked event (handle vue-cal wrapping)
  const clickedEvent = eventHolder.event;
  const eventId = clickedEvent.id;
  
  // CRITICAL: Find the full event object from our loaded list
  // vue-cal often strips properties it doesn't recognize
  const originalEvent = scheduleList.value.find(s => String(s.id) === String(eventId)) || clickedEvent;
  
  // Clone to avoid direct mutations
  const eventData = JSON.parse(JSON.stringify(originalEvent));
  activeSchedule.value = eventData;
  
  // Sync to store
  eventsPopUpStore.setActiveSchedule(eventData);
  if (eventData.attendees) eventsPopUpStore.setAttendees(eventData.attendees);
  if (eventData.meditations) eventsPopUpStore.setMeditations(eventData.meditations);
  if (eventData.sicknessNatures) eventsPopUpStore.setEventSicknessNatures(eventData.sicknessNatures);
  if (eventData.center) eventsPopUpStore.setCenter(eventData.center);
  
  // Set Healers
  if (eventData.healers && eventData.healers.length > 0) {
    eventsPopUpStore.setHealers(eventData.healers);
  } else if (eventData.healerID && userStore.superUser) {
    // Fallback for old single healer events
    try {
      const healer = await HealerService.getHealer(eventData.healerID);
      eventsPopUpStore.setHealers([healer]);
    } catch (error) {
      console.error('Error fetching healer:', error);
    }
  } else {
    // If no healers assigned, it might mean "All Healers" (depending on business logic)
    // For now, just clear
    eventsPopUpStore.clearHealers();
  }
  showMyDetailsPopup.value = true;  
};

const onEventDragDrop = async (data: any) => {
  const { event, e } = data;
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  
  isActionOngoing.value = true;
  try {
    loading.value = true;
    
    // Find original event in our list to ensure we have all properties
    const originalEvent = scheduleList.value.find(s => String(s.id) === String(event.id));
    if (!originalEvent) return;

    const updatedEvent = { ...originalEvent };
    
    // In VueCal v5, event.start and event.end are already updated Date objects
    updatedEvent.start = new Date(event.start).toISOString();
    updatedEvent.end = new Date(event.end).toISOString();
    
    await SchedulerService.updateSchedule(updatedEvent);
    scheduleListNeedsUpdate.value = true;
  } catch (error) {
    showMsgBox('Error', (error as Error).message);
  } finally {
    loading.value = false;
    // Delay resetting the flag to swallow any trailing click events
    setTimeout(() => {
      isActionOngoing.value = false;
    }, 100);
  }
};

const onEventDurationChange = async (data: any) => {
  const { event, e } = data;
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  
  isActionOngoing.value = true;
  try {
    loading.value = true;

    // Find original event in our list
    const originalEvent = scheduleList.value.find(s => String(s.id) === String(event.id));
    if (!originalEvent) return;

    const updatedEvent = { ...originalEvent };
    
    // Update with new times from VueCal
    updatedEvent.start = new Date(event.start).toISOString();
    updatedEvent.end = new Date(event.end).toISOString();
    
    await SchedulerService.updateSchedule(updatedEvent);
    scheduleListNeedsUpdate.value = true;
  } catch (error) {
    showMsgBox('Error', (error as Error).message);
  } finally {
    loading.value = false;
    // Delay resetting the flag to swallow any trailing click events
    setTimeout(() => {
      isActionOngoing.value = false;
    }, 100);
  }
};

const showContextMenu = (mouseEvent: MouseEvent, event: Schedule) => {
  contextMenu.value = {
    show: true,
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
    event: event
  };
};

// const editEvent = (event: Schedule | null) => {
//   if (event) {
//     contextMenu.value.show = false;
//     onEventClick(event, new MouseEvent('click'));
//   }
// };

const confirmDeleteEvent = (event: Schedule) => {
  contextMenu.value.show = false;
  showConfirmDialog(
    'Confirm Delete',
    `Are you sure you want to delete "${event.title || 'this event'}"?`,
    () => onEventDelete(event),
    null
  );
};

const onEventDelete = async (event: Schedule) => {
  closeConfirmDialog();
  try {
    loading.value = true;
    if (userStore.superUser && event.id) {
      await SchedulerService.deleteSchedule(event.id);
      showMyDetailsPopup.value = false;
      scheduleListNeedsUpdate.value = true;
    }
  } catch (error) {
    showMsgBox('Error', (error as Error).message);
  } finally {
    loading.value = false;
  }
};

const updateScheduleList = async () => {
  loading.value = true;
  try {
    if (userStore.superUser) {
        const schedules: Schedule[] = await SchedulerService.getSchedulesByRange(format(subYears(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ssxxx"), format(addYears(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ssxxx"), locale.value);
        scheduleList.value = [...schedules.map(s => ({
          ...s,
          start: format(new Date(s.start), 'yyyy-MM-dd HH:mm'),
          end: format(new Date(s.end), 'yyyy-MM-dd HH:mm'),
          title: s.title || 'Event',
          content: s.title || 'Event',
          class: 'leisure',
          deletable: true,
          resizable: true,
        }))];
    }
  } catch (error: unknown) {
    showMsgBox("Error", (error as Error).message);
  } finally {
    loading.value = false;
  }
};

const closeEventPopUp = () => {
  eventsPopUpStore.clearHealers();
  eventsPopUpStore.clearAttendees();
  eventsPopUpStore.clearMeditations();
  eventsPopUpStore.clearEventSicknessNatures();
  eventsPopUpStore.clearCenter();
  eventsPopUpStore.clearActiveSchedule();
  showEventPopup.value = false;
};

// Lifecycle Hooks
onMounted(async () => {
  console.log('DEBUG: Scheduler.vue mounted. Current dayColor:', dayColor.value);
  if (userStore.superUser && userStore.superUser.id !== -1) {
    await updateScheduleList();
  }
  setTimeout(() => updateViewTitle(), 100);
});

// Watchers
watch(selectedDate, () => {
  setTimeout(() => updateViewTitle(), 50);
});

watch(activeView, () => {
  setTimeout(() => updateViewTitle(), 50);
});

watch(scheduleListNeedsUpdate, async (needsUpdate) => {
  if (needsUpdate) {
    await updateScheduleList();
    scheduleListNeedsUpdate.value = false;
  }
});

watch(() => userStore.superUser, (newUser) => {
  if (newUser && newUser.id !== -1) {
    updateScheduleList();
  }
}, { deep: true });

</script>

<style>
.vuecal--default-theme {
  height: 100%;
}

.calendar-container {
  height: 100%;
}

.fill-height {
  height: calc(100vh - 120px);
}

.dayColorClass {
  margin-left: 10px;
  right: 0;
  border: 3px solid #000 !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
  min-width: 120px;
}

/* Day color classes */
.day-color-blue {
  background-color: blue !important;
  color: white !important;
}

.day-color-red {
  background-color: red !important;
  color: white !important;
}

.day-color-white {
  background-color: white !important;
  color: black !important;
}

.day-color-black {
  background-color: black !important;
  color: white !important;
}

.day-color-yellow {
  background-color: yellow !important;
  color: black !important;
  padding: 5px;
}

.day-color-purple {
  background-color: purple !important;
  color: white !important;
}

.day-color-green {
  background-color: green !important;
  color: white !important;
}

.event-delete-btn {
  position: absolute !important;
  top: 0px !important;
  right: 0px !important;
  background: rgba(255, 0, 0, 0.9) !important;
  color: white !important;
  min-width: 16px !important;
  width: 16px !important;
  height: 16px !important;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.vuecal__event:hover .event-delete-btn {
  opacity: 1;
}

.vuecal__event-title {
  position: relative;
  width: 100%;
  height: 100%;
  padding-right: 18px;
}

.vuecal__event.leisure {
  background-color: rgba(253, 156, 66, 0.9);
  border: 1px solid rgb(233, 136, 46);
  color: #fff;
}

/* Ensure confirm dialog appears above vue-cal */
.v-overlay {
  z-index: 9999 !important;
}

.v-dialog {
  z-index: 9999 !important;
}

.context-menu {
  position: fixed;
  z-index: 10000;
  min-width: 120px;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
}

.max-height-400 {
  max-height: 400px;
}

</style>
