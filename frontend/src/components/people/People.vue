<template>
  <v-progress-circular v-if="loading" :size="70" :width="7" color="purple" indeterminate></v-progress-circular>
  <v-tabs
    v-model="activeTab"
    centered
    bg-color="rgba(222, 161, 250, 0.863)"
    class="elevation-10"
  >
    <v-tab :value="0" class="text-white">
      <v-icon start>mdi-account-box</v-icon>
      {{ t('Person_details') }}
    </v-tab>
    <v-tab :value="1" class="text-white">
      <v-icon start>mdi-account-details</v-icon>
      {{ t('Treatments') }}
    </v-tab>
    <v-tab :value="2" class="text-white">
      <v-icon start>mdi-attachment</v-icon>
      {{ t('Documents') }}
    </v-tab>
    <v-tab :value="3" class="text-white">
      <v-icon start>mdi-alarm</v-icon>
      {{ t('Events') }}
    </v-tab>
  </v-tabs>

  <v-window v-model="activeTab">
    <v-window-item :value="0">
      <Person v-bind:readonly="personFormIsreadOnly" />
    </v-window-item>
    <v-window-item :value="1">
      <Treatments />
    </v-window-item>
    <v-window-item :value="2">
      <Documents />
    </v-window-item>
    <v-window-item :value="3">
      <Events />
    </v-window-item>
  </v-window>
</template>

<script setup lang="ts">
import Documents from "@/components/people/Documents.vue";
import Events from "@/components/people/Events.vue";
import Person from "@/components/people/Person.vue";
import Treatments from "@/components/people/Treatments.vue";
import { useTabsStore } from '@/stores/tabs';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';

const { t } = useI18n();
const tabsStore = useTabsStore();

const personFormIsreadOnly = ref(true);
const loading = ref(false);

// Use computed property to sync with store
const activeTab = computed({
  get: () => tabsStore.activeTab,
  set: (value) => tabsStore.setActiveTab(value)
});

onBeforeRouteLeave((to, from, next) => {
  // No need to save the active tab, as it's already bound to the store
  next();
});
</script>
