import Treatment from '@/interfaces/Treatment';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useTreatmentStore = defineStore('treatment', () => {
  const debug = ref(import.meta.env.DEV);
  const activeTreatment = ref<Treatment | null>(null);

  // Getters
  const getActiveTreatment = computed(() => {
    // console.log('activeTreatment getter invocked with ' + JSON.stringify(activeTreatment.value))
    return Object.assign({}, activeTreatment.value);
  });

  // Actions
  const setActiveTreatment = (newValue: Treatment | null) => {
    if (debug.value) {
      console.log('setActiveTreatment triggered with', newValue);
    }
    activeTreatment.value = newValue;
  };
  const clearActiveTreatment = () => {
    if (debug.value) {
      console.log('clearActiveTreatment triggered');
    }
    activeTreatment.value = null;
  };

  return {
    activeTreatment,
    getActiveTreatment,
    setActiveTreatment,
    clearActiveTreatment,
  };
});
