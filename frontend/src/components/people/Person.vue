<template>
  <div id="container">
    <v-card color="primary">
      <v-card-actions>
        <v-menu location="right" open-on-hover>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" color="blue-darken-2" icon>
              <v-icon size="large">mdi-account-circle</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="(action, index) in actions" :key="index" @click="action.click">
              <template v-slot:prepend>
                <v-icon :color="action.color">{{ action.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ action.tooltip }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-card-title primary-title v-if="(person && person.firstName) || (formData && formData.firstName)" class="mx-5">
          <h4 v-if="isFormReadOnly">{{ person?.firstName }} {{ person?.lastName }}</h4>
          <h4 v-else>{{ formData.firstName }} {{ formData.lastName }}</h4>
        </v-card-title>
        <v-avatar rounded width="25" height="25" />
        <v-spacer />
        <v-card-title v-if="person">
          <h4>{{ $t('Folder_Number') }} {{ person.folderNumber ? person.folderNumber : person?.id }}</h4>
        </v-card-title>
      </v-card-actions>
    </v-card>

    <v-form ref="form">
      <v-row justify="space-between">
        <v-col cols="12" md="5">
          <v-text-field v-model="formData.firstName" :readonly="isFormReadOnly" :rules="nameRules" :counter="25"
            :label="$t('First_Name')" required prepend-icon="folder" class="full-width" />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field v-model="formData.lastName" :readonly="isFormReadOnly" :rules="nameRules" :counter="25"
            :label="$t('Last_Name')" required prepend-icon="edit" class="full-width" />
        </v-col>
      </v-row>
      <v-row justify="space-between">
        <v-col cols="12" md="5">
          <v-text-field v-model="formData.phone" :readonly="isFormReadOnly" :rules="phoneRules"
            :label="$t('Phone_Number')" required prepend-icon="phone" class="full-width" />
        </v-col>
        <v-col cols="12" md="5">
          <v-select :label="$t('Blood_Group')" v-model="formData.bloodGroup" :disabled="isFormReadOnly"
            :items="bloodGroups"
            :rules="(formData.bloodGroup && formData.bloodGroup.length > 0) ? bloodGroupRules : []"
            prepend-icon="folder" class="full-width" />
        </v-col>
      </v-row>
      <v-row justify="space-between">
        <v-col cols="12" md="5">
          <v-text-field v-model="formData.email" :readonly="isFormReadOnly"
            :rules="(formData.email && formData.email.length > 0) ? emailRules : []" :label="$t('Email')"
            prepend-icon="mail" class="full-width" />
        </v-col>
        <v-col cols="12" md="5">
          <div style="display: flex; align-items: flex-start;" class="full-width">
            <v-btn
              icon
              @click="modal = true"
              :disabled="isFormReadOnly"
              style="margin-right:5px;margin-top:15px;"
            >
              <v-icon>mdi-calendar</v-icon>
            </v-btn>
            <div style="flex: 1;">
              <v-text-field
                :label="$t('Birth_Date')"
                :readonly="isFormReadOnly"
                v-model="textBirthDateValue"
                :rules="(formData.birthDate && formData.birthDate.length > 0) ? birthDateRules : []"
                placeholder="DD-MM-YYYY"
                name="textBirthDate"
                id="textBirthDate"
                class="full-width"
              />
            </div>
          </div>
          <v-dialog
            ref="dialogStartDate"
            v-model="modal"
            persistent
            width="290px"
          >
            <v-date-picker
              v-model="datePickerDate"
              scrollable
              landscape
              :locale="$i18n.locale"
            >
              <template v-slot:actions>
                <v-spacer></v-spacer>
                <v-btn text color="primary" @click="modal = false">{{ $t('Cancel') }}</v-btn>
                <v-btn
                  text
                  color="primary"
                  @click="confirmDateSelection"
                >OK</v-btn>
              </template>
            </v-date-picker>
          </v-dialog>
        </v-col>
      </v-row>
      <v-row justify="space-between">
        <v-col cols="12" md="5">
          <v-select :label="$t('Civil_State')" v-model="formData.civilState" :disabled="isFormReadOnly"
            :items="civilStates" :item-title="'text'" :item-value="'value'"
            :rules="(formData.civilState && formData.civilState.length > 0) ? civilStateRules : []"
            prepend-icon="folder" class="full-width" />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field :label="$t('City')" v-model="formData.city" :readonly="isFormReadOnly" :counter="25"
            prepend-icon="folder" class="full-width" />
        </v-col>
      </v-row>

      <v-row justify="space-between">
        <v-col cols="12" md="5">
          <v-textarea variant="outlined" rows="2" :label="$t('Address')" v-model="formData.address"
            :readonly="isFormReadOnly" prepend-icon="folder" class="full-width" />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field :label="$t('Weight')" v-model="formData.weight" :readonly="isFormReadOnly"
            prepend-icon="mdi-scale" class="full-width" />
          <v-text-field :label="$t('Height')" v-model="formData.height" :readonly="isFormReadOnly"
            prepend-icon="mdi-human-male-height" class="full-width" />
        </v-col>
      </v-row>
      <br />
      <v-row v-show="!isFormReadOnly">
        <v-col cols="12" md="4">
          <v-btn  @click="submit" color="primary">
            OK
            <v-icon end>mdi-check-circle</v-icon>
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn @click="cancel">
            <v-icon start>mdi-block-helper</v-icon>
            {{ $t('Cancel') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
    <!--
                <v-form name="formReadOnly" v-show="isFormReadOnly">
                    <v-flex xs12 md12>
                        <v-layout row wrap justify-space-between>
                            <v-flex md5>
                                <v-text-field v-bind:value="person.firstName" :readonly="true" :label="$t('First_Name')"
                                    prepend-icon="folder" />
                            </v-flex>
                            <v-flex md5>
                                <v-text-field v-bind:value="person.lastName" :readonly="true" :label="$t('Last_Name')"
                                    prepend-icon="edit" />
                            </v-flex>
                        </v-layout>
                        <v-layout row wrap justify-space-between>
                            <v-flex md5>
                                <v-text-field v-bind:value="person.phone" :readonly="true" :label="$t('Phone_Number')"
                                    prepend-icon="phone" />
                            </v-flex>
                            <v-flex md5>
                                <v-text-field v-bind:value="person.email" :readonly="true" :label="$t('Email')"
                                    prepend-icon="mail" />
                            </v-flex>
                        </v-layout>
                        <v-layout row wrap justify-space-between>
                            <v-flex md5>
                                <v-text-field v-bind:value="person.city" :readonly="true" :label="$t('City')"
                                    prepend-icon="folder" />
                            </v-flex>
                            <v-flex md5>
                                <v-text-field v-bind:value="person.civilState" :readonly="true"
                                    :label="$t('Civil_State')" prepend-icon="folder" />
                            </v-flex>
                        </v-layout>

                        <v-layout row wrap justify-space-between>
                            <v-flex md5 lg5>
                                <v-text-field
                                    v-bind:value="formData.birthDate|dateFormater('YYYY-MM-DDTHH:mm:ssZ','DD-MM-YYYY')"
                                    :readonly="true" :label="$t('Birth_Date')" prepend-icon="event" />
                            </v-flex>
                            <v-flex md5 lg5>
                                <v-textarea outline label="Address" v-bind:value="person.address" :readonly="true"
                                    prepend-icon="folder" />
                            </v-flex>
                        </v-layout>
                    </v-flex>
                </v-form>
    -->
    <!-- </v-flex> -->
    <progressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
  </div>
  <!-- </v-main> -->
</template>

<script setup lang="ts">
import AppConfigs from "@/AppConfigs";
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useMessageBox } from '@/composables/useMessageBox';
import ConfirmDialog from "@/dialogs/ConfirmDialog.vue";
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from '@/dialogs/ProgressBar.vue';
import PersonInterface from '@/interfaces/Person';
import AuthenticationService from '@/services/AuthenticationService';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { isValidDate } from "@/utilities/dateTime";
import axios from "axios";
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// Types
import type { VForm } from 'vuetify/components';

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();
const { confirmDialogContents, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const loading = ref(false);
const errored = ref(false);
const isFormReadOnly = ref(true);
const modal = ref(false);
const textBirthDateValue = ref('');
const datePickerDate = ref('');
const formData = ref<PersonInterface>({
  id: undefined,
  firstName: '',
  lastName: '',
  phone: '',
  birthDate: '',
  email: '',
  civilState: '',
  city: '',
  address: '',
  folderNumber: undefined
});
const nameRules = [(v: string) => !!v || 'Item is required'];
const bloodGroupRules = [(v: string) => !!v || 'Item is required'];
const civilStateRules = [(v: string) => !!v || 'Item is required'];
const emailRules = [
  (v: string) => !!v || "E-mail is required",
  (v: string) => /^(\D)+(\w)*((\.(\w)+)?)+@(\D)+(\w)*((\.(\D)+(\w)*)+)?(\.)[a-z]{2,}$/.test(v) || "E-mail must be valid"
];
const phoneRules = [
  (v: string) => !!v || "Phone number is required",
  (v: string) => /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(v) || "Should be a valid phone number"
];
const birthDateRules = [(v: string) => (!!v && isValidDate(v, 'DD-MM-YYYY')) || 'Date is invalid'];
const civilStates = ref([
  { value: "civil.single", text: "Single" },
  { value: "civil.married", text: "Married" },
  { value: "civil.divorced", text: "Divorced" },
  { value: "civil.widower", text: "Widower" },
]);
const bloodGroups = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
const actions = [{
  icon: "mdi-plus",
  tooltip: t("add"),
  color: "blue",
  disabled: false,
  click: buttonAddClicked
},
{
  icon: "mdi-pencil",
  tooltip: t("edit"),
  color: "green",
  disabled: false,
  click: buttonEditClicked
},
{
  icon: "mdi-delete",
  tooltip: t("delete"),
  color: "red",
  disabled: false,
  click: confirmDeletePerson
}
];

const person = computed(() => appStore.activePerson);
const form = ref<VForm | null>(null);

function buttonAddClicked() {
  clearFormFields();
  formData.value.id = undefined;
  isFormReadOnly.value = false;
}

function buttonEditClicked() {
  isFormReadOnly.value = false;
}

function confirmDeletePerson() {
  if (formData.value.id === undefined || formData.value.id <= 0) {
    return;
  }
  showConfirmDialog("Confirmation", t('ARE_YOU_SURE_DELETE'), deleteActivePerson, null)
}

async function submit() {
  try {
    const validationResult = await form.value?.validate();
    if (validationResult && validationResult.valid) {
      loading.value = true;
      let url: string = AppConfigs.getServerURL();
      let dataToSend: Partial<PersonInterface> = {};

      // For new records, only send the required fields
      if (formData.value.id != undefined) {
        // Update existing record - send all data
        url += "/people/" + formData.value.id;
        dataToSend = { ...formData.value };
      } else {
        // Create new record - only send populated fields
        url += "/people";
        dataToSend = {
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          phone: formData.value.phone,
          birthDate: formData.value.birthDate || "",
          email: formData.value.email || "",
          civilState: formData.value.civilState || "",
          city: formData.value.city || "",
          address: formData.value.address || "",
          bloodGroup: formData.value.bloodGroup || "",
          weight: formData.value.weight || "",
          height: formData.value.height || ""
        };
      }

      const config = AuthenticationService.getAxiosConfig(userStore.superUser)
      axios.post(url, dataToSend, config)
        .then(response => {
          isFormReadOnly.value = true;
          let savedPerson = response.data;
          appStore.setActivePerson(savedPerson);
        })
        .catch((error: any) => {
          console.error('Server error:', error);

          // Extract the actual error message from the server response
          let errorMessage = "An error occurred while saving the person";
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as any;
            if (axiosError.response?.data?.error) {
              errorMessage = axiosError.response.data.error;
            } else if (axiosError.response?.data?.message) {
              errorMessage = axiosError.response.data.message;
            } else if (axiosError.response?.status === 409) {
              errorMessage = "A person with this name already exists";
            }
          }

          showMsgBox("Warning", errorMessage);
        })
        .finally(() => {
          loading.value = false
        });
    }
  } catch (error) {
    console.error('Error in submit function:', error);
    showMsgBox("Error", "An error occurred while submitting the form");
    loading.value = false;
  }
}

function deleteActivePerson(): void {
  closeConfirmDialog()
  loading.value = true;
  let url = AppConfigs.getServerURL() + "/people/" + formData.value.id;
  const config = AuthenticationService.getAxiosConfig(userStore.superUser)
  axios.delete(url, config)
    .then((response) => {
      if (response.status === 200) {
        isFormReadOnly.value = true;
        appStore.clearActivePerson();
        clearFormFields();
      }
    })
    .catch(error => {
      errored.value = true;
      if (error.response.status === 409) {
        showMsgBox("Warning", error + "\nYou can not delete this object as it has related entries in other database tables,409 SQL error")
      } else {
        showMsgBox("Warning:Failed to delete object", error)
      }
    })
    .finally(() => {
      loading.value = false
    });
}

function cancel() {
  if (person.value) {
    updateFormData(person.value);
  }
  isFormReadOnly.value = true;
}

function updateFormData(activePerson: PersonInterface) {
  if (activePerson != undefined && activePerson !== null) {
    formData.value = JSON.parse(JSON.stringify(activePerson))
    // Update the text field value when form data changes
    if (activePerson.birthDate) {
      textBirthDateValue.value = activePerson.birthDate;
    }
  }
}

function clearFormFields() {
  try {
    if (form.value) {
      (form.value as { reset: () => void }).reset()
    }
  } catch (error) {
    console.error('Error in clearFormFields function:', error);
  }
}

function translateContents() {
  civilStates.value.forEach((item) => {
    item.text = t(item.value)
  })
}

function confirmDateSelection() {
  if (datePickerDate.value) {
    // Format the date as DD-MM-YYYY
    const date = new Date(datePickerDate.value);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    formData.value.birthDate = formattedDate;
    textBirthDateValue.value = formattedDate;
  }
  modal.value = false;
}



onMounted(() => {
  if (person.value) {
    updateFormData(person.value);
  }
  translateContents();
});

watch(person, (newVal) => {
  if (newVal) {
    updateFormData(newVal);
    isFormReadOnly.value = true;
  }
});

watch(() => appStore.locale, () => {
  translateContents();
});

// Watch for manual changes to the birth date text field
watch(textBirthDateValue, (newValue) => {
  if (newValue !== formData.value.birthDate) {
    formData.value.birthDate = newValue;
    // Also update the date picker when manual input changes
    if (newValue && isValidDate(newValue, 'DD-MM-YYYY')) {
      const [day, month, year] = newValue.split('-').map(Number);
      datePickerDate.value = new Date(year, month - 1, day).toISOString().split('T')[0];
    }
  }
});

</script>
<style scoped>
form {
  margin: 10px;
  padding: 10px;
  /* background-color: rgb(142, 167, 163); */
  /*top right bottom left*/
}

/* .container {
    background-color: white;
} */

.v-speed-dial {
  position: relative;
  margin-top: 5px;
  top: 0;
}

.full-width {
  width: 100%;
}
</style>
