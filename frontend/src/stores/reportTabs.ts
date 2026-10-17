import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useReportTabsStore = defineStore('reportTabs', () => {
  const activeTab = ref(0);

  function setActiveTab(tabIndex: number) {
    activeTab.value = tabIndex;
  }

  return { activeTab, setActiveTab };
});
