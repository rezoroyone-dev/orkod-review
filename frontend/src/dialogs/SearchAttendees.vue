<template>
  <div>
    <v-chip-group column>
      <v-chip v-for="(person, index) in attendees" :key="index" close @click:close="removeParticipant(person)" color="primary">
        {{ person.firstName + " " + person.lastName}}
      </v-chip>
    </v-chip-group>
    <v-autocomplete :items="items" :loading="loading" v-model:search="query" no-filter item-title="fullName" item-value="id" hide-no-data hide-details single-line :placeholder="$t('Select_Patients')" prepend-icon="mdi-database-search" return-object>
      <template v-slot:item="{ item }">
        <v-list-item @click="addToList(item.raw)">
          <v-list-item-title>{{item.raw.fullName}}</v-list-item-title>
        </v-list-item>
      </template>
    </v-autocomplete>
    <v-expand-transition v-show="results.length" offset-y z-index="50">
    </v-expand-transition>
    <v-menu offset-y origin="center center" :nudge-bottom="10" transition="scale-transition">
      <v-list class="pa-0">
        <v-list-item v-for="(item,i) in items" :key="i" @click="addToList(item)" :ripple="true" rel="noopener">
          <v-list-item-title>{{ item.fullName }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import Person from '@/interfaces/Person';
import UserService from '@/services/UserService';
import { useEventsPopUpStore } from '@/stores/eventsPopUp';
import { useUserStore } from '@/stores/user';
import { isEmptyOrUndefined, personsHasPerson } from '@/utilities/MyUtilities';
import { computed, ref, watch } from 'vue';

const eventsPopUpStore = useEventsPopUpStore();
const userStore = useUserStore();

const fullNameMaxLength = ref(30);
const requestStatus = ref('');
const loading = ref(false);
const query = ref('');
const results = ref<Person[]>([]);

const attendees = computed((): Person[] => {
  const storeAttendees = eventsPopUpStore.getAttendees;
  if (storeAttendees !== undefined && storeAttendees.length > 0) {
    return Array.from(storeAttendees);
  } else {
    return [];
  }
});

const addToList = (person: Person) => {
  let per = Object.assign({}, person);
  let exists = personsHasPerson(attendees.value, per);
  if (!exists) {
    eventsPopUpStore.addParticipant(person);
  }
  query.value = '';
};

const removeParticipant = (person: Person) => {
  console.log('Removing ' + person.firstName);
  eventsPopUpStore.removeParticipant(person);
};

const items = computed(() => {
  return results.value.map(entry => {
    let tempFullName: string = entry.firstName + ' ' + entry.lastName;
    const fullName = tempFullName.length > fullNameMaxLength.value ? tempFullName.slice(0, fullNameMaxLength.value) + '...' : tempFullName;
    return Object.assign({}, entry, {
      fullName
    });
  });
});

watch(query, async (val) => {
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
    results.value = await UserService.findUsers(val);
  } catch (error: any) {
    requestStatus.value = error.message;
  } finally {
    loading.value = false;
  }
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
