<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="CardTitleClass elevation-10">
          <v-card-title>
            <h4>{{ t('SMS_Manager') }}</h4>
            <v-spacer></v-spacer>
          </v-card-title>
          <v-card-text>
            <v-text-field v-if="serverIP" prefix="Server IP" :suffix="t('Use_value_mobile_SMS_Application')"
              :model-value="serverIP" readonly variant="solo" class="title" />
            <br />
            <v-chip color="light-green" class="title">{{ t("SMS_Template") }}</v-chip>
            <v-textarea v-model="activeSmsTemplate.text" class="title" auto-grow variant="outlined"
              :rules="[v => (!!v && v.length <= 200) || 'Max 200 characters']" />
            <v-chip color="light-green" class="title">{{ t("Possible_variables") }}</v-chip>
            <v-textarea :model-value="possibleTags" auto-grow variant="outlined" readonly class="title" />
          </v-card-text>
          <v-card-actions>
            <v-checkbox v-model="usedForSMS" :label="t('useForSMS')" />
            <v-spacer />
            <v-btn color="primary" @click="saveTemplate">
              {{ t('Save_Template') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <ProgressBar :loading="loading" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMessageBox } from '@/composables/useMessageBox';
import ProgressBar from '@/dialogs/ProgressBar.vue';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import SMSTemplate, { SmsServerResponse } from "@/models/SmsTemplate";
import { langsEnum } from "@/enumerators/enums";
import { useUserStore } from '@/stores/user';

const { t, locale } = useI18n();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const serverIP = ref("");
const allTemplates = ref<SMSTemplate[]>([]);
const activeSmsTemplate = ref<SMSTemplate>({} as SMSTemplate);
const usedForSMS = ref(false);
const loading = ref(false);
const possibleTags = ref("");

async function saveTemplate() {
  if (!userStore.superUser) {
    showMsgBox("Error", "User not authenticated");
    return;
  }
  if (locale.value == "" || (locale.value !== langsEnum.ENGLISH && locale.value !== langsEnum.FRENCH && locale.value !== langsEnum.ARABIC)) {
    throw Error("Unsupported locale language " + locale.value);
  }

  const index = allTemplates.value.findIndex(item => item.id === activeSmsTemplate.value.id);
  if (index >= 0) {
    allTemplates.value.splice(index, 1);
  }
  allTemplates.value.push(activeSmsTemplate.value);

  const response: SmsServerResponse = {
    usedLanguage: usedForSMS.value ? activeSmsTemplate.value.lang : SMSTemplate.usedLang,
    templates: allTemplates.value
  };

  await SMSTemplate.saveAllTemplates(userStore.superUser, response);
}

watch(locale, (newLocale) => {
  if (newLocale) {
    translateContents(newLocale);
  }
});

async function translateContents(lang: string) {
  try {
    if (!userStore.superUser) return;
    
    // Defensive check for translation function
    const safeT = (key: string) => {
      try {
        return t(key);
      } catch {
        return key;
      }
    };
    
    possibleTags.value = `${safeT('message_assistance')}\n<Time> : ${safeT('Appointment_time')}\n<Center_Name> : ${safeT('Center_Name')}\n<Center_Address> : ${safeT('Center_Address')}\n<Patient> : ${safeT('patientName')}\n<Healer> : ${safeT('Healer_Name')}\n<Treatment> : ${safeT('Treatments')}\n<Meditation> : ${safeT('Meditations')}`;

    const templates = await SMSTemplate.getAllTemplates(userStore.superUser);
    if (!templates || templates.length <= 0) return;

    allTemplates.value = templates;
    const templ = SMSTemplate.getTemplate(templates, lang);
    usedForSMS.value = SMSTemplate.usedLang === locale.value;
    activeSmsTemplate.value = templ;
  } catch (error) {
    console.error('Error in translateContents:', error);
    showMsgBox("Error", `${error}`);
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    await translateContents(locale.value);
    serverIP.value = await SMSTemplate.getServerIP(userStore.superUser);
  } catch (error) {
    showMsgBox("Error", `${error}`);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.CardTitleClass {
  background-color: rgba(79, 138, 24, 0.623);
}
</style>