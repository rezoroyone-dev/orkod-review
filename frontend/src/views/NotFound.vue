<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <v-icon size="120" color="purple">mdi-alert-circle-outline</v-icon>
        <h1 class="text-h2 mt-4 mb-2">404</h1>
        <h2 class="text-h5 mb-4 text-grey">{{ t('Page_Not_Found') }}</h2>
        <p class="text-body-1 mb-6 text-grey-darken-1">
          {{ t('Page_Not_Found_Description') }}
        </p>
        <v-btn color="purple" size="large" @click="goHome">
          <v-icon left>mdi-home</v-icon>
          {{ t('Go_Home') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

function goHome() {
  router.push('/');
}
</script>
