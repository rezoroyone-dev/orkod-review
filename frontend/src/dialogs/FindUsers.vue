<template>
  <v-dialog :model-value="props.showDialog" persistent max-width="500">
    <v-card class="findHealersDialogClass">
      <v-card-title class="headline">{{$t('search_users')}}</v-card-title>
      <v-card-text>{{$t('Find_user_added_healers')}}</v-card-text>
      <v-chip-group column>
        <v-chip v-for="(person, index) in selectedParticipants" :key="index" closable @click:close="removeParticipant(person)" color="green-darken-1" >
          {{ person.firstName + ' ' +  person.lastName}}
        </v-chip>
      </v-chip-group>
      <v-autocomplete :items="items" :loading="loading" v-model:search="query" no-filter item-title="fullName" item-value="id" hide-no-data hide-details 
      class="mx-5" single-line :placeholder="$t('Select_Healer')" prepend-icon="mdi-database-search" return-object>
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props" @click="addToList(item.raw)">
            <v-list-item-title>{{item.raw.fullName}}</v-list-item-title>
          </v-list-item>
        </template>
      </v-autocomplete>
      <v-expand-transition v-show="results.length" offset-y z-index="50">
      </v-expand-transition>
      <div v-if="selectedParticipants.length > 0">
        <v-card-title>
          {{$t('level')}}
        </v-card-title>
        <v-autocomplete v-model="selectedHealerLevel" :items="healerLevels" class="mx-5"
        :item-title="item => item.id + ' ' + $t(item.text)" :item-value="item=>item.id" chips>
          <template v-slot:selection="{ item }">
            <v-chip :model-value="true" closable @click:close="removeHealerLevel(item.raw)">
              {{$t(item.raw.text) }}
            </v-chip>
          </template>
        </v-autocomplete>
      </div>
      <v-card-actions>
        <v-btn color="green-darken-1" @click="sendNewHealersToParentComponent()">OK</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="green-darken-1" @click="closeMe()">{{$t('Cancel')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { HealingLevelEnum } from '@/enumerators/HealingLevelEnum';
import Person from '@/interfaces/Person';
import Healer from '@/models/Healer';
import UserService from '@/services/UserService';
import { useUserStore } from '@/stores/user';
import { getIndexOfArrayObject, isEmptyOrUndefined, personsHasPerson } from '@/utilities/MyUtilities';
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  showDialog: { type: Boolean, required: false },
});

const emit = defineEmits(['searchResultChanged', 'CloseSearchDialog']);

const userStore = useUserStore();

const fullNameMaxLength = ref(30);
const requestStatus = ref('');
const loading = ref(false);
const query = ref('');
const results = ref<Person[]>([]); // Query results
const selectedParticipants = ref<Healer[]>([]); // selected persons from search results
const selectedHealerLevel = ref<HealingLevelEnum.Level>(1);
const healerLevels = ref(HealingLevelEnum.getALlHealingLevels());

onMounted(() => {
  selectedParticipants.value = [];
});

const addToList = (item: Person & { fullName?: string }) => {
  let person: Healer = Object.assign({}, item) as Healer;
  if (selectedParticipants.value === undefined) {
    return;
  }
  const exists = personsHasPerson(selectedParticipants.value, person);
  if (!exists) {
    selectedParticipants.value.push(person);
  } else {
    if (selectedParticipants.value.length === 0) {
      return;
    }
    removeParticipant(person);
  }
  query.value = '';
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
  if (loading.value) {
    return;
  }
  loading.value = true;
  requestStatus.value = '';
  try {
    if (userStore.superUser) {
        results.value = await UserService.findUsers(val);
    }
  } catch (error: unknown) {
    requestStatus.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
});

// No direct equivalent for @Watch('model') as it's not a prop or reactive state here.
// If 'model' refers to an external source, it needs to be explicitly watched or passed as a prop.

const removeParticipant = (person: Healer) => {
  const index = selectedParticipants.value.indexOf(person);
  if (index >= 0) {
    selectedParticipants.value.splice(index, 1);
  }
};

const sendNewHealersToParentComponent = () => {
  if (selectedParticipants.value !== undefined && selectedParticipants.value.length > 0) {
    selectedParticipants.value.forEach((healer: Healer) => {
      healer.personID = healer.id;
      healer.id = undefined;
      healer.level = selectedHealerLevel.value;
    });
    emit('searchResultChanged', selectedParticipants.value);
  }
  selectedParticipants.value = [];
  emit('CloseSearchDialog');
};

const closeMe = () => {
  selectedParticipants.value = [];
  emit('CloseSearchDialog');
};

const removeHealerLevel = (item: { text: string, id: number }) => {
  const index = getIndexOfArrayObject(healerLevels.value, item);
  if (index != -1) {
    selectedHealerLevel.value = 1;
  }
};
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

  .findHealersDialogClass {
    background-color: rgb(17, 105, 25);
    overflow: hidden;
    padding: 0 5px 0 5px;
  }
</style>
