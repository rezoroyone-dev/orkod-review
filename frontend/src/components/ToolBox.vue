<template>
  <div>
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
            <v-icon medium color="success" class="mr-5"> mdi-toolbox </v-icon>
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
    title: "Seven fundamental techniques of Divine Healing",
    body: `Seven fundamental techniques of Divine Healing\n\n        1. Sensitize hands\n        2. Survey of the internal aura\n        3. General sweeping (cleaning) and localized cleaning\n        4. Increase patient receptivity\n        5. Energize with prana: hand chakra technique\n        at. Receive the prana\n        b. Project the prana\n        6. Stabilize the projected prana\n        7. Release the projected pranic energy\n        `,
  },
  {
    title: "Remote Divine Healing",
    body: `\n        The planetary etheric body is an inviolable and continuous whole: from this\n        etheric body are an integral and intrinsic part, the body of the\n        healer and that of the patient. The relationship channels can be\n        conductors of many different types of energy, transmitted to the patient\n        by the healer\n        - Alice Bailey, Esoteric Healing\n\n        The prana [vital energy] colored by the thought of the one who sends it, can\n        be projected remotely to people who wish to receive it and\n        this way healing can take place.\n        - Yogi Ramacharaka, The Science of Psychic Healing\n        -\n        Energy follows thought.\n        (An esoteric maxim)\n\n        Two principles of Divine Healing at a Distance\n        .................................. 202 Remote survey\n        .................................................. .............................. 202 Healing\n        Remote pranic ............................................... .................. 203\n

        `,
  },
  {
    title: "Activer les chakras",
    body: `Il est parfois nécessaire d’activer les chakras pour une guérison plus\n        avancée et plus rapide. La durée d’activation du chakra dépend de la\n        nécessité et aussi de l’habileté du guérisseur.\n        `,
  },
  {
    title: "Inhiber les chakras",
    body: ` `,
  },
  {
    title: "Renforcer",
    body: ` `,
  },
  {
    title: "Le traitement dos nourrissons et des personnes âgées",
    body: ` `,
  },
  {
    title: "Comment soulager la douleur",
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