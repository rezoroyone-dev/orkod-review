<template>
  <v-container class="py-16">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="4" class="pa-8">
          <v-card-title class="text-h4 font-weight-bold text-center mb-6">
            {{ t('Contact_Us') }}
          </v-card-title>
          
          <v-form ref="form" v-model="valid" @submit.prevent="submit">
            <v-text-field
              v-model="contactForm.name"
              :label="t('Name')"
              :rules="[v => !!v || t('Name_is_required')]"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="contactForm.email"
              :label="t('Email')"
              :rules="[
                v => !!v || t('Email_is_required'),
                v => /.+@.+\..+/.test(v) || t('Email_must_be_valid')
              ]"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="contactForm.subject"
              :label="t('Contact_Subject')"
              :rules="[v => !!v || t('Subject_is_required')]"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>

            <v-textarea
              v-model="contactForm.message"
              :label="t('Message')"
              :rules="[v => !!v || t('Message_is_required')]"
              required
              variant="outlined"
              rows="5"
              class="mb-6"
            ></v-textarea>

            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
              :disabled="!valid"
            >
              {{ t('Send_Message') }}
            </v-btn>
          </v-form>

          <v-alert
            v-if="success"
            type="success"
            class="mt-6"
            closable
            @click:close="success = false"
          >
            {{ t('Message_sent_successfully') }}
          </v-alert>

          <v-alert
            v-if="error"
            type="error"
            class="mt-6"
            closable
            @click:close="error = ''"
          >
            {{ error }}
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import ContactMessageService from '@/services/ContactMessageService';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const form = ref<any>(null);
const valid = ref(false);
const loading = ref(false);
const success = ref(false);
const error = ref<string | null>(null);

const contactForm = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
});

async function submit() {
  const { valid: isFormValid } = await form.value.validate();
  if (!isFormValid) return;

  loading.value = true;
  error.value = null;
  success.value = false;

  try {
    await ContactMessageService.saveContactMessage(contactForm);
    success.value = true;
    form.value.reset();
  } catch (err: any) {
    error.value = err.message || 'An error occurred while sending your message.';
  } finally {
    loading.value = false;
  }
}
</script>
