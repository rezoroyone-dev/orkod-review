<template>
<div>
    <v-dialog v-model="dialog" max-width="800px" persistent scrollable >
        <template v-slot:activator="{ props }">
            <div class="d-flex justify-end">
                <v-btn v-bind="props" color="primary" dark class="mb-2">{{$t('New_Treatment')}}</v-btn>
            </div>
        </template>
        <v-card>
            <v-card-title>
                <span class="headline">{{ formTitle }}</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-form ref="form">
                        <v-row>
                            <v-col cols="12" sm="6" md="4">
                                <v-select :label="$t('nature').toString()" v-model="editedItem.nature" :items="natureList" item-title="description" item-value="id" :rules="[v => !!v || 'Item is required']" required />
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                <v-select :label="$t('diagnostic').toString()" v-model="editedItem.diagnostic" :items="diagnosticList" item-title="description" item-value="id" :rules="[v => !!v || 'Item is required']" required />
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                <v-select :label="$t('Mode').toString()" v-model="editedItem.mode" :items="treatmentModes" item-title="mode" :rules="[v => !!v || 'Item is required']" required />
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                <v-select :label="$t('Healers').toString()" v-model="editedItem.healers" :items="healers" :item-title="item => item.firstName +' '+ item.lastName" item-value="id" multiple chips closable-chips :rules="[v => (!!v && v.length > 0) || 'Item is required']" required return-object />
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                <v-text-field v-model="editedItemStartDate" label="Date" placeholder="DD-MM-YYYY" :rules="[v => (!!v && isValidDate(v,'DD-MM-YYYY')) || 'Should be a valid Date']" />
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                <v-text-field v-model="editedItemStartTime" :label="$t('Time').toString()" placeholder="HH:mm" :rules="[v => (!!v && isValidDate(v,'HH:mm')) || 'Should be a valid time']" />
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                <v-text-field type="number" v-model.number="editedItem.totalCost" :label="$t('totalCost').toString()" :rules="validateNumbers(editedItem.totalCost)" />
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                <v-text-field type="number" v-model.number="editedItem.payed" :label="$t('payed').toString()" :rules="validateNumbers(editedItem.payed)" />
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                                <v-select :label="$t('status').toString()" v-model="editedItem.status" :items="statusList" :rules="[v => !!v || 'Item is required']" required />
                            </v-col>
                            <v-col cols="12">
                                <h5>{{$t('healingFrequency')}} </h5>
                                <v-textarea v-model="editedItem.healingFrequency" auto-grow readonly rounded variant="outlined" aria-multiline  name="healingFrequency" />
                            </v-col>
                            <v-col cols="12">
                                <v-textarea v-model="editedItem.comment" variant="outlined" :label="$t('comment').toString()" name="comment" />
                            </v-col>
                        </v-row>
                    </v-form>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" variant="text" @click="startMyPDFViewer()">{{$t('protocol')}}</v-btn>
                <v-btn color="blue darken-1" variant="text" @click="close">{{$t('Cancel')}}</v-btn>
                <v-btn color="blue darken-1" variant="text" @click="save">OK</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

      <MyPDFViewer v-if="showMyPDFViewer" :showMyPDFViewer="showMyPDFViewer" :pdfFileInfo="pdfFileInfo" @closeMyPDFViewer="showMyPDFViewer=false" />

    <v-data-table :headers="headers" :items="treatments" class="elevation-1">
        <template v-slot:[`item.mode`]="{ item }">
            {{ ModeEnum.getModeByID(item.mode)}}
        </template>

        <template v-slot:[`item.nature`]="{ item }">
            {{ getNatureDescription(item.nature)}}
        </template>

        <template v-slot:[`item.diagnostic`]="{ item }">
            {{ getDiagnosticDescription(item.nature,item.diagnostic)}}
        </template>

        <template v-slot:[`item.healers`]="{ item }">
            <v-chip v-for="healer in item.healers" :key="healer.id" size="small" class="mr-1">
                {{ healer.firstName }} {{ healer.lastName }}
            </v-chip>
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
            <v-icon size="small"  class="mr-1" @click="editItem(item)">mdi-pencil</v-icon>
            <v-icon size="small" color="red" class="mr-1" @click="confirmDeleteItem(item)">mdi-delete</v-icon>
            <v-icon size="small" color="green" class="mr-1" @click="showDetailsDialog(item)">mdi-information</v-icon>
        </template>
    </v-data-table>
    <ProgressBar :loading="loading" />
    <TreatmentDetails :TreatmentDetailsDialog="showTreatmentDetails" :treatment="treatmentDetailsItem" @close="showTreatmentDetails = false" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />  
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
</div>
</template>

<!-- SCRIPT_PLACEHOLDER -->
<script setup lang="ts">
import TreatmentDetails from "@/components/people/TreatmentDetails.vue";
import { useTreatment } from '@/composables/useTreatment';
import ConfirmDialog from "@/dialogs/ConfirmDialog.vue";
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import MyPDFViewer from "@/dialogs/MyPDFViewer.vue";
import ProgressBar from '@/dialogs/ProgressBar.vue';
import { ModeEnum } from "@/enumerators/ModeEnum";
import { dateFormater } from "@/utilities/dateTime";

const { 
    loading,
    statusList,
    natureList,
    diagnosticList,
    healers,
    treatmentModes,
    dialog,
    pdfFileInfo,
    showMyPDFViewer,
    headers,
    treatments,
    editedItem,
    treatmentDetailsItem,
    showTreatmentDetails,
    msgBox,
    closeMsgBox,
    confirmDialogContents,
    closeConfirmDialog,
    formTitle,
    form,
    startMyPDFViewer,
    close,
    save,
    validateNumbers,
    showDetailsDialog,
    editItem,
    confirmDeleteItem,
    editedItemStartDate,
    editedItemStartTime,
    getNatureDescription,
    getDiagnosticDescription,
    isValidDate,
    setTreatmentStatus,
    getTreatmentList,
    activePerson,
} = useTreatment();

// Set status to open when component mounts
setTreatmentStatus('open');
if (activePerson.value && activePerson.value.id) {
    getTreatmentList(activePerson.value.id, 'open');
}

</script>
