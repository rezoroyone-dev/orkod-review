<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12">
          <v-toolbar color="primary">
            <v-icon>mdi-account</v-icon>
            <v-toolbar-title class="font-weight-medium">{{ t('User_Profile') }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="isEditing = !isEditing">
              <v-icon v-if="isEditing">mdi-close</v-icon>
              <v-icon v-else>mdi-pencil</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text>
            <v-form>
              <v-text-field :disabled="!isEditing" prepend-icon="mdi-account" :label="t('Username')" type="text" v-model="username"></v-text-field>
              <v-text-field 
                :disabled="!isEditing" 
                prepend-icon="mdi-lock" 
                :label="t('Password')" 
                type="password" 
                v-model="password"
                :rules="passwordRules"
                :hint="t('Password_Requirements')"
                persistent-hint
              ></v-text-field>
              <!-- Password strength indicator -->
              <v-progress-linear
                v-if="password && isEditing"
                :model-value="getPasswordStrength(password).value"
                :color="getPasswordStrength(password).color"
                height="6"
                class="mb-4"
              />
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn :disabled="!isEditing" color="success" @click="save">
              {{ t('Save') }}
            </v-btn>
          </v-card-actions>
          <v-snackbar v-model="hasSaved" :timeout="5000" location="bottom left">
            {{ t('Profile_updated') }}
          </v-snackbar>
        </v-card>

        <!-- Two-Factor Authentication Section -->
        <v-card class="elevation-12 mt-4">
          <v-toolbar color="primary">
            <v-icon style="margin-left: 10px;">mdi-two-factor-authentication</v-icon>
            <v-toolbar-title class="font-weight-medium">{{ t('Two_Factor_Auth') }}</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <div v-if="totpEnabled">
              <v-alert type="success" variant="tonal" class="mb-4">
                {{ t('Two_Factor_Enabled') }}
              </v-alert>
              <v-btn color="error" @click="showDisable2FA = true">
                {{ t('Disable_2FA') }}
              </v-btn>
            </div>
            <div v-else>
              <p class="mb-4">{{ t('Two_Factor_Description') }}</p>
              <v-btn color="primary" @click="setup2FA" :loading="loading2FA">
                {{ t('Enable_2FA') }}
              </v-btn>
            </div>

            <!-- 2FA Setup Dialog -->
            <v-dialog v-model="showSetup2FA" max-width="500px">
              <v-card>
                <v-card-title>{{ t('Setup_2FA') }}</v-card-title>
                <v-card-text>
                  <p class="mb-4">{{ t('Scan_QR_Code') }}</p>
                  <v-img v-if="qrCodeUrl" :src="qrCodeUrl" max-height="300" contain class="mb-4"></v-img>
                  <v-text-field
                    :label="t('Enter_Code')"
                    v-model="totpCode"
                    prepend-icon="mdi-lock"
                    variant="outlined"
                  ></v-text-field>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="showSetup2FA = false">{{ t('Cancel') }}</v-btn>
                  <v-btn color="primary" @click="verify2FA" :loading="verifying2FA">{{ t('Verify') }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Disable 2FA Dialog -->
            <v-dialog v-model="showDisable2FA" max-width="500px">
              <v-card>
                <v-card-title>{{ t('Disable_2FA') }}</v-card-title>
                <v-card-text>
                  <v-text-field
                    :label="t('Password')"
                    v-model="disablePassword"
                    type="password"
                    prepend-icon="mdi-lock"
                    variant="outlined"
                    class="mb-2"
                  ></v-text-field>
                  <v-text-field
                    :label="t('TOTP_Code')"
                    v-model="disableCode"
                    prepend-icon="mdi-two-factor-authentication"
                    variant="outlined"
                  ></v-text-field>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="showDisable2FA = false">{{ t('Cancel') }}</v-btn>
                  <v-btn color="error" @click="disable2FA" :loading="disabling2FA">{{ t('Disable') }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </v-container>
</template>

<script setup lang="ts">
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import SuperUser from '@/interfaces/SuperUser';
import SuperUserService from '@/services/SuperUserService';
import TwoFactorService from '@/services/TwoFactorService';
import { useUserStore } from '@/stores/user';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const username = ref('');
const password = ref('');
const errored = ref(false);
const hasSaved = ref(false);
const isEditing = ref(false);

// Two-Factor Authentication state
const totpEnabled = ref(false);
const loading2FA = ref(false);
const verifying2FA = ref(false);
const disabling2FA = ref(false);
const showSetup2FA = ref(false);
const showDisable2FA = ref(false);
const qrCodeUrl = ref('');
const totpCode = ref('');
const disablePassword = ref('');
const disableCode = ref('');

// Password validation rules
const passwordRules = [
  (v: string) => !!v || t('Field_Required'),
  (v: string) => (v && v.length >= 8) || t('Password_Min_Length'),
  (v: string) => (v && v.length <= 60) || t('Password_Max_Length'),
  (v: string) => /[A-Z]/.test(v) || t('Password_Uppercase'),
  (v: string) => /[a-z]/.test(v) || t('Password_Lowercase'),
  (v: string) => /[0-9]/.test(v) || t('Password_Digit'),
  (v: string) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(v) || t('Password_Special'),
];

// Check password strength for visual feedback
function getPasswordStrength(pwd: string): { color: string; value: number; text: string } {
  if (!pwd) return { color: 'grey', value: 0, text: '' };
  
  let strength = 0;
  if (pwd.length >= 8) strength++;
  if (pwd.length >= 12) strength++;
  if (pwd.length >= 16) strength++;
  if (/[A-Z]/.test(pwd)) strength++;
  if (/[a-z]/.test(pwd)) strength++;
  if (/[0-9]/.test(pwd)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) strength++;
  
  if (strength <= 2) return { color: 'error', value: strength * 15, text: t('Password_Weak') };
  if (strength <= 4) return { color: 'warning', value: strength * 15, text: t('Password_Medium') };
  return { color: 'success', value: strength * 15, text: t('Password_Strong') };
}

async function save() {
  try {
    const updatedUser: SuperUser = {
      id: userStore.superUser?.id,
      userName: username.value,
      passWord: password.value
    };

    // The authUser is the currently logged in user from the store
    const authUser = userStore.superUser;
    if (!authUser) {
        showMsgBox("Error", "User not authenticated");
        return;
    }

    const newSuperUser: SuperUser = await SuperUserService.updateSuperUser(updatedUser);

    if (newSuperUser?.id !== -1) {
      userStore.setUser(newSuperUser);
      isEditing.value = false;
      hasSaved.value = true;
    } else {
      errored.value = true;
    }
  } catch (error: unknown) {
    showMsgBox("Profile update Error", `Error occurred while updating user profile information: ${String(error)}`);
  }
}

onMounted(() => {
  if (userStore.superUser) {
    username.value = userStore.superUser.userName;
    password.value = userStore.superUser.passWord;
    totpEnabled.value = userStore.superUser.totpEnabled || false;
  }
});

// Two-Factor Authentication functions
async function setup2FA() {
  loading2FA.value = true;
  try {
    const result = await TwoFactorService.setup();
    qrCodeUrl.value = result.qrCodeUrl;
    showSetup2FA.value = true;
  } catch (error: unknown) {
    // Handle error response format - extract message from HTTP response
    let errorMessage = String(error);
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      
      // Check for axios response format (error.response.data)
      if (errorObj.response && errorObj.response.data) {
        if (errorObj.response.data.error) {
          errorMessage = errorObj.response.data.error;
        } else if (errorObj.response.data.message) {
          errorMessage = errorObj.response.data.message;
        }
      }
      // Check for direct object properties
      else if (errorObj.error) {
        errorMessage = errorObj.error;
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
    }
    showMsgBox(t('Error'), `Failed to setup 2FA: ${errorMessage}`);
  } finally {
    loading2FA.value = false;
  }
}

async function verify2FA() {
  verifying2FA.value = true;
  try {
    await TwoFactorService.verify(totpCode.value);
    showSetup2FA.value = false;
    totpEnabled.value = true;
    totpCode.value = '';
    showMsgBox(t('Success'), t('Two_Factor_Enabled_Success'));
  } catch (error: unknown) {
    // Handle error response format - extract message from HTTP response
    let errorMessage = String(error);
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      
      // Check for axios response format (error.response.data)
      if (errorObj.response && errorObj.response.data) {
        if (errorObj.response.data.error) {
          errorMessage = errorObj.response.data.error;
        } else if (errorObj.response.data.message) {
          errorMessage = errorObj.response.data.message;
        }
      }
      // Check for direct object properties
      else if (errorObj.error) {
        errorMessage = errorObj.error;
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
    }
    showMsgBox(t('Error'), `Failed to verify 2FA: ${errorMessage}`);
  } finally {
    verifying2FA.value = false;
  }
}

async function disable2FA() {
  disabling2FA.value = true;
  try {
    await TwoFactorService.disable(disableCode.value, disablePassword.value);
    showDisable2FA.value = false;
    totpEnabled.value = false;
    disableCode.value = '';
    disablePassword.value = '';
    showMsgBox(t('Success'), t('Two_Factor_Disabled_Success'));
  } catch (error: unknown) {
    // Handle error response format - extract message from HTTP response
    let errorMessage = String(error);
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      
      // Check for axios response format (error.response.data)
      if (errorObj.response && errorObj.response.data) {
        if (errorObj.response.data.error) {
          errorMessage = errorObj.response.data.error;
        } else if (errorObj.response.data.message) {
          errorMessage = errorObj.response.data.message;
        }
      }
      // Check for direct object properties
      else if (errorObj.error) {
        errorMessage = errorObj.error;
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
    }
    showMsgBox(t('Error'), `Failed to disable 2FA: ${errorMessage}`);
  } finally {
    disabling2FA.value = false;
  }
}
</script>
