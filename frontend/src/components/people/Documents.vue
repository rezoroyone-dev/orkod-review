<template>
  <div>
    <div v-show="person && person.firstName">
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
      <div class="mt-4">
        <FilesUpload />
        <v-expansion-panels multiple v-model="panel">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-card-title>{{ $t('List_Uploaded_files') }}</v-card-title>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-data-table :headers="headers" :items="documents" class="elevation-1">
                <template v-slot:[`item.createdOn`]="{ item }">
                  {{ item && item.createdOn ? dateFormater(item.createdOn, 'YYYY-MM-DDTHH:mm:ssZ','DD-MM-YYYY HH:mm:ss') : '' }}
                </template>
                <template v-slot:[`item.actions`]="{ item }">
                  <v-icon size="small" class="mr-5" color="red" @click="confirmDeletion(item)">mdi-delete</v-icon>
                  <v-icon size="small" color="blue" @click="downloadWithAxios(item)">mdi-download</v-icon>
                </template>
              </v-data-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

    </div>
    <div v-show="!person || !person.firstName">
      <br>
      <br>
      <h2>{{ $t("selectPersonForDetails") }}</h2>
    </div>
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <ProgressBar :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import AppConfigs from "@/AppConfigs";
import FilesUpload from "@/components/fileUpload/FilesUpload.vue";
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useMessageBox } from '@/composables/useMessageBox';
import ConfirmDialog from "@/dialogs/ConfirmDialog.vue";
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from "@/dialogs/ProgressBar.vue";
import Document from '@/interfaces/Document';
import AuthenticationService from '@/services/AuthenticationService';
import DocumentService from '@/services/DocumentService';
import { useAppStore } from '@/stores/app';
import { useDocumentStore } from '@/stores/document';
import { useUserStore } from '@/stores/user';
import { dateFormater } from '@/utilities/dateTime';
import { getIndexOfArrayObject } from "@/utilities/MyUtilities";
import axios from "axios";
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const appStore = useAppStore();
const documentStore = useDocumentStore();
const userStore = useUserStore();
const { confirmDialogContents, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const loading = ref(false);
const panel = ref([0]);
const headers = ref([
  {
    title: 'File Name',
    align: 'start' as const,
    sortable: true,
    key: 'fileName'
  },
  {
    title: 'Creation Date',
    key: 'createdOn',
    align: 'start' as const,
    sortable: true
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'start' as const
  }
]);

const person = computed(() => appStore.activePerson);
const documents = computed(() => documentStore.documents);

function translateContents() {
  headers.value.forEach((item) => {
    item.title = t(item.key)
  })
}

function confirmDeletion(doc: Document) {
  showConfirmDialog("Confirmation", t('ARE_YOU_SURE_DELETE'), deleteDocument as (param: unknown) => void, doc)
}

async function deleteDocument(doc: Document) {
  closeConfirmDialog()
  if (!doc || !doc.id || doc.id <= 0 || !doc.personID || doc.personID <= 0) {
    return
  }
  const index = getIndexOfArrayObject(documents.value, doc)
  if (index <= -1) {
    showMsgBox("Error", "Unable to get document index")
    return
  }
  try {
    loading.value = true
    if (userStore.superUser) {
        await DocumentService.deleteDocument( doc)
        documentStore.removeDocument(doc);
    }
  } catch (error) {
    showMsgBox("Error: failed to Delete object", String(error))
  } finally {
    loading.value = false
  }
}

async function updateDocumentsList() {
  let personID = person.value?.id;
  if (personID === undefined) {
    documentStore.clearDocuments();
    return;
  }
  try {
    if (userStore.superUser) {
        const docs = await DocumentService.getDocuments(personID);
        if (docs.length > 0) {
          documentStore.setDocuments(docs);
        } else {
          documentStore.clearDocuments();
        }
    }
  } catch (error) {
    console.error('Error loading documents:', error);
    documentStore.clearDocuments();
  }
}

function downloadWithAxios(doc: Document) {
  // sanitize path: extract relative part starting from uploadedFiles
  let path = doc.path;
  const searchStr = "uploadedFiles";
  const index = path.indexOf(searchStr);
  
  if (index !== -1) {
      path = path.substring(index);
  }
  
  // Ensure path starts with a single slash
  path = "/" + path.replace(/^[\\/]+/, "");
  
  // AppConfigs.getServerURL() already ends with /api
  let url: string = AppConfigs.getServerURL() + path
  if (userStore.superUser) {
    let config = AuthenticationService.getAxiosConfig(userStore.superUser)
    config.url = url
    config.method = 'get'
    config.responseType = 'arraybuffer'
    axios(config)
        .then(response => {
          forceFileDownload(response, doc.fileName)
        })
        .catch((error) => console.log(error))
  }
}

function forceFileDownload(response: { data: ArrayBuffer }, fileName: string) {
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
}

onMounted(() => {
    if (userStore.superUser) {
        updateDocumentsList();
    }
  translateContents();
});

watch(person, () => {
    if (userStore.superUser) {
        updateDocumentsList();
    }
});

watch(() => appStore.locale, () => {
  translateContents();
});

watch(() => userStore.superUser, (newUser) => {
    if (newUser) {
        updateDocumentsList();
    }
}, { deep: true });

</script>
<style scoped>
  .container {
    background-color: olivedrab;
  }

  h4 {
    color: white;
  }
</style>
