import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTabsStore = defineStore('tabs', () => {
  const activeTab = ref(0);

  function setActiveTab(tabIndex: number) {
    activeTab.value = tabIndex;
  }

  return { activeTab, setActiveTab };
});
