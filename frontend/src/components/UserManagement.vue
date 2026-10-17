<template>
  <v-container>
    <v-col cols="12">
      <v-card class="elevation-10">
        <v-card-title class="d-flex align-center flex-wrap gap-2 pa-4">
          <v-icon class="mr-2" color="primary">mdi-account-cog</v-icon>
          <span class="text-h6">{{ t('User_Management') }}</span>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-account-plus">
            {{ t('Add_User') }}
          </v-btn>
        </v-card-title>

        <!-- Desktop table (hidden on xs) -->
        <v-data-table
          :headers="translatedHeaders"
          :items="users"
          class="elevation-1 d-none d-sm-block"
          :mobile-breakpoint="0"
        >
          <template v-slot:[`item.role`]="{ item }">
            <div class="d-flex flex-wrap gap-1">
              <v-chip v-for="r in item.roles" :key="r.id" color="primary" size="small" class="ma-1">
                {{ r.name }}
              </v-chip>
              <v-chip v-if="!item.roles || item.roles.length === 0" color="grey" size="small">{{ t('No_Role') }}</v-chip>
            </div>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <div class="d-flex justify-start">
              <v-btn icon="mdi-pencil" color="primary" variant="text" size="small" class="mr-1" @click="editUser(item)" />
              <v-btn icon="mdi-delete" color="error" variant="text" size="small" @click="confirmDeleteUser(item)" />
            </div>
          </template>
        </v-data-table>

        <!-- Mobile card list (visible only on xs) -->
        <div class="d-sm-none">
          <v-progress-linear v-if="loading" indeterminate color="primary" />
          <v-list v-if="users.length > 0" lines="two" class="pa-0">
            <template v-for="(user, index) in users" :key="user.id ?? index">
              <v-list-item class="px-4 py-3">
                <template #prepend>
                  <v-avatar :color="avatarColor(user.userName)" size="40" class="mr-3">
                    <span class="text-caption font-weight-bold text-white">{{ initials(user.userName) }}</span>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ user.firstName }} {{ user.lastName }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  @{{ user.userName }}
                </v-list-item-subtitle>

                <div class="d-flex flex-wrap gap-1 mt-1">
                  <v-chip v-for="r in user.roles" :key="r.id" color="primary" size="x-small">
                    {{ r.name }}
                  </v-chip>
                  <v-chip v-if="!user.roles || user.roles.length === 0" color="grey" size="x-small">
                    {{ t('No_Role') }}
                  </v-chip>
                </div>

                <template #append>
                  <div class="d-flex flex-column gap-1">
                    <v-btn icon="mdi-pencil" color="primary" variant="tonal" size="x-small" @click="editUser(user)" />
                    <v-btn icon="mdi-delete" color="error" variant="tonal" size="x-small" @click="confirmDeleteUser(user)" />
                  </div>
                </template>
              </v-list-item>
              <v-divider v-if="index < users.length - 1" />
            </template>
          </v-list>
          <div v-else-if="!loading" class="text-center pa-6 text-medium-emphasis">
            <v-icon size="48" color="grey-lighten-2">mdi-account-off</v-icon>
            <p class="mt-2 text-body-2">{{ t('No_users_found') }}</p>
          </div>
        </div>
      </v-card>
    </v-col>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="pa-4">
          <v-icon class="mr-2" color="primary">{{ editedIndex === -1 ? 'mdi-account-plus' : 'mdi-account-edit' }}</v-icon>
          {{ editedIndex === -1 ? t('New_User') : t('Edit_User') }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="editedItem.userName"
            :label="t('Username')"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="editedItem.passWord"
            :label="t('Password')"
            type="password"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            density="compact"
            class="mb-3"
            :rules="passwordRules"
            :hint="t('Password_Requirements')"
            persistent-hint
          />
          <!-- Password strength indicator -->
          <v-progress-linear
            v-if="editedItem.passWord"
            :model-value="getPasswordStrength(editedItem.passWord).value"
            :color="getPasswordStrength(editedItem.passWord).color"
            height="6"
            class="mb-4"
          />
          <v-select
            v-model="editedItem.roleIDs"
            :items="roles"
            item-title="name"
            item-value="id"
            :label="t('Role')"
            prepend-inner-icon="mdi-shield-account"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="close">{{ t('Cancel') }}</v-btn>
          <v-btn color="primary" variant="tonal" @click="save" :loading="loading" :disabled="!isFormValid">{{ t('Save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ProgressBar :loading="loading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    <ConfirmDialog :confirmDialogContents="confirmDialogContents" :close="closeConfirmDialog" />
    <FindPersonDialog
      :showDialog="showFindPersonDialog"
      @personSelected="onPersonSelected"
      @close="showFindPersonDialog = false"
    />
  </v-container>
</template>

<script setup lang="ts">
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useMessageBox } from '@/composables/useMessageBox';
import ConfirmDialog from '@/dialogs/ConfirmDialog.vue';
import FindPersonDialog from '@/dialogs/FindPersonDialog.vue';
import MessageBoxDialog from '@/dialogs/MessageBoxDialog.vue';
import ProgressBar from '@/dialogs/ProgressBar.vue';
import Person from '@/interfaces/Person';
import SuperUser from '@/interfaces/SuperUser';
import RoleService, { Role } from '@/services/RoleService';
import UserService from '@/services/UserService';
import { useUserStore } from '@/stores/user';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const userStore = useUserStore();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();
const { confirmDialogContents, showConfirmDialog, closeConfirmDialog } = useConfirmDialog();

const users = ref<SuperUser[]>([]);
const roles = ref<Role[]>([]);
const loading = ref(false);
const dialog = ref(false);
const showFindPersonDialog = ref(false);
const editedIndex = ref(-1);
const editedItem = ref<SuperUser>({ userName: '', passWord: '', firstName: '', lastName: '', roleIDs: [], personID: undefined } as SuperUser);

// Password validation rules
const passwordRules = [
  (v: string) => !!v || t('Field_Required'),
  (v: string) => (v && v.length >= 8) || t('Password_Min_Length'),
  (v: string) => (v && v.length <= 60) || t('Password_Max_Length'),
  (v: string) => /[A-Z]/.test(v) || t('Password_Uppercase'),
  (v: string) => /[a-z]/.test(v) || t('Password_Lowercase'),
  (v: string) => /[0-9]/.test(v) || t('Password_Digit'),
  (v: string) => /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(v) || t('Password_Special'),
];

// Check password strength for visual feedback
function getPasswordStrength(password: string): { color: string; value: number; text: string; strength: number } {
  if (!password) return { color: 'grey', value: 0, text: '', strength: 0 };
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) strength++;
  
  if (strength <= 2) return { color: 'error', value: strength * 15, text: t('Password_Weak'), strength };
  if (strength < 5) return { color: 'warning', value: strength * 15, text: t('Password_Medium'), strength };
  return { color: 'success', value: 100, text: t('Password_Strong'), strength };
}

const headers = [
  { title: 'Username',   key: 'userName' },
  { title: 'First_Name', key: 'firstName' },
  { title: 'Last_Name',  key: 'lastName' },
  { title: 'Role',       key: 'role' },
  { title: 'actions',    key: 'actions', sortable: false },
];

const translatedHeaders = computed(() => headers.map(h => ({ ...h, title: t(h.title) })));

// Check if form is valid (all required fields filled and password meets requirements)
const isFormValid = computed(() => {
  if (!editedItem.value.userName || editedItem.value.userName.trim() === '') return false;
  if (!editedItem.value.passWord || getPasswordStrength(editedItem.value.passWord).strength < 5) return false;
  if (!editedItem.value.roleIDs || editedItem.value.roleIDs.length === 0) return false;
  return true;
});

// ── Avatar helpers ────────────────────────────────────────────────────────────

function initials(name: string): string {
  if (!name) return '?';
  return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'blue-darken-2', 'green-darken-2', 'purple-darken-2',
  'orange-darken-2', 'teal-darken-2', 'indigo-darken-2',
  'red-darken-2', 'cyan-darken-2',
];

function avatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Data loading ──────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    if (!userStore.superUser) return;
    users.value = await UserService.getUsers();
    roles.value = await RoleService.getRoles();
  } catch (e) {
    showMsgBox(t("Error"), `${t("Failed_to_load_users")}: ${e}`);
  } finally {
    loading.value = false;
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

function openCreateDialog() {
  showFindPersonDialog.value = true;
}

function onPersonSelected(person: Person) {
  showFindPersonDialog.value = false;
  editedIndex.value = -1;
  editedItem.value = {
    userName: '',
    passWord: '',
    firstName: person.firstName,
    lastName: person.lastName,
    roleIDs: [],
    personID: person.id
  } as SuperUser;
  dialog.value = true;
}

function editUser(user: SuperUser) {
  editedIndex.value = users.value.indexOf(user);
  editedItem.value = { ...user, roleIDs: user.roleIDs || [], passWord: '' };
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
      await UserService.updateUser( editedItem.value);
    } else {
      await UserService.createUser( editedItem.value);
    }
    await loadData();
    close();
  } catch (e) {
    showMsgBox(t("Error"), `${t("Failed_to_save_user")}: ${e}`);
  } finally {
    loading.value = false;
  }
}

function confirmDeleteUser(user: SuperUser) {
  showConfirmDialog(t("Confirmation"), t("ARE_YOU_SURE_DELETE_USER"), () => deleteUser(user), null);
}

async function deleteUser(user: SuperUser) {
  closeConfirmDialog();
  if (!user.id || !userStore.superUser) return;
  loading.value = true;
  try {
    await UserService.deleteUser( user.id);
    await loadData();
  } catch (e) {
    showMsgBox(t("Error"), `${t("Failed_to_delete_user")}: ${e}`);
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped>
</style>
