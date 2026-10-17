<template>
  <div>

    <form ref="upload_form" enctype="multipart/form-data" action="#">
      <v-col cols="12">
        <v-file-input v-model="files" clearable rounded chips multiple show-size counter :label="$t('Select_Files_to_upload')" />
        <v-btn v-if="files.length" color="primary" @click="submitFiles()">Upload</v-btn>
      </v-col>
    </form>
    <ProgressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </div>
</template>

<script setup lang="ts">
import AppConfigs from "@/AppConfigs";
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from '@/dialogs/ProgressBar.vue';
import Person from '@/interfaces/Person';
import AuthenticationService from '@/services/AuthenticationService';
import DocumentService from '@/services/DocumentService';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import axios from 'axios';
import { computed, ref } from 'vue';

const appStore = useAppStore();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const files = ref<File[]>([]);
const loading = ref(false);


const person = computed<Person>(() => appStore.activePerson);

const upload_form = ref<HTMLFormElement | null>(null);



const submitFiles = async () => {
  if (!person.value.id) {
    showMsgBox("Warning", "There is no active client selected\nSelect a user so you can upload files to his account");
    return;
  }
  if (files.value.length <= 0) {
    showMsgBox("Warning", "No Files selected\nYou need to select at least one file to upload");
    return;
  }

  const formData = new FormData();
  formData.append('personID', person.value.id.toString());
  files.value.forEach((file) => {
    formData.append('files', file, file.name);
  });

  loading.value = true;

  const url = AppConfigs.getServerURL() + "/uploadDocuments";
  if (userStore.superUser) {
    const config = AuthenticationService.getAxiosConfig(userStore.superUser);
    const headers = {
        'Content-Type': 'multipart/form-data'
    };
    config.headers = headers;

    try {
        await axios.post(url, formData, config);
        console.log('Files Uploaded successfully!!!');
        files.value = [];
        let personId = person.value.id;
        if (personId === undefined) {
        console.log('personId => ' + personId);
        return;
        }
        await DocumentService.getDocuments(personId);
    } catch (error) {
        showMsgBox("Error Uploading Files", String(error));
    } finally {
        loading.value = false;
    }
  }
};
</script>

<style scoped>
  .v-file-input {
    padding: 0;
    margin: 5px 0;
  }

  input[type="file"] {
    position: absolute;
    display: none;
  }

  div.file-listing {
    width: 200px;
  }

  table {
    border-style: double;
    border-width: 5px;
    border-color: green;
  }

  th,
  td {
    padding: 5px;
    border-style: solid;
    border-width: 5px;
    border-color: black;
    border-radius: 1px;
  }

  th {
    text-align: center;
  }

  td {
    text-align: left;
  }

  .allignCenter {
    text-align: center;
  }

  /* copied from net */
  #customers {
    font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
    border-collapse: collapse;
    width: 80%;
  }

  #customers td,
  #customers th {
    border: 1px solid #ddd;
    padding: 8px;
  }

  #customers tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  #customers tr:hover {
    background-color: #ddd;
  }

  #customers th {
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    background-color: #4CAF50;
    color: white;
  }
</style>
