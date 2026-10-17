<template>
    <div v-if="person && person.firstName">
        <v-card color="primary">
          <v-card-actions>
            <v-card-title primary-title v-if="person && person.firstName" class="mx-5">
              <h4>{{ person.firstName }} {{ person.lastName }}</h4>
            </v-card-title>
            <v-spacer />
            <v-card-title v-if="person">
              <h4>{{ $t('Folder_Number') }} {{ person.folderNumber ? person.folderNumber : person?.id }}</h4>
            </v-card-title>
          </v-card-actions>
        </v-card>
        <div class="mt-0">
          <v-expansion-panels multiple v-model="panel" :key="person.id">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <h2>{{ $t('Plan_Treatment') }}</h2>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                  <FoldersTableOpen />
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <h2>{{ $t('Closed_Treatment') }}</h2>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                  <FoldersTableClosed />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
    </div>
    <div v-else>
      <br />
      <br />
      <h2>{{ $t("selectPersonForDetails") }}</h2>
    </div>
</template>

<script setup lang="ts">
import FoldersTableClosed from "@/components/people/FoldersTableClosed.vue";
import FoldersTableOpen from "@/components/people/FoldersTableOpen.vue";
import { useAppStore } from '@/stores/app';
import { computed, ref } from 'vue';

const appStore = useAppStore();

const panel = ref([0, 1]);

const person = computed(() => appStore.activePerson);

</script>

<style scoped>
.container {
  background-color: rgb(95, 74, 116);
}
.v-expansion-panel-content {
  margin: 0;
  padding: 0;
}
</style>
