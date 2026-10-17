<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-toolbar color="primary" dark>
            <v-toolbar-title>{{ t('Audit_Logs') }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="fetchLogs">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="headers"
            :items="logs"
            :loading="loading"
            class="elevation-1"
          >
            <template #[`item.createdAt`]="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <template #[`item.actions`]="{ item }">
              <v-icon
                size="small"
                class="me-2"
                @click="viewDetails(item)"
                color="info"
              >
                mdi-information
              </v-icon>
              <v-icon
                size="small"
                @click="confirmDelete(item)"
                color="error"
              >
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Details Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card v-if="selectedLog">
        <v-card-title class="text-h5 bg-primary text-white">
          {{ t('Log_Details') }}
        </v-card-title>
        <v-card-text class="pt-4">
          <div class="mb-2"><strong>{{ t('User') }}:</strong> {{ selectedLog.userName }} (ID: {{ selectedLog.userID }})</div>
          <div class="mb-2"><strong>{{ t('Action') }}:</strong> {{ selectedLog.action }}</div>
          <div class="mb-2"><strong>{{ t('Target') }}:</strong> {{ selectedLog.target }} (ID: {{ selectedLog.targetID }})</div>
          <div class="mb-4"><strong>{{ t('Date') }}:</strong> {{ formatDate(selectedLog.createdAt) }}</div>
          <v-divider class="mb-4"></v-divider>
          <div class="text-subtitle-1 mb-1"><strong>{{ t('Details') }}:</strong></div>
          <div class="text-body-2 whitespace-pre-wrap bg-grey-lighten-4 pa-3 rounded" v-html="sanitizeHtml(selectedLog.details || '')"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="dialog = false">
            {{ t('Close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">{{ t('Delete_Log') }}</v-card-title>
        <v-card-text>{{ t('Are_you_sure_you_want_to_delete_this_log_entry') }}?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false">{{ t('Cancel') }}</v-btn>
          <v-btn color="error" variant="text" @click="deleteLog">{{ t('Delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import DOMPurify from 'dompurify';
import AuditLogService, { AuditLog } from '@/services/AuditLogService';
import { useUserStore } from '@/stores/user';

// Sanitize HTML to prevent XSS attacks
const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

const { t } = useI18n();
const userStore = useUserStore();

const logs = ref<AuditLog[]>([]);
const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const selectedLog = ref<AuditLog | null>(null);

const headers = [
  { title: t('Date'), key: 'createdAt', sortable: true },
  { title: t('User'), key: 'userName', sortable: true },
  { title: t('Action'), key: 'action', sortable: true },
  { title: t('Target'), key: 'target', sortable: true },
  { title: t('Actions'), key: 'actions', sortable: false },
];

async function fetchLogs() {
  loading.value = true;
  try {
    logs.value = await AuditLogService.getAuditLogs();
  } catch (error) {
    console.error('Failed to fetch audit logs', error);
  } finally {
    loading.value = false;
  }
}

function viewDetails(log: AuditLog) {
  selectedLog.value = log;
  dialog.value = true;
}

function confirmDelete(log: AuditLog) {
  selectedLog.value = log;
  deleteDialog.value = true;
}

async function deleteLog() {
  if (!selectedLog.value || !selectedLog.value.id) return;
  
  try {
    await AuditLogService.deleteAuditLog(selectedLog.value.id);
    logs.value = logs.value.filter(l => l.id !== selectedLog.value?.id);
    deleteDialog.value = false;
  } catch (error) {
    console.error('Failed to delete audit log', error);
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
</style>
