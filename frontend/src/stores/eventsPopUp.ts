import Person from '@/interfaces/Person';
import Schedule from '@/interfaces/Schedule';
import SicknessNature from "@/interfaces/SicknessNature";
import Center from "@/models/Center";
import Healer from '@/models/Healer';
import Meditation from "@/models/Meditation";
import { personsHasPerson } from '@/utilities/MyUtilities';
import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';

export const useEventsPopUpStore = defineStore('eventsPopUp', () => {
  const debug = ref(import.meta.env.DEV);
  
  const activeSchedule = reactive<Schedule>({
    id: undefined,
    title: "",
    location: "",
    attendees: [] as Person[],
    meditations: [] as Meditation[],
    centerID: undefined,
    center: undefined,
    healers: [] as Healer[],
    calendarID: "1",
    start: "",
    end: "",
    isAllDay: false,
    isLocal: false,
    color: "",
    bgColor: "",
    sicknessNatures: [] as SicknessNature[],
  });
  const healers = ref<Healer[]>([]);
  const isAllHealersAvailable = ref(true);
  const attendees = ref<Person[]>([]);
  const meditations = ref<Meditation[]>([]);
  const eventSicknessNatures = ref<SicknessNature[]>([]);
  const center = ref<Center>({} as Center);
  const scheduleClipBoard = reactive<Schedule>({
    id: undefined,
    title: "",
    location: "",
    attendees: [] as Person[],
    meditations: [] as Meditation[],
    centerID: undefined,
    center: undefined,
    healers: [] as Healer[],
    calendarID: "1",
    start: "",
    end: "",
    isAllDay: false,
    isLocal: false,
    color: "",
    bgColor: "",
    sicknessNatures: [] as SicknessNature[],
  });

  // Getters
  const getHealers = computed((): Healer[] => {
    return Array.from(healers.value);
  });
  const getIsAllHealersAvailable = computed(() => isAllHealersAvailable.value);
  const getActiveSchedule = computed((): Schedule => {
    return activeSchedule;
  });
  const getScheduleClipBoard = computed((): Schedule => {
    return Object.assign({}, scheduleClipBoard);
  });
  const getAttendees = computed((): Person[] => {
    return Array.from(attendees.value);
  });
  const getMeditations = computed((): Meditation[] => {
    return Array.from(meditations.value);
  });
  const getEventSicknessNatures = computed((): SicknessNature[] => {
    return Array.from(eventSicknessNatures.value);
  });
  const getCenter = computed((): Center => {
    if (center.value != undefined) {
      return center.value;
    } else {
      return {} as Center;
    }
  });

  // Actions (Mutations from Vuex)
  const setAttendees = (newAttendees: Person[]) => {
    if (debug.value) {
      console.log('setAttendees triggered');
    }
    attendees.value = Array.from(newAttendees);
  };

  const setMeditations = (newMeditations: Meditation[]) => {
    if (debug.value) {
      console.log('setMeditations triggered');
    }
    if (newMeditations == undefined) {
      return;
    }
    meditations.value = Array.from(newMeditations);
  };

  const setEventSicknessNatures = (newEventSicknessNatures: SicknessNature[]) => {
    if (debug.value) {
      console.log('setEventSicknessNatures triggered');
    }
    if (newEventSicknessNatures == undefined) {
      return;
    }
    eventSicknessNatures.value = Array.from(newEventSicknessNatures);
  };

  const setCenter = (newCenter: Center) => {
    if (debug.value) {
      console.log('setCenter triggered');
    }
    if (newCenter == undefined) {
      return;
    }
    center.value = newCenter;
  };

  const addParticipant = (person: Person) => {
    if (debug.value) {
      console.log('addParticipant triggered');
    }
    if (person == undefined) {
      return;
    }
    const personCopy = Object.assign({}, person);
    if (!personsHasPerson(attendees.value, personCopy)) {
      attendees.value.push(personCopy);
    }
  };

  const removeParticipant = (person: Person) => {
    if (debug.value) {
      console.log('removeParticipant triggered');
    }
    if (personsHasPerson(attendees.value, person)) {
      const index: number = attendees.value.indexOf(person);
      if (index == -1) {
        throw Error("Store can't find the participant index");
      }
      attendees.value.splice(index, 1);
    }
  };

  const clearAttendees = () => {
    if (debug.value) {
      console.log('clearAttendees triggered');
    }
    attendees.value = [];
  };

  const clearMeditations = () => {
    if (debug.value) {
      console.log('clearMeditations triggered');
    }
    meditations.value = [];
  };

  const clearEventSicknessNatures = () => {
    if (debug.value) {
      console.log('clearEventSicknessNatures triggered');
    }
    eventSicknessNatures.value = [];
  };

  const clearCenter = () => {
    if (debug.value) {
      console.log('clearCenter triggered');
    }
    center.value = {} as Center;
  };

  const setActiveSchedule = (schedule: Schedule) => {
    if (debug.value) {
      console.log('setActiveSchedule triggered', JSON.stringify(schedule));
    }
    Object.assign(activeSchedule, schedule);
  };

  const setIsLocal = (isLocal: boolean) => {
    // This mutation directly modifies state.activeSchedule.isLocal
    // and also calls clearCenter if isLocal is false.
    // In Pinia, you would directly modify the ref/reactive property.
    activeSchedule.isLocal = isLocal;
    if (!isLocal) {
      clearCenter();
    }
  };

  const setTitle = (newTitle: string) => {
    activeSchedule.title = newTitle;
  };

  const copyScheduleToClipBoard = () => {
    const tmpSchedule: Schedule = Object.assign({}, activeSchedule);
    tmpSchedule.attendees = Array.from(attendees.value);
    tmpSchedule.meditations = Array.from(meditations.value);
    tmpSchedule.sicknessNatures = Array.from(eventSicknessNatures.value);
    Object.assign(scheduleClipBoard, tmpSchedule);
  };

  const pasteScheduleClipBoard = () => {
    if (debug.value) {
      console.log('pasteScheduleClipBoard triggered', JSON.stringify(scheduleClipBoard));
    }
    Object.assign(activeSchedule, scheduleClipBoard);
    if (scheduleClipBoard.healers) {
      healers.value = Array.from(scheduleClipBoard.healers);
    }
    activeSchedule.title = scheduleClipBoard.title;
    attendees.value = Array.from(scheduleClipBoard.attendees);
    meditations.value = Array.from(scheduleClipBoard.meditations);
    if (scheduleClipBoard.sicknessNatures) {
      eventSicknessNatures.value = Array.from(scheduleClipBoard.sicknessNatures);
    } else {
      eventSicknessNatures.value = [];
    }
    activeSchedule.isLocal = scheduleClipBoard.isLocal;
    if (scheduleClipBoard.center) {
      center.value = scheduleClipBoard.center;
    }
    if (scheduleClipBoard.healers) {
      healers.value = Array.from(scheduleClipBoard.healers);
    }
  };

  const clearActiveSchedule = () => {
    if (debug.value) {
      console.log('clearActiveSchedule triggered');
    }
    Object.assign(activeSchedule, {
      id: undefined,
      title: "",
      location: "",
      attendees: [] as Person[],
      meditations: [] as Meditation[],
      centerID: undefined,
      center: undefined,
      healers: [] as Healer[],
      calendarID: "1",
      start: "",
      end: "",
      isAllDay: false,
      isLocal: false,
      color: "",
      bgColor: "",
      sicknessNatures: [] as SicknessNature[],
    });
  };

const setHealers = (newHealers: Healer[]) => {
  console.log('setHealers triggered', newHealers);
  if (newHealers == undefined) {
    console.log('newHealers is undefined');
    healers.value = [] as Healer[];
  } else {
    healers.value = Array.from(newHealers);
  }
}

  const clearHealers = () => {
    if (debug.value) {
      console.log('clearHealer triggered');
    }
    healers.value = [];
  };

  const setIsAllHealersAvailable = (val: boolean) => {
    isAllHealersAvailable.value = val;
  };

  return {
    debug,
    activeSchedule,
    attendees,
    meditations,
    eventSicknessNatures,
    scheduleClipBoard,
    healers,
    isAllHealersAvailable,

    getHealers,
    getIsAllHealersAvailable,
    getActiveSchedule,
    getScheduleClipBoard,
    getAttendees,
    getMeditations,
    getEventSicknessNatures,
    getCenter,

    setAttendees,
    setMeditations,
    setEventSicknessNatures,
    setCenter,
    addParticipant,
    removeParticipant,
    clearAttendees,
    clearMeditations,
    clearEventSicknessNatures,
    clearCenter,
    setActiveSchedule,
    setIsLocal,
    setTitle,
    copyScheduleToClipBoard,
    pasteScheduleClipBoard,
    clearActiveSchedule,
    setHealers,
    clearHealers,
    setIsAllHealersAvailable,
  };
});
