import SicknessNature from "@/interfaces/SicknessNature";
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useSicknessNatureStore = defineStore('sicknessNature', () => {
  const debug = ref(import.meta.env.DEV);
  const sicknessNatures = ref<SicknessNature[]>([]);

  // Getters
  const getSicknessNatures = computed(() => {
    if (sicknessNatures.value != undefined && sicknessNatures.value.length > 0) {
      return Array.from(sicknessNatures.value);
    }
    return [];
  });

  // Actions
  const setSicknessNatures = (newValue: SicknessNature[]) => {
    if (debug.value) {
      console.log('setSicknessNatures triggered');
    }
    if (newValue == undefined) {
      return;
    }
    sicknessNatures.value = Array.from(newValue);
  };

  const clearSicknessNatures = () => {
    if (debug.value) {
      console.log('clearSicknessNatures triggered');
    }
    sicknessNatures.value = [];
  };

  return {
    sicknessNatures,
    getSicknessNatures,
    setSicknessNatures,
    clearSicknessNatures,
  };
});
