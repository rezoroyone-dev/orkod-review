<template>
  <div>
    <!-- <v-card v-if="show" class="mx-auto" text background-color="transparent"> -->
    <v-autocomplete v-model="selectedCenter" :items="centers" item-title="name" item-value="id" chips label="Center">
    </v-autocomplete>
    <!-- <v-list shaped>
        <v-list-item-group v-model="selectedCenters" multiple>
          <template v-for="(item, i) in centers">
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
import Center from '@/models/Center';
import CenterService from '@/services/CenterService';
import { useEventsPopUpStore } from '@/stores/eventsPopUp';
import { useUserStore } from '@/stores/user';
import { computed, onMounted, ref, watch } from 'vue';

const eventsPopUpStore = useEventsPopUpStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();
const userStore = useUserStore();

const centers = ref<Center[]>([]);

const selectedCenter = computed({
  get: () => eventsPopUpStore.getCenter?.id,
  set: (newCenterId: number) => {
    if (newCenterId != undefined) {
      const center = centers.value.find(c => c.id === newCenterId);
      if (center) {
        eventsPopUpStore.setCenter(center);
      }
    } else {
      eventsPopUpStore.clearCenter();
    }
  }
});

// Remove function - currently not used but kept for future use
// const remove = () => {
//   eventsPopUpStore.clearCenter();
// };

onMounted(async () => {
  try {
    if (userStore.superUser) {
      centers.value = await CenterService.getAllCenters();
    }
  } catch (error: unknown) {
    showMsgBox("Error collecting all centers information", String(error));
  }
});

watch(() => userStore.superUser, async (newUser) => {
    if (newUser) {
        try {
            centers.value = await CenterService.getAllCenters();
        } catch (error: unknown) {
            showMsgBox("Error collecting all centers information", String(error));
        }
    }
}, { deep: true });

</script>

<style scoped>
</style>
