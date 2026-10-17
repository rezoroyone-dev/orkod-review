<template>
  <v-container fluid>
    <v-row class="align-center mb-4">
      <v-col cols="12" sm="8">
        <v-toolbar-title class="font-weight-bold">
          <v-icon class="mr-1" color="primary">mdi-hand-heart-outline</v-icon>
          {{ t('Donations_Admin_Title') }}
        </v-toolbar-title>
      </v-col>
      <v-col cols="12" sm="4" class="text-sm-end">
        <v-switch
          v-model="feed.enabled"
          color="primary"
          hide-details
          inset
          :label="feed.enabled ? t('Donations_Admin_Visible') : t('Donations_Admin_Hidden')"
          @update:model-value="toggleVisible"
        />
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <v-empty-state
      v-else-if="feed.donations.length === 0"
      icon="mdi-hand-heart-outline"
      :text="t('Donations_Admin_Empty')"
    />

    <v-card v-else rounded="lg" elevation="2">
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t('Donations_Form_Name') }}</th>
            <th>{{ t('Donations_Form_Amount') }}</th>
            <th>{{ t('Donations_Form_Message') }}</th>
            <th>{{ t('Donations_Admin_Public') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in feed.donations" :key="d.id">
            <td>{{ d.id }}</td>
            <td class="font-weight-medium">{{ d.name }}</td>
            <td>{{ t('Currency') }}{{ d.amount }}</td>
            <td class="text-truncate" style="max-width: 240px">{{ d.message || '—' }}</td>
            <td>
              <v-chip
                :color="d.isPublic ? 'primary' : 'default'"
                size="small"
                variant="tonal"
              >
                {{ d.isPublic ? t('Donations_Public') : t('Donations_Private') }}
              </v-chip>
            </td>
            <td class="text-end">
              <v-btn
                v-if="!d.isApproved"
                size="small"
                color="primary"
                variant="tonal"
                class="mr-1"
                @click="approve(d)"
              >
                {{ t('Donations_Admin_Approve') }}
              </v-btn>
              <v-btn size="small" color="error" variant="text" @click="remove(d)">
                <v-icon size="16">mdi-delete-outline</v-icon>
                {{ t('Donations_Admin_Delete') }}
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DonationService, { Donation, DonationFeed } from '@/services/DonationService';

const { t } = useI18n();

const loading = ref(true);
const errorMsg = ref('');
const feed = reactive<DonationFeed>({ enabled: false, donations: [] });

async function load() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const data = await DonationService.adminListDonations();
    feed.enabled = data.enabled;
    feed.donations = data.donations;
  } catch {
    errorMsg.value = t('Donations_Form_Error');
  } finally {
    loading.value = false;
  }
}

async function approve(d: Donation) {
  if (typeof d.id !== 'number') return;
  try {
    await DonationService.adminApproveDonation(d.id);
    d.isApproved = true;
  } catch {
    errorMsg.value = t('Donations_Form_Error');
  }
}

async function remove(d: Donation) {
  if (typeof d.id !== 'number') return;
  try {
    await DonationService.adminDeleteDonation(d.id);
    feed.donations = feed.donations.filter((x) => x.id !== d.id);
  } catch {
    errorMsg.value = t('Donations_Form_Error');
  }
}

async function toggleVisible(visible: boolean) {
  try {
    await DonationService.setDonationsVisible(visible);
  } catch {
    feed.enabled = !visible;
    errorMsg.value = t('Donations_Form_Error');
  }
}

onMounted(load);
</script>