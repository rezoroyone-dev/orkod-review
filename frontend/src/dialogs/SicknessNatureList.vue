<template>
  <div>
    <!-- <v-card v-if="show" class="mx-auto" text background-color="transparent"> -->
    <v-autocomplete v-show="show" v-model="selectedSicknessNatures" :items="sicknessNatures" item-title="description" item-value="id" chips :label="$t('nature')" multiple return-object>
      <template #selection="{ item }">
        <v-chip :key="item.raw.id" closable @click:close="remove(item.raw)" class="mr-1">
          {{ item.raw.description }}
        </v-chip>
      </template>
    </v-autocomplete>
<!--     <v-autocomplete v-show="selectedSicknessNatures.length == 1" v-model="selectedDiagnostic" :items="diagnosticList" :item-text="item => item.description" :item-value="item=>item" chips :label="$t('diagnostic')" multiple>
      <template v-slot:selection="data">
        <v-chip v-bind="data.attrs" :input-value="data.selected" close @click="data.select" @click:close="remove(data.item)">
          {{ data.item.description }}
        </v-chip>
      </template>
    </v-autocomplete> -->
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </div>
</template>

<script setup lang="ts">
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import { langsEnum } from '@/enumerators/enums';
import SicknessNature, { ALL } from "@/interfaces/SicknessNature";
import SicknessNatureService from '@/services/SicknessNatureService';
import { useAppStore } from '@/stores/app';
import { useEventsPopUpStore } from '@/stores/eventsPopUp';
import Language from '@/utilities/Language';
import { getIndexOfArrayObject } from '@/utilities/MyUtilities';
import { computed, onMounted, ref, watch } from 'vue';

defineProps<{
  show?: boolean;
}>();

const appStore = useAppStore();
const eventsPopUpStore = useEventsPopUpStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const sicknessNatures = ref<SicknessNature[]>([]);
// const diagnosticList = ref<Diagnostic[]>([]);

const selectedSicknessNatures = computed({
  get: () => {
    let sn: SicknessNature[] = eventsPopUpStore.eventSicknessNatures;
    if (sn == undefined || sn.length == 0) {
      return [];
    }
    return sn;
  },
  set: (newSicknessNatures: SicknessNature[]) => {
    if (newSicknessNatures != undefined) {
      eventsPopUpStore.setEventSicknessNatures(newSicknessNatures);
    } else {
      eventsPopUpStore.clearEventSicknessNatures();
    }
  }
});

const remove = (item: SicknessNature) => {
  if (item == ALL) {
    clearALL();
  }
  else {
    const index = getIndexOfArrayObject(selectedSicknessNatures.value, item);
    if (index != -1) {
      const updatedSicknessNatures = [...selectedSicknessNatures.value];
      updatedSicknessNatures.splice(index, 1);
      selectedSicknessNatures.value = updatedSicknessNatures;
    }
  }
};

const clearALL = () => {
  sicknessNatures.value.forEach((item) => {
    if (selectedSicknessNatures.value.includes(item)) {
      const index = getIndexOfArrayObject(selectedSicknessNatures.value, item);
      selectedSicknessNatures.value.splice(index, 1);
    }
  });
  eventsPopUpStore.clearEventSicknessNatures();
};

watch(selectedSicknessNatures, (newSelections: SicknessNature[], oldSelections: SicknessNature[]) => {
  if (newSelections.includes(ALL)) {
    sicknessNatures.value.forEach((item) => {
      if (!newSelections.includes(item)) {
        newSelections.push(item);
      }
    });
  }
  if (!newSelections.includes(ALL) && oldSelections.includes(ALL)) {
    clearALL();
  }
  // if (newSelections.length == 1) {
  //   const sicknessNatureID: number = newSelections[0].id;
  //   diagnosticList.value = SicknessNatureService.getDiagnosticList(sicknessNatureID, appStore.locale);
  // }
});

onMounted(async () => {
  try {
    let activeLanguage: langsEnum = Language.getActiveLang(appStore.locale);
    sicknessNatures.value = await SicknessNatureService.getSickNatures(activeLanguage);
    if (!sicknessNatures.value.includes(ALL)) {
      sicknessNatures.value.unshift(ALL);
    }
  } catch (error: unknown) {
    showMsgBox("Error collecting all sicknessNatures information", String(error));
  }
});
</script>

<style scoped>
</style>
