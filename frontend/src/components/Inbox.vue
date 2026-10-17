<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-toolbar color="primary" dark>
            <v-toolbar-title>{{ t('Inbox') }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="fetchMessages">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="headers"
            :items="messages"
            :loading="loading"
            class="elevation-1"
          >
            <template #[`item.createdAt`]="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <template #[`item.read`]="{ item }">
              <v-chip
                :color="item.read ? 'success' : 'warning'"
                size="small"
              >
                {{ item.read ? t('Read') : t('Unread') }}
              </v-chip>
            </template>

            <template #[`item.actions`]="{ item }">
              <v-icon
                size="small"
                class="me-2"
                @click="viewMessage(item)"
                color="info"
              >
                mdi-eye
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

    <!-- View Message Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card v-if="selectedMessage">
        <v-card-title class="text-h5 bg-primary text-white">
          {{ selectedMessage.subject }}
        </v-card-title>
        <v-card-text class="pt-4">
          <div class="mb-2"><strong>{{ t('From') }}:</strong> {{ selectedMessage.name }} ({{ selectedMessage.email }})</div>
          <div class="mb-4"><strong>{{ t('Date') }}:</strong> {{ formatDate(selectedMessage.createdAt) }}</div>
          <v-divider class="mb-4"></v-divider>
          <div class="text-body-1 whitespace-pre-wrap">{{ selectedMessage.message }}</div>
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
        <v-card-title class="text-h5">{{ t('Delete_Message') }}</v-card-title>
        <v-card-text>{{ t('Are_you_sure_you_want_to_delete_this_message') }}?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false">{{ t('Cancel') }}</v-btn>
          <v-btn color="error" variant="text" @click="deleteMessage">{{ t('Delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactMessageService, { ContactMessage } from '@/services/ContactMessageService';
import { useUserStore } from '@/stores/user';

const { t } = useI18n();
const userStore = useUserStore();

const messages = ref<ContactMessage[]>([]);
const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const selectedMessage = ref<ContactMessage | null>(null);

const headers = [
  { title: t('Date'), key: 'createdAt', sortable: true },
  { title: t('Name'), key: 'name', sortable: true },
  { title: t('Email'), key: 'email', sortable: true },
  { title: t('Contact_Subject'), key: 'subject', sortable: true },
  { title: t('Status'), key: 'read', sortable: true },
  { title: t('Actions'), key: 'actions', sortable: false },
];

async function fetchMessages() {
  if (!userStore.superUser) return;
  loading.value = true;
  try {
    messages.value = await ContactMessageService.getContactMessages();
  } catch (error) {
    console.error('Failed to fetch messages', error);
  } finally {
    loading.value = false;
  }
}

async function viewMessage(message: ContactMessage) {
  selectedMessage.value = message;
  dialog.value = true;
  
  if (!message.read && userStore.superUser && message.id) {
    try {
      await ContactMessageService.markAsRead( message.id);
      message.read = true;
    } catch (error) {
      console.error('Failed to mark message as read', error);
    }
  }
}

function confirmDelete(message: ContactMessage) {
  selectedMessage.value = message;
  deleteDialog.value = true;
}

async function deleteMessage() {
  if (!selectedMessage.value || !selectedMessage.value.id || !userStore.superUser) return;
  
  try {
    await ContactMessageService.deleteContactMessage( selectedMessage.value.id);
    messages.value = messages.value.filter(m => m.id !== selectedMessage.value?.id);
    deleteDialog.value = false;
  } catch (error) {
    console.error('Failed to delete message', error);
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

onMounted(() => {
  fetchMessages();
});
</script>

<style scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
</style>
