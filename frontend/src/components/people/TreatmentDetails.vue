<template>
  <v-dialog
    v-model="internalDialog"
    :width="dialogWidth"
    min-width="800"
    persistent
    scrollable
    auto-grow
  >
    <v-card>
      <v-card-title>
        <span class="headline">{{$t('Treatment_Details')}}</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                readonly
                :label="$t('nature').toString()"
                :model-value="treatmentNature"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                readonly
                :label="$t('diagnostic').toString()"
                :model-value="treatmentDiagnostic"
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                readonly
                :label="$t('Healers').toString()"
                :model-value="healersFullName"
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field readonly :label="$t('Mode').toString()" :model-value="treatment?.mode" />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                readonly
                :label="$t('status').toString()"
                :model-value="treatment?.status"
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                :model-value="StartDate"
                label="Date"
                placeholder="DD-MM-YYYY"
                readonly
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                :model-value="StartTime"
                :label="$t('startTime').toString()"
                placeholder="HH:mm"
                readonly
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                :model-value="treatment?.totalCost"
                :label="$t('totalCost').toString()"
                readonly
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                :model-value="treatment?.payed"
                :label="$t('payed').toString()"
                readonly
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-text-field :model-value="rest" :label="$t('rest').toString()" readonly />
            </v-col>
            <v-col cols="12">
              <v-textarea
                :model-value="healingFrequency"
                :label="$t('healingFrequency').toString()"
                name="healingFrequency"
                auto-grow
                readonly
                rounded
                variant="outlined"
                color="success"
                aria-multiline
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                :model-value="treatment?.comment"
                variant="outlined"
                :label="$t('comment').toString()"
                name="comment"
                readonly
              />
            </v-col>
            <v-col cols="12">
              <v-btn color="success" @click="startMyPDFViewer()">{{$t('protocol')}}</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="success" dark @click="hideDialog">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <MyPDFViewer
    v-if="showMyPDFViewer"
    :pdfFileInfo="pdfFileInfo"
    :showMyPDFViewer="showMyPDFViewer"
    @closeMyPDFViewer="showMyPDFViewer=false"
  />
</template>

<script setup lang="ts">
import { IPDFFileInfo } from '@/composables/useTreatment';
import MyPDFViewer from "@/dialogs/MyPDFViewer.vue";
import { langsEnum } from '@/enumerators/enums';
import Diagnostic from '@/interfaces/Diagnostic';
import Treatment from "@/interfaces/Treatment";
import SicknessNatureService from '@/services/SicknessNatureService';
import { useAppStore } from '@/stores/app';
import { dateFormater } from '@/utilities/dateTime';
import Language from '@/utilities/Language';
import { computed, ref, watch } from 'vue';

const props = defineProps({
  TreatmentDetailsDialog: { type: Boolean, required: true },
  treatment: { type: Object as () => Treatment, required: true },
});

const emit = defineEmits(['close']);

const appStore = useAppStore();

const internalDialog = ref(props.TreatmentDetailsDialog);

watch(() => props.TreatmentDetailsDialog, (newVal) => {
  internalDialog.value = newVal;
  if (newVal) {
    console.log('DEBUG: TreatmentDetails opening. Treatment:', JSON.stringify(props.treatment));
    console.log('DEBUG: healersFullName:', healersFullName.value);
    
    const activeLang: langsEnum = Language.getActiveLang(locale.value);
    const allNatures = SicknessNatureService.getSickNatures(activeLang);
    console.log('DEBUG: Sickness Nature Store size:', allNatures.length, 'Active Lang:', activeLang);
    console.log('DEBUG: Target Nature ID:', props.treatment.nature);
    const foundNature = allNatures.find(n => n.id === props.treatment.nature);
    console.log('DEBUG: Found Nature:', JSON.stringify(foundNature));
  }
});

// Computed properties that are dependencies
const locale = computed(() => appStore.locale);

const healersFullName = computed(() => {
  if (props.treatment?.healers && props.treatment.healers.length > 0) {
    return props.treatment.healers.map(h => {
      return (h.firstName + ' ' + h.lastName).trim();
    }).filter(name => name !== '').join(", ");
  }
  return "";
});

const treatmentNature = computed(() => {
  let result: string = "";
  if (props.treatment) {
    const activeLang: langsEnum = Language.getActiveLang(locale.value);
    result = SicknessNatureService.getNatureDescription(props.treatment.nature, activeLang);
  }
  return result;
});

const treatmentDiagnostic = computed(() => {
  let result: string = "";
  if (props.treatment) {
    const activeLang: langsEnum = Language.getActiveLang(locale.value);
    result = SicknessNatureService.getDiagnosticDescription(props.treatment.nature, props.treatment.diagnostic, activeLang);
  }
  return result;
});

const StartDate = computed(() => {
  let result: string = "";
  if (props.treatment && props.treatment.startDate) {
    result = dateFormater(props.treatment.startDate, "YYYY-MM-DDTHH:mm:ssZ", "DD-MM-YYYY");
  }
  return result;
});

const StartTime = computed(() => {
  return props.treatment?.startTime || "";
});

const rest = computed(() => {
  if (props.treatment) {
    return props.treatment.totalCost - props.treatment.payed;
  }
  return 0;
});

const healingFrequency = computed(() => {
  let result: string = "";
  if (props.treatment) {
    const activeLang: langsEnum = Language.getActiveLang(locale.value);
    let diagList: Diagnostic[] = SicknessNatureService.getDiagnosticList(props.treatment.nature, activeLang);
    result = SicknessNatureService.getHealingFrequency(diagList, props.treatment.diagnostic);
  }
  return result;
});

// Refs for PDF viewer
const dialogWidth = ref(800);
const showMyPDFViewer = ref(false);
const pdfFileInfo = ref<IPDFFileInfo>({ lang: '', fileName: '' });

// Methods
function startMyPDFViewer() {
  if (!props.treatment?.diagnostic) {
    return;
  }
  const activeLang: langsEnum = Language.getActiveLang(locale.value);
  let diagList: Diagnostic[] = SicknessNatureService.getDiagnosticList(props.treatment.nature, activeLang);
  const protocol = SicknessNatureService.getProtocol(diagList, props.treatment.diagnostic);
  
  if (!protocol) {
    return;
  }
  
  pdfFileInfo.value.lang = locale.value;
  pdfFileInfo.value.fileName = protocol;
  showMyPDFViewer.value = true;
}

function updateDialogWidth(event: { width: number }) {
  dialogWidth.value = event.width;
}

function hideDialog() {
  showMyPDFViewer.value = false;
  emit('close');
}
</script>

<style scoped>
.container {
  background-color: whitesmoke;
}

.v-expansion-panel-content {
  margin: 0;
  padding: 0;
}
</style>
