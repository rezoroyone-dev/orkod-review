<template>
  <v-dialog v-model="showMe" hide-overlay persistent width="300">
    <v-card color="primary" dark>
      <v-card-text>
        Please wait...
        <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
        <v-progress-circular :size="70" :width="7" color="purple" indeterminate></v-progress-circular>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'

  interface Props {
    loading?: boolean;
  }

  const props = defineProps<Props>();

  const showMe = ref(false);

  watch(() => props.loading, (newValue) => {
    if (newValue === true) {
      setTimeout(() => {
        if (props.loading === true) { // Check again in case loading changed back
          showMe.value = true;
        }
      }, 500);
    } else {
      showMe.value = false;
    }
  });
</script>

<style lang="css" scoped>
</style>