<template>
  <div class="login-page">
    <!-- Background image fills the whole viewport -->
    <audio :src="LoginAudioSrc" autoplay loop hidden />
    <v-img :src="LoginBackgroundSrc" cover class="login-bg-image" />

    <!-- Centered overlay card -->
    <div class="login-overlay d-flex align-center justify-center">
      <v-card class="login-card elevation-16 rounded-xl" width="420">
        <!-- Logo / brand header -->
        <div class="login-card-header d-flex flex-column align-center pt-8 pb-4 px-6">
          <v-avatar color="white" size="72" class="mb-3 elevation-4">
            <v-img :src="logo" contain />
          </v-avatar>
          <h2 class="text-h5 font-weight-bold text-white">{{ t('Authenticate') }}</h2>
          <p class="text-caption text-white opacity-80 mt-1">Orkod Center — Divine Healing</p>
        </div>

        <v-card-text class="px-6 pt-4 pb-2">
          <v-form ref="form">
            <!-- Language selector -->
            <v-select
              :items="langs"
              v-model="locale"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-web"
              :label="t('Language')"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-4"
            />

            <!-- Username -->
            <v-text-field
              prepend-inner-icon="mdi-account-circle"
              :label="t('userName')"
              type="text"
              v-model="username"
              required
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || t('Field_Required')]"
              @keyup.enter="formSubmit()"
              class="mb-3"
            />

            <!-- Password -->
            <v-text-field
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="showPassword ? 'text' : 'password'"
              :label="t('Password')"
              v-model="password"
              required
              variant="outlined"
              density="comfortable"
              @click:append-inner="showPassword = !showPassword"
              :rules="[v => !!v || t('Field_Required')]"
              @keyup.enter="formSubmit()"
              class="mb-3"
            />

            <!-- Error alert -->
            <v-alert
              v-if="errored"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              {{ errorMSG }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6 pt-0">
          <v-btn
            id="loginBtn"
            color="primary"
            variant="elevated"
            size="large"
            block
            rounded="lg"
            :loading="loggingIn"
            @click="formSubmit"
          >
            <v-icon start>mdi-login</v-icon>
            {{ t('Login') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- 2FA Verification Dialog -->
    <v-dialog v-model="show2FADialog" max-width="400px" persistent>
      <v-card>
        <v-card-title>{{ t('Two_Factor_Auth') }}</v-card-title>
        <v-card-text>
          <p class="mb-4">{{ t('Enter_2FA_Code') }}</p>
          <v-text-field
            :label="t('Verification_Code')"
            v-model="totpCode"
            prepend-icon="mdi-two-factor-authentication"
            variant="outlined"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            @keyup.enter="verify2FA()"
          ></v-text-field>
          <v-alert
            v-if="totpError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ totpErrorMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="clear2FAError()">{{ t('Clear') }}</v-btn>
          <v-btn variant="text" @click="cancel2FA()">{{ t('Cancel') }}</v-btn>
          <v-btn color="primary" @click="verify2FA()" :loading="verifying2FA">{{ t('Verify') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </div>
</template>

<script setup lang="ts">
import LoginBackground from '@/assets/images/LoginBackground.jpg';
import sampleAudio from '@/assets/audio/sample.ogg';
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import SuperUser from '@/interfaces/SuperUser';
import SuperUserService from '@/services/SuperUserService';
import { useAppStore } from '@/stores/app';
import { useSuperUserStore } from '@/stores/superUser';
import { useUserStore } from '@/stores/user';
import Language from "@/utilities/Language";
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { langsEnum } from '../enumerators/enums';
import SicknessNatureService from '../services/SicknessNatureService';
import type { VForm } from 'vuetify/components';

const { t, locale } = useI18n();
const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();
const superUserStore = useSuperUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const form = ref<VForm | null>(null);
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const errored = ref(false);
const loggingIn = ref(false);
const errorMSG = ref('');
const langs = Language.langs;

// 2FA state
const show2FADialog = ref(false);
const totpCode = ref('');
const totpError = ref(false);
const totpErrorMessage = ref('');
const verifying2FA = ref(false);
const userId = ref(0);

const LoginBackgroundSrc = computed(() => LoginBackground);
const LoginAudioSrc = computed(() => sampleAudio);
const logo = computed(() => new URL('@/static/PranicHealingLogo.png', import.meta.url).href);

async function formSubmit() {
  errored.value = false;
  const validationResult = await form.value?.validate();
  if (validationResult && !validationResult.valid) {
    errored.value = true;
    errorMSG.value = t('Field_Required');
    return;
  }

  loggingIn.value = true;
  try {
    // Use raw axios call to handle different response structures
    const response = await SuperUserService.authenticateRaw(username.value, password.value);
    
    // Check if 2FA is required
    if (response && response.requires2FA) {
      show2FADialog.value = true;
      userId.value = response.userId || 0;
      return;
    }
    
    // Handle full authentication response
    if (response && response.user && response.token) {
      const superUser: SuperUser = response.user;
      appStore.setIsToolBarVisible(true);
      appStore.setSuperUser(superUser);
      appStore.setLocale(locale.value);
      userStore.setUser(superUser);
      superUserStore.setSuperUser(superUser);

      const activeLang: langsEnum = Language.getActiveLang(locale.value);
      await SicknessNatureService.populateSickNatures(activeLang);

      router.push('/admin/Dashboard').catch(console.log);
    } else {
      errored.value = true;
      errorMSG.value = t('Incorrect_UserName_Password');
    }
  } catch (error: unknown) {
    const msg: string = error instanceof Error ? error.message : String(error);
    if (msg.startsWith('401')) {
      errored.value = true;
      errorMSG.value = t('Incorrect_UserName_Password');
    } else if (msg.startsWith('580')) {
      errorMSG.value = t('License_Expired_Contact_US');
      errored.value = true;
      router.push('/admin/license').catch(console.error);
    } else {
      errorMSG.value = msg;
      errored.value = true;
      showMsgBox('Login Error', `Error occurred while authenticating user, ${msg}`);
    }
  } finally {
    loggingIn.value = false;
  }
}

async function verify2FA() {
  if (!totpCode.value) {
    totpError.value = true;
    totpErrorMessage.value = t('Field_Required');
    return;
  }

  verifying2FA.value = true;
  totpError.value = false;
  
  try {
    const response = await SuperUserService.verifyTOTPForLogin(userId.value, totpCode.value);
    
    if (response && response.token && response.user) {
      // Successful 2FA verification
      appStore.setIsToolBarVisible(true);
      appStore.setSuperUser(response.user);
      appStore.setLocale(locale.value);
      userStore.setUser(response.user);
      superUserStore.setSuperUser(response.user);

      const activeLang: langsEnum = Language.getActiveLang(locale.value);
      await SicknessNatureService.populateSickNatures(activeLang);

      show2FADialog.value = false;
      totpCode.value = '';
      router.push('/admin/Dashboard').catch(console.log);
    } else {
      totpError.value = true;
      totpErrorMessage.value = t('Invalid_2FA_Code');
      // Keep dialog open to show error - DO NOT close dialog here
    }
  } catch (error: unknown) {
    // The error should now be a user-friendly message from the service layer
    let errorMessage = String(error);
    
    console.log('2FA Verification Error:', error);
    console.log('Extracted Error Message:', errorMessage);
    
    totpError.value = true;
    totpErrorMessage.value = errorMessage;
    // Keep dialog open to show error - DO NOT close dialog here
  } finally {
    verifying2FA.value = false;
  }
}

function cancel2FA() {
  show2FADialog.value = false;
  totpCode.value = '';
  totpError.value = false;
  totpErrorMessage.value = '';
}

function clear2FAError() {
  totpError.value = false;
  totpErrorMessage.value = '';
}

onMounted(() => {
  const initialLocale = Language.getActiveLang(navigator.language);
  locale.value = initialLocale;
  appStore.setLocale(initialLocale);
  errorMSG.value = t('Incorrect_UserName_Password');
});

watch(locale, (newLocale) => {
  appStore.setLocale(newLocale);
});
</script>

<style scoped>
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.login-bg-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.login-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.login-card {
  background: rgba(20, 12, 41, 0.92);
  border: 1px solid rgba(212, 175, 55, 0.22);
  backdrop-filter: blur(18px);
  max-width: 420px;
  width: 100%;
}

.login-card-header {
  background: linear-gradient(135deg, #6a1b9a 0%, #4527a0 100%);
  border-radius: 12px 12px 0 0;
}

@media (max-width: 480px) {
  .login-card {
    margin: 16px;
    width: calc(100% - 32px);
  }
}
</style>
