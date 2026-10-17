<template>
  <div>
    <router-link target="_blank" to="/docs">Read the DOCs</router-link>
    <v-card class="mx-12 mt-auto CardTitleClass elevation-10">
      <v-system-bar></v-system-bar>

      <v-toolbar flat color="transparent">
        <v-btn icon>
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-text-field v-model="search" append-icon="mdi-magnify" :label="t('search')" single-line hide-details />
      </v-toolbar>

      <v-list three-line>
        <v-list-item v-for="(item, i) in searching" :key="i" ripple @click="showItem(item)">
          <template v-slot:prepend>
            <v-icon medium color="success" class="mr-5"> mdi-help </v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>

    <v-dialog v-model="showHelpDetails" persistent max-width="1024">
      <v-card>
        <v-textarea :model-value="activeItem.body" readonly variant="solo" flat full-width hide-details single-line
          auto-grow />
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showHelpDetails = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface HelpItem {
  title: string;
  body: string;
}

const { t } = useI18n();

const search = ref('');
const showHelpDetails = ref(false);
const activeItem = ref<HelpItem>({} as HelpItem);

const centersData: HelpItem[] = [
  {
    title: "How to add new patient",
    body: `TBI’s 5 Best: SF Mocktails to Finish Dry January Strong TBI’s 5 Best: SF Mocktails to Finish Dry January Strong\n        TBI’s 5 Best: SF Mocktails to Finish Dry January Strong\n        `,
  },
  {
    title: "Change your Divine Healing App language settings",
    body: ` `,
  },
  {
    title: "How to add new meditation",
    body: ` `,
  },
  {
    title: "Get licence",
    body: ` `,
  },
  {
    title: "Last one",
    body: ` `,
  },
];

const searching = computed(() => {
  if (!search.value) return centersData;
  const searchTerm = search.value.toLowerCase();
  return centersData.filter(item => {
    const text = item.title.toLowerCase();
    return text.includes(searchTerm);
  });
});

function showItem(item: HelpItem) {
  activeItem.value = { ...item };
  showHelpDetails.value = true;
}


</script>

<style scoped>
.headline {
  background-color: rgb(182, 36, 182);
  color: white;
}

.CardTitleClass {
  background-color: rgba(245, 238, 244, 0.829);
}
</style>