<template>
  <v-dialog :model-value="showDialog" persistent max-width="500">
    <v-card class="findPersonDialogClass">
      <v-card-title class="headline">{{$t('search_users')}}</v-card-title>
      <v-card-text>{{$t('Find_person_to_create_user')}}</v-card-text>
      
      <v-autocomplete :items="items" :loading="loading" v-model:search="query" no-filter item-title="fullName" item-value="id" hide-no-data hide-details 
      class="mx-5" single-line :placeholder="$t('Select_Person')" prepend-icon="mdi-database-search" return-object>
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props" @click="selectPerson(item.raw)">
            <v-list-item-title>{{item.raw.fullName}}</v-list-item-title>
          </v-list-item>
        </template>
      </v-autocomplete>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" variant="text" @click="closeMe()">{{$t('Cancel')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { isEmptyOrUndefined } from '@/utilities/MyUtilities';
import UserService from '@/services/UserService';
import Person from '@/interfaces/Person';

defineProps({
  showDialog: { type: Boolean, required: true },
});

const emit = defineEmits(['personSelected', 'close']);

const userStore = useUserStore();

const fullNameMaxLength = ref(30);
const requestStatus = ref('');
const loading = ref(false);
const query = ref('');
const results = ref<Person[]>([]);

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

const selectPerson = (person: Person) => {
  emit('personSelected', person);
  query.value = '';
  results.value = [];
};

const closeMe = () => {
  emit('close');
};
</script>

<style scoped>
  .findPersonDialogClass {
    background-color: white;
    overflow: hidden;
    padding: 0 5px 0 5px;
  }
</style>
