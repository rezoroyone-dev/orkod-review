<template>
  <div>
          <v-alert v-model="showAlert" type="success" closable dense color="green" elevation="10" variant="tonal" transition="fab-transition">
      {{successMsg}}
    </v-alert>
    <div>
      <v-card>
        <v-card-title>
          <v-text-field v-model="search" append-inner-icon="mdi-magnify" :label="t('search')" single-line hide-details />

          <v-btn @click="showNewMeditationDialog = true" color="primary" class="mx-2">
            <v-icon start>mdi-podcast</v-icon>{{t("Add_Meditation")}}
          </v-btn>
          <v-spacer />

          <!-- <div v-show="showVideoIframe" width="600" height="345"> -->
          <v-dialog v-model="showVideoIframe" persistent nudge-width="600px" max-width="600px" width="600" height="345">
            <v-card>
              <v-card-text>
                <youtube-iframe v-show="activeMeditation && activeMeditation.isLink" :video-id="videoId" :player-vars="{ autoplay: 1 }" @ready="ready" @playing="playing" player-width="600" player-height="500">
                </youtube-iframe>

                <div v-if="activeMeditation && !activeMeditation.isLink && activeMeditation.path != ''">
                  <video autoplay controls loop width="100%" height="100%" crossorigin="use-credentials">
                    <source :src="activeMeditation.path" /> <!-- http://localhost/mediaFiles/test.mp4 type="video/mp4" or type="audio/mp3" etc... -->
                    Your browser does not support the video tag.
                  </video>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="close()">{{t("Close")}}</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <!-- </div> -->

          <!-- <v-card>
          <v-card-title > -->
          <!-- <v-spacer></v-spacer> -->
          <!-- <v-spacer></v-spacer> -->
          <v-form ref="form" id="upload_form" name="upload_form" enctype="multipart/form-data" method="post" action="#">
            <v-dialog v-model="showNewMeditationDialog" max-width="500px">
              <v-card>
                <v-card-title>
                  {{ activeMeditation.id === undefined ? t("New_Meditation") : t("Edit_Meditation")}}
                </v-card-title>
                <v-card-text>
                  <v-text-field v-model="activeMeditation.name" prepend-icon="folder" :label="t('Name')" :rules="nameRules" />
                  <v-text-field v-model="activeMeditation.comment" prepend-icon="note" :label="t('comment')" />
                  <v-row align="center">
                    <v-container fluid>

                      <v-radio-group v-model="activeMeditation.isLink" :mandatory="false">
                        <div class="d-flex align-center" v-show="(activeMeditation.id == undefined || activeMeditation.medType == 0)">
                          <v-radio class="shrink mr-2 mt-0" :value="true" />
                          <v-text-field v-model="activeMeditation.path" :disabled="!activeMeditation.isLink" :label="t('Insert_Meditaion_link')" prepend-icon="mdi-youtube" />
                        </div>
                        <div class="d-flex align-center" v-show="activeMeditation.id == undefined">
                          <v-radio class="shrink mr-2 mt-0" :value="false" />
                          <v-file-input v-model="meditationFile" :disabled="activeMeditation.isLink" accept="audio/*,video/*" :label="t('Upload_Meditation_file')" />
                        </div>
                      </v-radio-group>

                    </v-container>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="save()">{{t("Save")}}</v-btn>
                  <v-btn color="primary" @click="close()">{{t("Cancel")}}</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-form>
          <!-- </v-card-title>
          </v-card>-->
        </v-card-title>
        <br><br>
        <v-data-table :headers="headers" :items="meditations" :search="search">
          <template v-slot:[`item.name`]="props">
            <v-chip v-if="props.item.medType == 0" :href="props.item.path" target="_blank" light> {{props.item.name}}</v-chip>
            <v-chip v-if="props.item.medType != 0" light> {{props.item.name}}</v-chip>
          </template>

          <template v-slot:[`item.type`]="{ item }">
            <div>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-icon color="purple" class="mr-5" v-bind="props">{{item.icon}}</v-icon>
                </template>
                <span>{{item.tooltip}}</span>
              </v-tooltip>
            </div>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <div class="d-flex">
              <v-icon color="purple" class="mx-0" @click="play(item)">mdi-play</v-icon> <!-- :disabled="!item.canPlay" -->
              <v-icon color="blue" class="mr-1" @click="edit(item)">mdi-pen</v-icon>
              <v-icon color="red" @click="confirmDeletion(item)">mdi-delete</v-icon>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <ProgressBar :loading="loading" />

  </div>
</template>



<script setup lang="ts">
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useMessageBox } from '@/composables/useMessageBox';
import ConfirmDialog from "@/dialogs/ConfirmDialog.vue";
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import ProgressBar from '@/dialogs/ProgressBar.vue';
import Meditation, { playStatus } from "@/models/Meditation";
import MeditationService from '@/services/MeditationService';
import { useUserStore } from '@/stores/user';
import { getIndexOfArrayObject } from '@/utilities/MyUtilities';
import { YoutubeIframe } from '@vue-youtube/component';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VForm } from 'vuetify/components';
import AppConfigs from '../AppConfigs';

const { t } = useI18n();
// Pinia Store
const userStore = useUserStore();

// Reactive State
const successMsg = ref('');
const showAlert = ref(false);
const formData = ref({} as FormData);
const meditations = ref<Meditation[]>([]);
const meditationFile = ref({} as File);
const showVideoIframe = ref(false);
const loading = ref(false);
const showNewMeditationDialog = ref(false);
const search = ref('');
const activeMeditation = ref(new Meditation({ id: undefined, name: "", path: "", comment: "" }));
const editedItem = ref(Meditation.getInitialMeditation());
const player = ref<Record<string, unknown>>({});
const videoId = ref('0');

// Composables
const { confirmDialogContents, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

// Template Ref
const form = ref<VForm | null>(null);
const uploadForm = ref<HTMLFormElement | null>(null);
// const mediaFile = ref<HTMLInputElement | null>(null);


// Other variables
const nameRules = [
  (v: string) => !!v || t("Name_is_required"),
  (v: string) => (v && v.length <= 25) || t("Name_must_not_exceed_25_characters")
];
const headers = [
  {
    title: t('Meditation_Name'),
    align: 'start' as const,
    sortable: true,
    key: 'name',
  },
  { title: t('Type'), key: 'type' },
  { title: t('Comment'), key: 'comment', sortable: false },
  { title: t('Actions'), key: 'actions', sortable: false, align: 'start' as const },
];

// Computed Properties
// const audioSrc = computed(() => {
//   return new URL('@/assets/audio/sample.ogg', import.meta.url).href;
// });

// Methods
const confirmDeletion = (item: Meditation) => {
  showConfirmDialog("Confirmation", t('ARE_YOU_SURE_DELETE').toString(), () => deleteMeditation(item), null);
};

const deleteMeditation = async (item: Meditation) => {
  closeConfirmDialog();
  if (!item || !item.id || item.id <= 0) {
    return;
  }
  const index = getIndexOfArrayObject(meditations.value, item);
  if (index <= -1) {
    showMsgBox("Error", "Unable to get itemument index");
    return;
  }
  try {
    loading.value = true;
    if (userStore.superUser) {
        await MeditationService.deleteMeditation(item.id);
        meditations.value.splice(index, 1);
        successMsg.value = "Meditation deleted";
        showAlert.value = true;
    }
  } catch (error: unknown) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const edit = (item: Meditation) => {
  activeMeditation.value = Object.assign(Meditation.getInitialMeditation(), item);
  showNewMeditationDialog.value = true;
};

const getYoutubeVideoId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

// const getYoutubeVideoTime = (url: string): string => {
//   const regExp = /[?&]t=([^&]+)/;
//   const match = url.match(regExp);
//   return match ? match[1] : '';
// };

// ... (rest of the script)

const play = (item: Meditation) => {
  activeMeditation.value = Object.assign(Meditation.getInitialMeditation(), item);
  try {
    if (!activeMeditation.value.isLink) { // File
      if (activeMeditation.value.path.trim() == "") {
        throw new Error(t("Invalid_File_path"));
      }
      const linkPrefix = "uploadedFiles/";
      if (activeMeditation.value.path.startsWith(linkPrefix)) {
        activeMeditation.value.path = activeMeditation.value.path.split(linkPrefix)[1];
      }
      // Add /api prefix for mediaFiles (e.g., mediaFiles/2026/2/26/file.mp4)
      // Note: AppConfigs.getServerURL() already includes /api
      const mediaFilesPrefix = "mediaFiles/";
      if (activeMeditation.value.path.startsWith(mediaFilesPrefix)) {
        activeMeditation.value.path = AppConfigs.getServerURL() + "/" + activeMeditation.value.path;
      }
    } else { // Link
      let url = activeMeditation.value.path.trim();
      videoId.value = getYoutubeVideoId(url);
      // let startTime = getYoutubeVideoTime(url);
    }
    showVideoIframe.value = true;
    item.status = playStatus.PLAYING;
  } catch (error: unknown) {
    showMsgBox("Error while playing Meditation", "Failed to play meditation\n" + String(error));
  }
};

// const pause = (item: Meditation) => {
//   player.value.pauseVideo();
//   item.status = playStatus.PAUSED;
// };

const stop = (item: Meditation) => {
  if (item.isLink && (player.value as any).stopVideo != undefined) {
    (player.value as any).stopVideo();
  }
  showVideoIframe.value = false;
  if (item != undefined) {
    item.status = playStatus.STOPPED;
  }
  activeMeditation.value.status = playStatus.STOPPED;
  activeMeditation.value = Meditation.getInitialMeditation();
};

const save = async () => {
  const validationResult = await form.value?.validate();
  if (validationResult && !validationResult.valid) {
    return;
  }
  let meditation: Meditation = activeMeditation.value;
  try {
    if (meditation.name.trim() == "") {
      throw new Error("Meditation Name can't be empty");
    }
    if (activeMeditation.value.isLink) {
      if (meditation.path.trim() == "") {
        throw new Error("Meditation path can't be empty");
      }
    }
    formData.value = getDefaultFormData();
    if (!activeMeditation.value.isLink) {
      setMeditationFile();
    }
    loading.value = true;
    if (userStore.superUser) {
        let savedMeditation: Meditation = await MeditationService.save(formData.value, meditation);
        const editedIndex = getIndexOfArrayObject(meditations.value, savedMeditation);
        if (editedIndex > -1) {
          meditations.value[editedIndex] = savedMeditation;
        } else {
          meditations.value.push(savedMeditation);
        }
        successMsg.value = "Meditation saved successfully!!!";
        showAlert.value = true;
        close();
    }
  } catch (error: unknown) {
    showMsgBox("Error Saving Meditation", String(error));
  }
 finally {
    loading.value = false;
  }
};

const close = () => {
  stop(activeMeditation.value);
  showNewMeditationDialog.value = false;
  activeMeditation.value = Meditation.getInitialMeditation();
  editedItem.value.clear();
  formData.value = getDefaultFormData();
  meditationFile.value = {} as File;
};

// const startUploadingMedia = () => {
//   mediaFile.value?.click();
// };

const getDefaultFormData = (): FormData => {
  if (!uploadForm.value) {
    return new FormData();
  }
  return new FormData(uploadForm.value);
};

const setMeditationFile = () => {
  if (meditationFile.value == undefined || meditationFile.value.name == undefined || meditationFile.value.name == "") {
    if (activeMeditation.value.id == undefined || activeMeditation.value.id == -1) {
      throw new Error("No meditation file selected\nYou need to select a meditation file to upload");
    }
    return;
  }
  // let fileName: string = meditationFile.value.name;
  formData.value.append('files', meditationFile.value, meditationFile.value.name);
};

const ready = (event: { target: unknown }) => {
  player.value = event.target as Record<string, unknown>;
};

const playing = () => {
  // The player is playing a video.
};

// Lifecycle Hooks
onMounted(async () => {
  formData.value = getDefaultFormData();
  try {
    if (userStore.superUser) {
        meditations.value = await MeditationService.getAllMeditations();
    }
  } catch (error: unknown) {
    console.error(error);
  }
});

// Watchers
watch(() => userStore.superUser, async (newUser) => {
    if (newUser) {
        try {
            meditations.value = await MeditationService.getAllMeditations();
        } catch (error: unknown) {
            console.error(error);
        }
    }
}, { deep: true });
</script>
