import Person from "@/interfaces/Person";
import Schedule from "@/interfaces/Schedule";
import SuperUser from "@/interfaces/SuperUser";
import Treatment from "@/interfaces/Treatment";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useUserStore } from "./user";

export const useAppStore = defineStore("app", () => {
  const debug = ref(import.meta.env.DEV);
  const APP_DRAWER_TOGGLED = ref(false);
  const isDrawerVisible = ref(false);
  const isToolBarVisible = ref(false);
  const scheduleListNeedsUpdate = ref(false);
  const loading = ref(false);
  const activePerson = ref<Person | undefined>();
  const notificationList = ref<Schedule[]>([]);
  const activeTab = ref(0);
  const reportActiveTab = ref(0);
  const activeTreatment = ref<Treatment | null>(null);
  const locale = ref("en");
  const center = ref({ id: undefined });
  const scheduleClipBoard = ref<Schedule>({} as Schedule);

  // Actions (Mutations from Vuex)
  const setIsToolBarVisible = (val: boolean) => {
    if (debug.value) {
      console.log("setIsToolBarVisible triggered with ", val);
    }
    isToolBarVisible.value = val;
  };
  const setIsDrawerVisible = (visible: boolean) => {
    if (debug.value) {
      console.log("setIsDrawerVisible triggered with ", visible);
    }
    isDrawerVisible.value = visible;
  };
  const setAPP_DRAWER_TOGGLED = () => {
    if (debug.value) {
      console.log("setAPP_DRAWER_TOGGLED triggered with");
    }
    APP_DRAWER_TOGGLED.value = !APP_DRAWER_TOGGLED.value;
  };
  const setActivePerson = (newValue: Person) => {
    if (debug.value) {
      console.log("setActivePerson triggered with", newValue);
    }
    activePerson.value = newValue;
  };
  const setSuperUser = (newValue: SuperUser) => {
    if (debug.value) {
      console.log("setSuperUser triggered with", newValue);
    }
    // Delegate to useUserStore — single source of truth
    // Note: We pass the userStore instance if needed, but here we use the imported hook
    const userStore = useUserStore();
    userStore.setUser(newValue);
  };
  const clearActivePerson = () => {
    if (debug.value) {
      console.log("clearActivePerson triggered");
    }
    activePerson.value = undefined;
  };
  const setNotificationList = (newValue: Schedule[]) => {
    if (debug.value) {
      console.log("notificationList triggered with", newValue);
    }
    const sortedList = newValue.sort((a, b) => {
      const dateA = new Date(a.start).getTime();
      const dateB = new Date(b.start).getTime();
      return dateA > dateB ? 1 : dateA < dateB ? -1 : 0;
    });
    notificationList.value = sortedList;
  };
  const clearNotificationList = () => {
    if (debug.value) {
      console.log("notificationList triggered");
    }
    notificationList.value = [];
  };
  const showLoading = () => {
    loading.value = true;
  };
  const hideLoading = () => {
    loading.value = false;
  };
  const setScheduleListNeedsUpdate = (newValue: boolean) => {
    if (debug.value) {
      console.log("setScheduleListNeedsUpdate triggered with", newValue);
    }
    scheduleListNeedsUpdate.value = newValue;
  };
  const setReportActiveTab = (newValue: number) => {
    if (debug.value) {
      console.log("setReportActiveTab triggered with", newValue);
    }
    reportActiveTab.value = newValue;
  };
  const setActiveTab = (newValue: number) => {
    if (debug.value) {
      console.log("setActiveTab triggered with", newValue);
    }
    activeTab.value = newValue;
  };
  const setLocale = (newLocale: string) => {
    if (debug.value) {
      console.log("setLocale triggered with", newLocale);
    }
    locale.value = newLocale;
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setIsLocal = (_isLocal: boolean) => {
    // Implementation for setIsLocal - this might be used elsewhere
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setTitle = (_title: string) => {
    // Implementation for setTitle - this might be used elsewhere
  };
  const copyScheduleToClipBoard = () => {
    // Implementation for copyScheduleToClipBoard - this might be used elsewhere
  };

  // Getters
  const getNotificationList = computed(() => notificationList.value);
  // superUser and getSuperUser delegate to useUserStore
  const superUser = computed(() => useUserStore().superUser);
  const getSuperUser = computed(() => useUserStore().superUser);

  return {
    debug,
    APP_DRAWER_TOGGLED,
    isDrawerVisible,
    isToolBarVisible,
    scheduleListNeedsUpdate,
    loading,
    activePerson,
    superUser,
    notificationList,
    activeTab,
    reportActiveTab,
    activeTreatment,
    locale,
    center,
    scheduleClipBoard,
    setIsToolBarVisible,
    setIsDrawerVisible,
    setAPP_DRAWER_TOGGLED,
    setActivePerson,
    setSuperUser,
    clearActivePerson,
    setNotificationList,
    clearNotificationList,
    showLoading,
    hideLoading,
    setScheduleListNeedsUpdate,
    setReportActiveTab,
    setActiveTab,
    setLocale,
    setIsLocal,
    setTitle,
    copyScheduleToClipBoard,
    getNotificationList,
    getSuperUser,
  };
});
