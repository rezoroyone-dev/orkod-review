<template>
  <div>
    <v-checkbox v-model="allHealersAvailable" :label="$t('All_Healers_Available')" color="primary" hide-details density="compact" />
    <v-chip-group v-if="!allHealersAvailable" column>
      <v-chip v-for="healer in selectedHealers" :key="healer.id" v-bind:value="healer" closable @click:close="removeHealer(healer)" color="primary">
        {{(healer.firstName || healer.person?.firstName) + " " + (healer.lastName || healer.person?.lastName)}}
      </v-chip>
    </v-chip-group>
    <v-autocomplete v-if="!allHealersAvailable" :items="items" :loading="loading" v-model:search="query" no-filter item-title="fullName" item-value="id" hide-no-data hide-details single-line :placeholder="$t('Select_Healer')" prepend-icon="mdi-database-search" return-object>
      <template v-slot:item="{ item }">
        <v-list-item @click="addToList(item.raw)">
          <v-list-item-title>{{item.raw.fullName}}</v-list-item-title>
        </v-list-item>
      </template>
    </v-autocomplete>
    <v-expand-transition v-show="results.length" offset-y z-index="50">
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import Healer from "@/models/Healer";
import HealerService from '@/services/HealerService';
import { useEventsPopUpStore } from '@/stores/eventsPopUp';
import { useUserStore } from '@/stores/user';
import { isEmptyOrUndefined, personsHasPerson } from '@/utilities/MyUtilities';
import { computed, onMounted, ref, watch } from 'vue';

const eventsPopUpStore = useEventsPopUpStore();
const userStore = useUserStore();

const fullNameMaxLength = ref(30);
const requestStatus = ref('');
const loading = ref(false);
const query = ref('');
const results = ref<Healer[]>([]);

const items = computed(() => {
  return results.value.map(person => {
    let fn = person.firstName || person.person?.firstName || '';
    let ln = person.lastName || person.person?.lastName || '';
    let tempFullName: string = fn + ' ' + ln;
    const fullName = tempFullName.length > fullNameMaxLength.value ? tempFullName.slice(0, fullNameMaxLength.value) + '...' : tempFullName;
    return Object.assign({} as Healer, person, {
      fullName
    });
  });
});

const selectedHealers = computed({
  get: () => eventsPopUpStore.getHealers,
  set: (newHealers: Healer[]) => {
    eventsPopUpStore.setHealers(newHealers);
  }
});

const allHealersAvailable = computed({
  get: () => eventsPopUpStore.getIsAllHealersAvailable,
  set: (val: boolean) => {
    eventsPopUpStore.setIsAllHealersAvailable(val);
    if (val) {
      eventsPopUpStore.clearHealers();
    }
  }
});

const addToList = (healer: Healer) => {
  query.value = '';
  if (healer === undefined) {
    return;
  }
  const currentHealers = Array.from(selectedHealers.value);
  if (!personsHasPerson(currentHealers, healer)) {
    currentHealers.push(healer);
    selectedHealers.value = currentHealers;
  }
};

const removeHealer = (healer: Healer) => {
  const currentHealers = Array.from(selectedHealers.value);
  const index = currentHealers.findIndex(h => h.id === healer.id);
  if (index !== -1) {
    currentHealers.splice(index, 1);
    selectedHealers.value = currentHealers;
  }
};

watch(query, async (val: string) => {
  if (isEmptyOrUndefined(val) || val.length < 1) {
    results.value = [];
    return false;
  }

  if (loading.value || !userStore.superUser) {
    return;
  }
  loading.value = true;
  requestStatus.value = '';
  try {
    results.value = await HealerService.findHealers(val);
  } catch (error: any) {
    requestStatus.value = error.message;
  } finally {
    loading.value = false;
  }
});

onMounted(() => {
  // Any mounted logic if needed
});
</script>

<style scoped>
  .v-autocomplete {
    margin: 0px;
    padding: 0px;
  }

  .v-chip-group {
    margin: 0px;
    padding: 0px;
  }
</style>
