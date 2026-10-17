<template>
  <v-container>
    <v-col cols="12">
      <v-card class="CardTitleClass elevation-10">
        <v-card-title>
          <h4>{{ t('Role_Management') }}</h4>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="openCreateDialog">
            <v-icon left>mdi-plus</v-icon>
            {{ t('Add_Role') }}
          </v-btn>
        </v-card-title>
        <v-data-table :headers="translatedHeaders" :items="roles" class="elevation-1">
          <template v-slot:[`item.permissions`]="{ item }">
            <v-chip v-for="p in item.permissions" :key="p.id" size="small" class="ma-1">
              {{ p.name }}
            </v-chip>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <div class="d-flex justify-start">
              <v-icon
                color="primary"
                class="mr-2"
                @click="editRole(item)"
                :disabled="item.name === 'admin'"
              >
                mdi-pencil
              </v-icon>
              <v-icon
                color="error"
                @click="confirmDeleteRole(item)"
                :disabled="item.name === 'admin'"
              >
                mdi-delete
              </v-icon>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-col>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>{{ editedIndex === -1 ? t('New_Role') : t('Edit_Role') }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="editedItem.name" :label="t('Role_Name')"></v-text-field>
          <v-select
            v-model="editedItem.permissions"
            :items="allPermissions"
            item-title="name"
            item-value="id"
            :label="t('Permissions')"
            multiple
            chips
            return-object
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" variant="text" @click="close">{{ t('Cancel') }}</v-btn>
          <v-btn color="blue darken-1" variant="text" @click="save">{{ t('Save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ProgressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RoleService, { Role, Permission } from '@/services/RoleService';
import { useUserStore } from '@/stores/user';
import { useMessageBox } from '@/composables/useMessageBox';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import ProgressBar from '@/dialogs/ProgressBar.vue';
import MessageBoxDialog from '@/dialogs/MessageBoxDialog.vue';
import ConfirmDialog from '@/dialogs/ConfirmDialog.vue';

const { t } = useI18n();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();
const { confirmDialogContents, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();

const roles = ref<Role[]>([]);
const allPermissions = ref<Permission[]>([]);
const loading = ref(false);
const dialog = ref(false);
const editedIndex = ref(-1);
const editedItem = ref<Role>({ name: '', permissions: [] });

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Permissions', key: 'permissions' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const translatedHeaders = computed(() => headers.map(h => ({ ...h, title: t(h.title) })));

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    if (!userStore.superUser) return;
    roles.value = await RoleService.getRoles();
    allPermissions.value = await RoleService.getPermissions();
  } catch (e) {
    showMsgBox("Error", `Failed to load roles: ${e}`);
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  editedIndex.value = -1;
  editedItem.value = { name: '', permissions: [] };
  dialog.value = true;
}

function editRole(role: Role) {
  editedIndex.value = roles.value.indexOf(role);
  editedItem.value = JSON.parse(JSON.stringify(role));
  dialog.value = true;
}

function close() {
  dialog.value = false;
}

async function save() {
  loading.value = true;
  try {
    if (!userStore.superUser) return;
    if (editedIndex.value > -1) {
      await RoleService.updateRole( editedItem.value);
    } else {
      await RoleService.createRole( editedItem.value);
    }
    await loadData();
    close();
  } catch (e) {
    showMsgBox("Error", `Failed to save role: ${e}`);
  } finally {
    loading.value = false;
  }
}

function confirmDeleteRole(role: Role) {
  showConfirmDialog(t("Confirmation"), t("ARE_YOU_SURE_DELETE_ROLE"), () => deleteRole(role), null);
}

async function deleteRole(role: Role) {
  closeConfirmDialog();
  if (!role.id || !userStore.superUser) return;
  loading.value = true;
  try {
    await RoleService.deleteRole( role.id);
    await loadData();
  } catch (e) {
    showMsgBox("Error", `Failed to delete role: ${e}`);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.CardTitleClass {
  background-color: rgba(79, 138, 24, 0.623);
}
</style>
