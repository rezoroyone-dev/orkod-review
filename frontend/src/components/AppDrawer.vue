<template>
  <v-navigation-drawer
    app
    id="appDrawer"
    :rail="mini"
    v-model="drawerIsVisible"
    width="240"
  >
    <!-- Brand header -->
	<!--
    <div class="drawer-header d-flex align-center px-3 py-3">
      <v-avatar size="32" color="primary" class="mr-2">
        <v-img :src="logo" contain />
      </v-avatar>
      <span v-if="!mini" class="text-subtitle-2 font-weight-bold text-primary">Orkod Center</span>
    </div>
    <v-divider />
-->
    <div class="drawer-menu--scroll">
      <v-list nav density="compact" class="pt-2">

        <!-- ── Group: Main ── -->
        <v-list-subheader v-if="!mini" class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mt-1">
          {{ t('Main') }}
        </v-list-subheader>

        <v-list-item
          v-for="item in mainMenuItems"
          :key="item.name"
          :to="{ name: item.name }"
          :prepend-icon="item.icon"
          :title="mini ? '' : t(item.title)"
          rounded="lg"
          base-color="primary"
          class="mb-1"
        >
          <template v-if="mini" #prepend>
            <v-tooltip :text="t(item.title)" location="right">
              <template #activator="{ props }">
                <v-icon v-bind="props">{{ item.icon }}</v-icon>
              </template>
            </v-tooltip>
          </template>
        </v-list-item>

        <!-- ── Group: Patients & Scheduling ── -->
        <template v-if="patientMenuItems.length > 0">
          <v-divider class="my-2" />
          <v-list-subheader v-if="!mini" class="text-uppercase text-caption font-weight-bold text-grey-darken-1">
            {{ t('Patients') }}
          </v-list-subheader>

          <v-list-item
            v-for="item in patientMenuItems"
            :key="item.name"
            :to="{ name: item.name }"
            :prepend-icon="item.icon"
            :title="mini ? '' : t(item.title)"
            rounded="lg"
            base-color="primary"
            class="mb-1"
          >
            <template v-if="mini" #prepend>
              <v-tooltip :text="t(item.title)" location="right">
                <template #activator="{ props }">
                  <v-icon v-bind="props">{{ item.icon }}</v-icon>
                </template>
              </v-tooltip>
            </template>
          </v-list-item>
        </template>

        <!-- ── Group: Finance ── -->
        <template v-if="financeMenuItems.length > 0">
          <v-divider class="my-2" />
          <v-list-subheader v-if="!mini" class="text-uppercase text-caption font-weight-bold text-grey-darken-1">
            {{ t('Finance') }}
          </v-list-subheader>

          <v-list-item
            v-for="item in financeMenuItems"
            :key="item.name"
            :to="{ name: item.name }"
            :prepend-icon="item.icon"
            :title="mini ? '' : t(item.title)"
            rounded="lg"
            base-color="primary"
            class="mb-1"
          >
            <template v-if="mini" #prepend>
              <v-tooltip :text="t(item.title)" location="right">
                <template #activator="{ props }">
                  <v-icon v-bind="props">{{ item.icon }}</v-icon>
                </template>
              </v-tooltip>
            </template>
          </v-list-item>
        </template>

        <!-- ── Group: Communication ── -->
        <template v-if="commMenuItems.length > 0">
          <v-divider class="my-2" />
          <v-list-subheader v-if="!mini" class="text-uppercase text-caption font-weight-bold text-grey-darken-1">
            {{ t('Communication') }}
          </v-list-subheader>

          <v-list-item
            v-for="item in commMenuItems"
            :key="item.name"
            :to="{ name: item.name }"
            :prepend-icon="item.icon"
            :title="mini ? '' : t(item.title)"
            rounded="lg"
            base-color="primary"
            class="mb-1"
          >
            <template v-if="mini" #prepend>
              <v-tooltip :text="t(item.title)" location="right">
                <template #activator="{ props }">
                  <v-icon v-bind="props">{{ item.icon }}</v-icon>
                </template>
              </v-tooltip>
            </template>
          </v-list-item>
        </template>

        <!-- ── Group: Administration (admin-only) ── -->
        <template v-if="adminMenuItems.length > 0">
          <v-divider class="my-2" />
          <v-list-subheader v-if="!mini" class="text-uppercase text-caption font-weight-bold text-grey-darken-1">
            {{ t('Administration') }}
          </v-list-subheader>

          <v-list-item
            v-for="item in adminMenuItems"
            :key="item.name"
            :to="item.href ? undefined : { name: item.name }"
            :href="item.href"
            :target="item.target"
            :prepend-icon="item.icon"
            :title="mini ? '' : t(item.title)"
            rounded="lg"
            base-color="primary"
            class="mb-1"
          >
            <template v-if="mini" #prepend>
              <v-tooltip :text="t(item.title)" location="right">
                <template #activator="{ props }">
                  <v-icon v-bind="props">{{ item.icon }}</v-icon>
                </template>
              </v-tooltip>
            </template>
          </v-list-item>
        </template>

      </v-list>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const appStore = useAppStore();
const userStore = useUserStore();

const mini = ref(true);

// Logo is currently not used but kept for future use
// const logo = computed(() => new URL('@/static/PranicHealingLogo.png', import.meta.url).href);

const isLoggedIn = computed(() => {
  const u = userStore.superUser;
  return u !== undefined && u.id !== undefined && u.id !== -1;
});

const drawerIsVisible = computed({
  get: () => appStore.isDrawerVisible && isLoggedIn.value,
  set: (val: boolean) => appStore.setIsDrawerVisible(val),
});

// Use the user store's permission helpers
const hasPermission = (permission: string) => userStore.hasPermission(permission);
const hasAnyPermission = (permissions: string[]) => userStore.hasAnyPermission(permissions);

// Determine if the current user is an admin (has all permissions)
const isAdmin = computed(() => userStore.hasRole('admin'));

// Determine if the current user is a healer
const isHealer = computed(() => userStore.hasRole('healer'));

// Debug helper — log role info in dev
if (import.meta.env.DEV) {
  console.log('[AppDrawer] superUser:', userStore.superUser);
  console.log('[AppDrawer] isAdmin:', isAdmin.value, '| isHealer:', isHealer.value);
  console.log('[AppDrawer] permissions:', userStore.permissions);
}

// ── Menu definitions with permission-based visibility ──────────────────────────

// Always visible to all authenticated users
const mainMenuItems = computed(() => {
  const items = [
    { title: 'Dashboard',     icon: 'mdi-view-dashboard',  name: 'Dashboard', permission: undefined },
    { title: 'Scheduler',     icon: 'mdi-calendar-clock',  name: 'Scheduler', permission: 'manage_schedules' },
    { title: 'My_Availability', icon: 'mdi-clock-check',   name: 'Availability', permission: 'set_availability' },
  ];
  // Filter by permission - items without permission are visible to all authenticated users
  return items.filter(item => !item.permission || hasPermission(item.permission));
});

// Visible based on specific permissions
const patientMenuItems = computed(() => {
  const items = [
    { title: 'People',      icon: 'mdi-account-multiple', name: 'People', permission: undefined }, // All authenticated
    { title: 'Healers',     icon: 'mdi-account-tie',      name: 'healers', permission: 'manage_healers' },
    { title: 'Center',      icon: 'mdi-office-building',  name: 'Center', permission: 'manage_centers' },
    { title: 'Meditations', icon: 'mdi-meditation',       name: 'Meditations', permission: 'manage_meditations' },
  ];
  return items.filter(item => !item.permission || hasPermission(item.permission));
});

// Finance — requires view_reports permission
const financeMenuItems = computed(() => {
  const items = [
    { title: 'Bill',       icon: 'mdi-cash-multiple', name: 'bill', permission: 'manage_schedules' },
    { title: 'Reporting',  icon: 'mdi-chart-bar',     name: 'report', permission: 'view_reports' },
  ];
  return items.filter(item => hasPermission(item.permission));
});

// Communication — based on permissions
const commMenuItems = computed(() => {
  const items = [
    { title: 'Inbox', icon: 'mdi-email-outline', name: 'Inbox', permission: 'manage_inbox' },
    { title: 'Sms',   icon: 'mdi-message-text',  name: 'sms', permission: undefined }, // All authenticated
  ];
  return items.filter(item => !item.permission || hasPermission(item.permission));
});

// Administration — requires specific permissions
const adminMenuItems = computed(() => {
  const items = [
    { title: 'User_Management',  icon: 'mdi-account-cog',    name: 'Users', permission: 'manage_users' },
    { title: 'Role_Management',  icon: 'mdi-shield-account', name: 'Roles', permission: 'manage_roles' },
    { title: 'Audit_Logs',       icon: 'mdi-history',        name: 'AuditLogs', permission: 'view_audit_logs' },
    { title: 'License',          icon: 'mdi-license',        name: 'license', permission: undefined }, // All authenticated
    { title: 'ToolBox',          icon: 'mdi-toolbox',        name: 'ToolBox', permission: undefined }, // All authenticated
    { title: 'Help',             icon: 'mdi-help-circle',    name: 'Help', href: '/docs', target: '_blank', permission: undefined },
  ];
  return items.filter(item => !item.permission || hasPermission(item.permission));
});

// ── Drawer toggle ─────────────────────────────────────────────────────────────

watch(() => appStore.APP_DRAWER_TOGGLED, () => {
  if (!mini.value && drawerIsVisible.value) {
    mini.value = true;
  } else if (mini.value && drawerIsVisible.value) {
    drawerIsVisible.value = false;
    mini.value = false;
  } else {
    mini.value = false;
    drawerIsVisible.value = !drawerIsVisible.value;
  }
});
</script>

<style scoped>
#appDrawer {
  overflow: hidden;
}

.drawer-header {
  min-height: 56px;
}

.drawer-menu--scroll {
  overflow-y: auto;
  height: calc(100vh - 57px);
}

/* Active item highlight */
:deep(.v-list-item--active) {
  background: rgba(var(--v-theme-primary), 0.12) !important;
  font-weight: 600;
}
</style>
