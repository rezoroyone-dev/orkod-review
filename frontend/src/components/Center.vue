<template>
  <div>
    <v-row justify="center">
      <v-dialog v-model="dialog" persistent max-width="600px">
        <v-card class="CardTitleClass elevation-10">
          <v-form ref="form"  id="upload_form" enctype="multipart/form-data" action="#">
          <v-card-title class="headline">
            <span class="headline">{{ formTitle }}</span>
          </v-card-title>
          <v-container>
            
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-text-field :label="t('Center_Name')+'*'" required v-model="editedItem.name" />
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model="editedItem.managerName" :label="t('Manager_Name')"
                  :hint="t('Write_exact_Responsible_name')" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6" sm="6" md="4">
                <v-text-field :label="t('Phone_Number')+'*'" v-model="editedItem.phone" required
                  :rules="phoneRules" />
              </v-col>
              <v-col cols="6">
                <v-text-field :label="t('Email')+'*'" required v-model="editedItem.email"
                  :rules="(editedItem.email && editedItem.email.length > 0) ? emailRules : []" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field :label="t('City')+'*'" required v-model="editedItem.city" />
              </v-col>
              <v-col cols="12">
                <v-text-field :label="t('address')+'*'" required v-model="editedItem.address" />
              </v-col>
            </v-row>
            <small>{{ t("indicates_required_field") }}</small>
          </v-container>
          <v-card-actions>
            <v-spacer></v-spacer>
            <input hidden type="file" name="image_file" id="image_file" ref="image_file" @change="setCenterPhoto" />
            <v-btn @click="startUploadingImage()" color="primary" class="mx-2">
              <v-icon left>mdi-camera</v-icon>{{ t("AddImage") }}
            </v-btn>
            <v-btn color="primary" @click="save()">{{ t("Save") }}</v-btn>
            <v-btn color="primary" @click="dialog = false">{{ t("Cancel") }}</v-btn>
          </v-card-actions>
          </v-form>
        </v-card>
      </v-dialog>
      <v-dialog v-model="mapDialog" width="500">
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>
            Privacy Policy
          </v-card-title>
          <v-card-text>
            <h1>Our Map</h1>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="mapDialog = false">
              save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
    <br><br>
    <v-col cols="12">
      <v-card class="CardTitleClass elevation-10">
        <v-card-title>
          <v-btn color="purple" dark @click="showAddCenterDialog()">{{ t("Add_Center") }}</v-btn>
          <v-spacer></v-spacer>
        </v-card-title>
        <v-data-table :headers="headers" :items="centers" class="elevation-1">
          <template v-slot:[`item.centerManager`]="{ item }">
            {{ item.managerName }}
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-icon color="primary" @click="showEditDialog(item)" class="mb-2 mr-2">mdi-pencil</v-icon>
            <v-icon color="primary" @click="confirmDeleteCenter(item)" class="mb-2">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
    <br><br>
    <v-row>
      <div v-for="(item, i) in centers" :key="i" class="mx-12 mb-12">
        <v-card max-width="400">
          <v-img :src="item.photo ? getPhoto(item.photo) : defaultCenterPhoto" height="400" width="400" />
          <v-card-title>
            {{ item.name }}
          </v-card-title>

          <v-card-subtitle>
            {{ item.city }}
          </v-card-subtitle>

          <v-card-actions>
            <v-btn color="purple" variant="text" @click="ViewMapDialog = true">View Map</v-btn>
            <v-spacer></v-spacer>
            <v-btn icon @click="item.showDetails = !item.showDetails">
              <v-icon>{{ item.showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </v-card-actions>

          <div v-if="item.showDetails">
            <v-divider></v-divider>
            <v-card-text>
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="indigo">mdi-phone</v-icon>
                  </template>
                  <v-list-item-title> {{ item.phone }} </v-list-item-title>
                  <v-list-item-subtitle>{{ t("Work") }}</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-icon>mdi-message-text</v-icon>
                  </template>
                </v-list-item>

                <v-divider inset></v-divider>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="indigo">mdi-email</v-icon>
                  </template>
                  <v-list-item-title> {{ item.email }} </v-list-item-title>
                  <v-list-item-subtitle>{{ t("Work") }}</v-list-item-subtitle>
                </v-list-item>

                <v-divider inset></v-divider>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="indigo">mdi-map-marker</v-icon>
                  </template>
                  <v-list-item-title>{{ item.address }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.city }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </div>
        </v-card>
      </div>
      <v-dialog v-model="ViewMapDialog" width="500">
        <v-card>
          <v-card-title class="headline grey lighten-2" primary-title>
            Privacy Policy
          </v-card-title>

          <v-card-text>
            <h1>Our Map</h1>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="ViewMapDialog = false">
              Cancel
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
    <ProgressBar :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import AppConfigs from '@/AppConfigs';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useMessageBox } from '@/composables/useMessageBox';
import ConfirmDialog from "@/dialogs/ConfirmDialog.vue";
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from "@/dialogs/ProgressBar.vue";
import Center from "@/models/Center";
import CenterService from "@/services/CenterService";
import { useUserStore } from '@/stores/user';
import { getIndexOfArrayObject } from '@/utilities/MyUtilities';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();
const { confirmDialogContents, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();

const centers = ref<Center[]>([]);
const editedItem = ref<Center>(Center.getInitialCenter());
const editedIndex = ref(-1);
const imageFile = ref<File | undefined>(undefined);
const dialog = ref(false);
const loading = ref(false);
const mapDialog = ref(false);
const ViewMapDialog = ref(false);

const emailRules = [
  (v: string) => !!v || "E-mail is required",
  (v: string) => /^(\D)+(\w)*((\.(\w)+)?)+@(\D)+(\w)*((\.(\D)+(\w)*)+)?(\.)[a-z]{2,}$/.test(v) || "E-mail must be valid"
];
const phoneRules = [
  (v: string) => !!v || "Phone number is required",
  (v: string) => /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(v) || "Should be a valid phone number"
];

const headers = [
  { title: t("Center_Name"), key: 'name', align: 'start' as const, sortable: true },
  { title: t('Legal_Responsable'), key: 'managerName', align: 'start' as const, sortable: true },
  { title: t('Phone_Number'), key: 'phone', align: 'start' as const, sortable: true },
  { title: 'Email', key: 'email', align: 'start' as const, sortable: true },
  { title: t('Address'), key: 'address', align: 'start' as const, sortable: true },
  { title: t('City'), key: 'city', align: 'start' as const, sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
];

const defaultCenterPhoto = computed(() => AppConfigs.getServerURL() + "/public/images/Chakras.jpg");

function getPhoto(src: string): string {
  if (src) {
    if (!src.startsWith("/")) {
      src = "/" + src;
    }
    return AppConfigs.getServerURL() + src;
  } else {
    return "";
  }
}

const image_file = ref<HTMLInputElement | null>(null);
function startUploadingImage() {
  image_file.value?.click();
}

function setCenterPhoto(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    imageFile.value = target.files[0];
  }
}

const form = ref<HTMLFormElement | null>(null);
const formTitle = computed(() => editedIndex.value === -1 ? t('New_Center') : t('Edit_Center'));

async function save() {
  const validationResult = await form.value?.validate(); // Vuetify v-form validate method
  if (validationResult && !validationResult.valid) {
    return;
  }

  const center: Center = editedItem.value;
  try {
    if (center.name.trim() === "" || center.phone.trim() === "") {
      throw new Error(t("CenterName_Phonenumber_empty"));
    }

    const newFormData = new FormData();
    if (center.id !== undefined && center.id > 0) {
      newFormData.append("id", center.id.toString());
    }
    newFormData.append("name", center.name);
    newFormData.append("city", center.city);
    newFormData.append("managerName", center.managerName);
    newFormData.append("phone", center.phone);
    newFormData.append("email", center.email);
    newFormData.append("address", center.address);

    if (imageFile.value) {
      newFormData.append("photo", imageFile.value, imageFile.value.name);
    } else if (center.photo) {
      // If no new file, but existing photo, send its path
      newFormData.append("photo", center.photo);
    }

    loading.value = true;
    if (!userStore.superUser) throw new Error("User not authenticated");
    const savedCenter: Center = await CenterService.save(newFormData, center);

    if (editedIndex.value > -1) {
      const index = centers.value.findIndex(c => c.id === savedCenter.id);
      if (index !== -1) {
        centers.value[index] = savedCenter;
      }
    } else {
      centers.value.push(savedCenter);
    }
    closeDialog();
  } catch (error) {
    showMsgBox(t("Error_Saving_Center"), `${error}`);
  } finally {
    loading.value = false;
  }
}

function closeDialog() {
  dialog.value = false;
  setTimeout(() => {
    editedItem.value = Center.getInitialCenter();
    imageFile.value = undefined; // Clear selected file
    editedIndex.value = -1;
    form.value?.resetValidation(); // Reset form validation
  }, 300);
}

onMounted(async () => {
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    centers.value = await CenterService.getAllCenters();
  } catch (error) {
    showMsgBox("Error collecting all centers information", `${error}`);
  }
});

function confirmDeleteCenter(center: Center) {
  showConfirmDialog("Confirmation", t('ARE_YOU_SURE_DELETE'), () => deleteCenter(center), null);
}

async function deleteCenter(center: Center) {
  closeConfirmDialog();
  try {
    if (!userStore.superUser) throw new Error("User not authenticated");
    if (!center.id) return;
    await CenterService.deleteCenter(center.id);
    const index: number = getIndexOfArrayObject(centers.value, center);
    if (index !== -1) {
      centers.value.splice(index, 1);
    }
  } catch (error) {
    showMsgBox(t("Error_deleting_Center"), `${t("Failed_delete_center")}\n${error}`);
  }
}

function showEditDialog(item: Center) {
  editedIndex.value = getIndexOfArrayObject(centers.value, item);
  editedItem.value = Object.assign(Center.getInitialCenter(), item);
  dialog.value = true;
}

function showAddCenterDialog() {
  editedIndex.value = -1;
  editedItem.value = Center.getInitialCenter();
  dialog.value = true;
}
</script>

<style scoped>
.html {
  overflow: auto;
  background-color: blueviolet;
  color: aqua;
}

.headline {
  background-color: rgb(182, 36, 182);
  color: white;
}

.CardTitleClass {
  background-color: rgba(245, 238, 244, 0.829);
  padding: 10px;
}
</style>
