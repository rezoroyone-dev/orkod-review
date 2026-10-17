<template>
    <div class="text-center">
        <v-dialog :model-value="msgBox.show" width="500" persistent>
            <v-card>
                <v-card-title class="headline primary light-blue">
                    {{msgBox.title}}
                </v-card-title>

                <v-card-text>
                  <v-textarea :model-value="msgBox.message" auto-grow flat readonly variant="solo" />
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" dark @click="close">
                        OK
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
export interface MsgBox {
  show: boolean;
  title: string;
  message: string; // Changed from body to message to match useMessageBox
}

defineProps<{
  msgBox: MsgBox;
  close: () => void;
}>();
</script>

<style scoped>
.v-textarea{
  font-size: large;
}
</style>
