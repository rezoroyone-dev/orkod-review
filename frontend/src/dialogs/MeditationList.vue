<template>
  <div>
    <!-- <v-card v-if="show" class="mx-auto" text background-color="transparent"> -->
    <v-autocomplete v-show="show" v-model="selectedMeditations" :items="meditations" item-title="name" item-value="id" chips label="Meditations" multiple>

      <template #selection="{ item }">
        <v-chip :key="item.raw.id" closable @click:close="remove(item.raw)" class="mr-1">
          {{ item.raw.name }}
        </v-chip>
      </template>

      <!-- <template v-slot:item="data">
        <template v-if="typeof data.item !== 'object'">
          <v-list-item-content v-text="data.item"></v-list-item-content>
        </template>
        <template v-else>
          <v-list-item-content>
            <v-list-item-title v-html="data.item.name"></v-list-item-title>
          </v-list-item-content>
        </template>
      </template>  -->

    </v-autocomplete>
    <!-- <v-list shaped>
        <v-list-item-group v-model="selectedMeditations" multiple>
          <template v-for="(item, i) in meditations">
            <v-divider v-if="!item" :key="`divider-${i}`"></v-divider>
            <v-list-item v-else :key="`item-${i}`" :value="item" active-class="deep-purple--text text--accent-4">
              <template v-slot:default="{ active, toggle }">
                <v-list-item-content>
                  <v-list-item-title v-text="item"></v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-checkbox :input-value="active" :true-value="item" color="deep-purple accent-4" @click="toggle"></v-checkbox>
                </v-list-item-action>
              </template>
            </v-list-item>
          </template>
        </v-list-item-group>
      </v-list> -->
    <!-- </v-card> -->
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </div>
</template>

<script setup lang="ts">
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import Meditation from '@/models/Meditation';
import MeditationService from '@/services/MeditationService';
import { useEventsPopUpStore } from '@/stores/eventsPopUp';
import { getIndexOfArrayObject } from '@/utilities/MyUtilities';
import { computed, onMounted, ref, watch } from 'vue';

import { useUserStore } from '@/stores/user';

defineProps<{
  show?: boolean;
}>();

const userStore = useUserStore();
const eventsPopUpStore = useEventsPopUpStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const meditations = ref<Meditation[]>([]);

const selectedMeditations = computed<Meditation[]>({
  get: () => {
    let meds: Meditation[] = eventsPopUpStore.meditations;
    if (meds == undefined || meds.length == 0) {
      return [];
    }
    return meds.map((item) => {
      // If item is just an ID (number)
      if (typeof item === 'number') {
        const fullMed = meditations.value.find(m => m.id === item);
        return fullMed || new Meditation({ id: item, name: '', path: '', comment: '' });
      }
      
      const meditationComment = item.comment || "";
      return new Meditation({ id: item.id, name: item.name, comment: meditationComment, medType: item.medType, path: item.path });
    });
  },
  set: (newMeditations: Meditation[]) => {
    if (newMeditations != undefined) {
      eventsPopUpStore.setMeditations(newMeditations);
    } else {
      eventsPopUpStore.clearMeditations();
    }
  }
});

const remove = (item: Meditation) => {
  const index = getIndexOfArrayObject(selectedMeditations.value, item);
  if (index != -1) {
    const updated = [...selectedMeditations.value];
    updated.splice(index, 1);
    selectedMeditations.value = updated;
  }
};

onMounted(async () => {
  try {
    if (userStore.superUser) {
        meditations.value = await MeditationService.getAllMeditations();
    }
  } catch (error: unknown) {
    showMsgBox("Error collecting all meditations information", String(error));
  }
});

watch(() => userStore.superUser, async (newUser) => {
    if (newUser) {
        try {
            meditations.value = await MeditationService.getAllMeditations();
        } catch (error: unknown) {
            showMsgBox("Error collecting all meditations information", String(error));
        }
    }
}, { deep: true });
</script>

<style scoped>
</style>
