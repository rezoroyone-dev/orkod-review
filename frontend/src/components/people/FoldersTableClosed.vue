<template>
  <div>
    <v-spacer></v-spacer>
    <v-dialog v-model="dialog" max-width="800px" persistent scrollable>
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-container grid-list-md>
            <v-form ref="form">
              <v-row>
                <v-col cols="12" sm="6" md="4">
                  <v-select :label="$t('nature').toString()" v-model="editedItem.nature" :items="natureList" item-title="description" item-value="id" readonly />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select :label="$t('diagnostic').toString()" v-model="editedItem.diagnostic" :items="diagnosticList" item-title="description" item-value="id" readonly />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select :label="$t('Mode').toString()" v-model="editedItem.mode" :items="treatmentModes" item-title="mode" readonly />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select :label="$t('Healers').toString()" v-model="editedItem.healers" :items="healers" :item-title="item => item.firstName +' '+ item.lastName" item-value="id" multiple chips readonly />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field v-model="editedItemStartDate" label="Date" placeholder="DD-MM-YYYY" readonly />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field v-model="editedItemStartTime" :label="$t('Time').toString()" placeholder="HH:mm" readonly />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field type="number" v-model.number="editedItem.totalCost" :label="$t('totalCost').toString()" readonly />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-text-field type="number" v-model.number="editedItem.payed" :label="$t('payed').toString()" readonly />
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-select :label="$t('status').toString()" v-model="editedItem.status" :items="statusList" required />
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="editedItem.comment" variant="outlined" :label="$t('comment').toString()" name="comment" readonly />
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" variant="text" @click="close">{{$t('Cancel')}}</v-btn>
          <v-btn color="blue darken-1" variant="text" @click="save">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-data-table :headers="headers" :items="treatments" class="elevation-1">

      <template v-slot:[`item.healers`]="{ item }">
        <v-chip v-for="healer in item.healers" :key="healer.id" size="small" class="mr-1">
          {{ healer.firstName }} {{ healer.lastName }}
        </v-chip>
      </template>

      <template v-slot:[`item.mode`]="{ item }">
        {{ ModeEnum.getModeByID(item.mode)}}
      </template>

      <template v-slot:[`item.nature`]="{ item }">
        {{ getNatureDescription(item.nature)}}
      </template>

      <template v-slot:[`item.diagnostic`]="{ item }">
        {{ getDiagnosticDescription(item.nature,item.diagnostic)}}
      </template>

      <template v-slot:[`item.startDate`]="{ item }">
        {{ dateFormater(item.startDate,'YYYY-MM-DDTHH:mm:ssZ','DD-MM-YYYY') }}
      </template>

      <template v-slot:[`item.startTime`]="{ item }">
        {{ dateFormater(item.startTime,'HH:mm','HH:mm')}}
      </template>

      <template v-slot:[`item.rest`]="{ item }">
       {{ (item.totalCost - item.payed).toFixed(2) }}
      </template>

      <template v-slot:[`item.actions`]="{ item }">
        <v-icon size="small" class="mr-1" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon size="small" color="red" class="mr-1" @click="confirmDeleteItem(item)">mdi-delete</v-icon>
        <v-icon size="small" color="green" class="mr-1" @click="showDetailsDialog(item)">mdi-information</v-icon>
      </template>
    </v-data-table>
    <TreatmentDetails :TreatmentDetailsDialog="showTreatmentDetails" :treatment="treatmentDetailsItem" @close="showTreatmentDetails = false" />
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
  </div>
</template>

<script setup lang="ts">
import TreatmentDetails from "@/components/people/TreatmentDetails.vue";
import { useTreatment } from '@/composables/useTreatment';
import ConfirmDialog from "@/dialogs/ConfirmDialog.vue";
import { ModeEnum } from "@/enumerators/ModeEnum";
import { dateFormater } from "@/utilities/dateTime";

const { 
    statusList,
    natureList,
    diagnosticList,
    healers,
    treatmentModes,
    dialog,
    headers,
    treatments,
    editedItem,
    treatmentDetailsItem,
    showTreatmentDetails,
    confirmDialogContents,
    closeConfirmDialog,
    formTitle,
    form,
    close,
    save,
    showDetailsDialog,
    editItem,
    confirmDeleteItem,
    editedItemStartDate,
    editedItemStartTime,
    getNatureDescription,
    getDiagnosticDescription,
    setTreatmentStatus,
    getTreatmentList,
    activePerson,
} = useTreatment();

// Set status to closed when component mounts
setTreatmentStatus('closed');
if (activePerson.value && activePerson.value.id) {
    getTreatmentList(activePerson.value.id, 'closed');
}
</script>
