<template>
  <div>
    <v-col cols="12">
      <v-card class="elevation-10">
        <v-card-title>
          <h4>{{ t('LicenseManager') }}</h4>
          <v-spacer></v-spacer>
        </v-card-title>
      </v-card>
      <br />
      <v-card class="CardTitleClass elevation-10">
        <v-card-title>
          <h4>{{ t("LicenseStatus") }}</h4>
          <v-spacer></v-spacer>
        </v-card-title>
        <v-col cols="12">
          <v-textarea :model-value="license.summary" readonly variant="solo" flat full-width hide-details single-line
            auto-grow style="font-size: large;" />
        </v-col>
        <br />
        <v-btn color="primary" @click="createLicenseRequestFile()">{{ t("licenseRequest") }}</v-btn>
        <form ref="upload_form" enctype="multipart/form-data" action="#">
          <v-col cols="12">
            <v-file-input v-model="selectedFile" clearable rounded chips show-size counter hide-details
              :label="t('Select_License_File_to_upload')" />
            <v-btn v-if="selectedFile" color="primary" @click="uploadLicenseFile()">
              Upload</v-btn>
          </v-col>
        </form>
      </v-card>
    </v-col>
    <ProgressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </div>
</template>

<script setup lang="ts">
import AppConfigs from "@/AppConfigs";
import { useLicense } from '@/composables/useLicense';
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from '@/dialogs/ProgressBar.vue';
import AuthenticationService from '@/services/AuthenticationService';
import { useUserStore } from '@/stores/user';
import { logout } from '@/utilities/MyUtilities';
import axios from "axios";
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const userStore = useUserStore();
const router = useRouter();

const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();
const { license, loading, checkLicenseStatus } = useLicense();

const file = ref<File | undefined>(undefined);
const selectedFile = computed({
  get: () => file.value,
  set: (value: File | undefined) => {
    file.value = value;
  }
});

const upload_form = ref<HTMLFormElement | null>(null);

async function uploadLicenseFile() {
  if (!file.value) {
    return;
  }

  const fileName: string = file.value.name;

  if (fileName === "" || fileName !== "license.dat") {
    showMsgBox("Error", "License File name should be license.dat");
    return;
  }

  const formData = new FormData();
  formData.append('files', file.value, fileName);

  loading.value = true;
  const url = AppConfigs.getServerURL() + "/public/uploadLicenseFile";
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    const config = AuthenticationService.getAxiosConfig(userStore.superUser);
    config.headers = { 'Content-Type': 'multipart/form-data' };
    const response = await axios.post(url, formData, config);
    file.value = undefined;
    const ok = confirm(response.data + "\nYou will now be logged out to use the application");
    if (ok) {
      handleLogout();
    }
  } catch (error) {
    showMsgBox("Failed to upload license file", `${error}`);
  } finally {
    loading.value = false;
  }
}

function handleLogout() {
  logout(router); // Pass only router, userStore is accessed internally
}

async function createLicenseRequestFile() {
  loading.value = true;
  const url = AppConfigs.getServerURL() + "/public/createLicenseRequestFile";
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    const config = AuthenticationService.getAxiosConfig(userStore.superUser);
    await axios.post(url, null, config);
    await downloadWithAxios();
  } catch (error) {
    showMsgBox("Error while generating license request file", `${error}`);
  } finally {
    loading.value = false;
  }
}

async function downloadWithAxios() {
  const url: string = AppConfigs.getServerURL() + "/public/licenseFiles/licenseRequest.dat";
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    const config = AuthenticationService.getAxiosConfig(userStore.superUser);
    config.responseType = 'arraybuffer';
    const response = await axios.get(url, config);
    forceFileDownload(response, "licenseRequest.dat");
  } catch (error) {
    showMsgBox("Error downloading license request file", `${error}`);
  }
}

function forceFileDownload(response: { data: ArrayBuffer }, fileName: string) {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
}

onMounted(async () => {
  if (userStore.superUser) {
    await checkLicenseStatus(userStore.superUser);
  }
});
</script>

<style scoped>
.CardTitleClass {
  background-color: rgba(79, 138, 24, 0.623);
}
</style>
