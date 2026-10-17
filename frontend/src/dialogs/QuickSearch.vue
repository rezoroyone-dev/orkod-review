<template>
  <v-card transparent color="transparent">
      <v-autocomplete
        v-model="model"
        :items="items"
        :loading="loading"
        v-model:search="query"
        color="pink"
        hide-no-data
        item-title="fullName"
        item-value="id"
        :placeholder="$t('Start_typing_to_Search')"
        prepend-icon="mdi-database-search"
        return-object
        style="min-width: 300px; max-width: 400px;"
        density="comfortable"
      >
      </v-autocomplete>
      <div v-if="items.length > 0" style="margin-top: 10px; font-size: 12px; color: gray;">
        Found {{ items.length }} results
      </div>
  </v-card>
        <div v-if="requestStatus" id="requestStatus">
        {{ requestStatus }}
        </div>
</template>

<script setup lang="ts">
import Person from '@/interfaces/Person';
import UserService from '@/services/UserService';
import { useAppStore } from '@/stores/app'; // Assuming useAppStore is the primary store
import { useUserStore } from '@/stores/user';
import { isEmptyOrUndefined } from '@/utilities/MyUtilities';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  usage?: string; // can be 'simple' or 'participants' to search for participants in Scheduler event popup
}>();

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const fullNameMaxLength = ref(30);
const requestStatus = ref('');
const loading = ref(false);
const model = ref<Person | null>(null);
const query = ref('');
const results = ref<Person[]>([]);

const items = computed(() => {
  console.log('Computing items from results:', results.value);
  const mappedItems = results.value.map(entry => {
    let tempFullName: string = entry.firstName + ' ' + entry.lastName;
    const fullName = tempFullName.length > fullNameMaxLength.value ? tempFullName.slice(0, fullNameMaxLength.value) + '...' : tempFullName;
    return Object.assign({}, entry, {
      fullName
    });
  });
  console.log('Mapped items:', mappedItems);
  return mappedItems;
});

watch(query, async (val: string) => {
  console.log('Search query changed:', val);
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
    // Use the authenticated user from userStore
    if (!userStore.superUser) {
      requestStatus.value = 'User not authenticated';
      console.log('No authenticated user found');
      return;
    }
    console.log('Making search request for:', val);
    results.value = await UserService.findUsers(val);
    console.log('Search results:', results.value);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Search error:', error);
    requestStatus.value = err.message || 'Search failed';
  } finally {
    loading.value = false;
  }
});

watch(model, (person) => {
  if (!person) {
    return;
  }

  if (props.usage !== 'participants') {
    const currentRoute = router.currentRoute.value;
    if (currentRoute.name !== 'People') {
      router.push('/admin/people').catch((error) => {
        console.log(error);
      });
    }
    setActivePerson(person);
  } else {
    // TODO: Implement addParticipant functionality if needed
    console.log('Add participant functionality not implemented yet');
  }
  query.value = '';
});

const setActivePerson = (person: Person) => {
  appStore.setActivePerson(person); // Assuming setActivePerson is a Pinia action/mutation
};
</script>
<style scoped>
#requestStatus {
    background-color: rgb(225, 242, 225);
    color: red;
    margin-top: 20px;
    z-index: -500;
}
</style>
