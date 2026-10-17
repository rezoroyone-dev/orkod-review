<template>
  <div>
    <v-dialog :model-value="props.confirmDialogContents.show" width="500" persistent>
      <v-card>
        <v-card-title class="headline primary light-blue" primary-title>
          {{props.confirmDialogContents.title}}
        </v-card-title>

        <v-card-text>
          <v-textarea :model-value="props.confirmDialogContents.body" auto-grow flat readonly solo aria-multiline />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" dark @click="props.confirmDialogContents.callBackFunction(props.confirmDialogContents.callBackArgument)">
            OK
          </v-btn>
          <v-btn color="primary" dark @click="props.close()">
            {{$t("Cancel")}}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ConfirmDialogOptions } from '@/composables/useConfirmDialog';

const props = defineProps<{
  confirmDialogContents: ConfirmDialogOptions;
  close: () => void;
}>();
</script>

<style scoped>
  .v-textarea {
    font-size: large;
  }
</style>
