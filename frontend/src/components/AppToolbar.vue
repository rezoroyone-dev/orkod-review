<template>
  <div :dir="textDirection" :style="fontStyle">
    <div class="d-print-none">
    <v-app-bar color="white" elevation="1" class="app-toolbar px-4" style="margin-right: 50px;">
        <v-btn icon color="#333" to="/" class="nav-link-btn" :ripple="false">
             <img :src="logo" height="36" alt="Logo" />
        </v-btn>
      <v-spacer />

      <!-- ── Authenticated user controls ── -->
      <template v-if="isLoggedIn">
        <!-- For RTL: Controls in order so they appear on the right, nav-icon last on right -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-avatar size="40" :color="avatarColor" class="elevation-2">
                <span v-if="!hasPhoto" class="text-subtitle-2 font-weight-bold text-white">{{ userInitials }}</span>
                <img v-else :src="profileAvatar" alt="User" style="object-fit: cover; width: 100%; height: 100%;" />
              </v-avatar>
            </v-btn>
          </template>
          <v-list min-width="180">
            <!-- User name header -->
            <v-list-item class="pb-1">
              <v-list-item-title class="font-weight-bold text-body-2">{{ displayName }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ userRoleName }}</v-list-item-subtitle>
            </v-list-item>
            <v-divider />
            <v-list-item v-for="(item, index) in items" :key="index" @click="item.click">
              <template v-slot:prepend>
                <v-icon>{{ item.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-spacer />
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-badge color="red" :content="notificationsNumber">
                <v-icon>mdi-bell</v-icon>
              </v-badge>
            </v-btn>
          </template>
          <notification-list></notification-list>
        </v-menu>
        <v-spacer />
        <v-btn icon @click="handleFullScreen()">
          <v-icon>mdi-fullscreen</v-icon>
        </v-btn>
        <v-spacer />
        <QuickSearch />
        <v-spacer />
        <v-app-bar-nav-icon @click.stop="handleDrawerToggle" />
      </template>

      <!-- ── Public (unauthenticated) controls ── -->
      <template v-else>
        <!-- Language switcher -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              color="#666"
              size="small"
              class="d-none d-md-flex lang-btn me-3"
              prepend-icon="mdi-web"
            >
              {{ currentLang }}
              <v-icon icon="mdi-chevron-down" size="small" class="ms-1" />
            </v-btn>
          </template>
          <v-list density="compact" min-width="140">
            <v-list-item v-for="(lang, index) in langs" :key="index" @click="changeLanguage(lang.value)">
              <v-list-item-title>{{ lang.text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Auth buttons -->
        <div class="d-none d-md-flex align-center ga-2 ms-1">
          <v-btn
            variant="outlined"
            rounded="pill"
            size="small"
            to="/login"
            class="auth-btn-login"
          >
            {{ t('Login') }}
          </v-btn>
          <v-btn
            color="#4A2E6B"
            rounded="pill"
            size="small"
            to="/booking"
            class="auth-btn-signup font-weight-bold text-white"
            elevation="0"
          >
            {{ t('Sign_Up') }}
          </v-btn>
        </div>

        <v-spacer class="d-none d-md-flex" />

        <!-- Desktop nav links - after spacer to appear on right in RTL -->
        <div class="d-none d-md-flex align-center ga-2 public-nav-links">
        <v-btn variant="text" color="#333" to="/booking" class="nav-link-btn" :ripple="false">
            {{ t('Explore_ORKOD') }}
            <span class="vip-badge ms-1">VIP</span>
          </v-btn>
          <v-btn variant="text" color="#333" to="/booking" class="nav-link-btn" :ripple="false">{{ t('Symptoms') }}</v-btn>
          <v-btn variant="text" color="#333" to="/booking" class="nav-link-btn" :ripple="false">{{ t('Experts') }}</v-btn>
          <v-btn variant="text" color="#333" to="/booking" class="nav-link-btn" :ripple="false">{{ t('Treatments') }}</v-btn>
          <v-btn variant="text" color="#333" to="/" class="nav-link-btn" :ripple="false">{{ t('Academy') }}</v-btn>
          <v-btn variant="text" color="#333" to="/" class="nav-link-btn" :ripple="false">{{ t('Community') }}</v-btn>
          <v-btn variant="text" color="#333" to="/contact" class="nav-link-btn" :ripple="false">{{ t('Contact_Us') }}</v-btn>
        </div>

        <!-- Mobile hamburger - last so it appears on the left in RTL -->
        <v-app-bar-nav-icon
          class="d-flex d-md-none"
          color="#4A2E6B"
          @click="publicMobileDrawer = true"
        />
      </template>

    </v-app-bar>

    <!-- ── Mobile public navigation drawer ── -->
    <v-navigation-drawer
      v-model="publicMobileDrawer"
      location="right"
      temporary
      width="280"
      class="mobile-nav-drawer"
    >
      <div class="mobile-nav-header pa-4">
        <div class="d-flex align-center ga-2">
          <img :src="logo" height="32" alt="Logo" />
          <span class="text-h6 font-weight-bold" style="color:#1a0533">Orkod</span>
        </div>
        <p class="text-caption text-grey mt-1">بوابة الاستشفاء المتكامل</p>
      </div>
      <v-divider />
<v-list nav density="compact" class="pt-2">
         <v-list-item prepend-icon="mdi-home-outline" :title="t('Home')" :value="'home'" to="/" @click="publicMobileDrawer = false" />
         <v-list-item prepend-icon="mdi-crown-outline" :title="t('Explore_ORKOD')" :value="'explore'" to="/booking" @click="publicMobileDrawer = false" />
         <v-list-item prepend-icon="mdi-bacteria-outline" :title="t('Symptoms')" :value="'symptoms'" to="/booking" @click="publicMobileDrawer = false" />
         <v-list-item prepend-icon="mdi-account-heart-outline" :title="t('Experts')" :value="'experts'" to="/booking" @click="publicMobileDrawer = false" />
         <v-list-item prepend-icon="mdi-leaf" :title="t('Treatments')" :value="'treatments'" to="/booking" @click="publicMobileDrawer = false" />
         <v-list-item prepend-icon="mdi-school-outline" :title="t('Academy')" :value="'academy'" to="/" @click="publicMobileDrawer = false" />
         <v-list-item prepend-icon="mdi-account-group-outline" :title="t('Community')" :value="'community'" to="/" @click="publicMobileDrawer = false" />
         <v-list-item prepend-icon="mdi-email-outline" :title="t('Contact_Us')" :value="'contact'" to="/contact" @click="publicMobileDrawer = false" />
         <v-divider class="my-2" />
         <v-list-item prepend-icon="mdi-login" :title="t('Login')" :value="'login'" to="/login" @click="publicMobileDrawer = false" />
       </v-list>
    </v-navigation-drawer>

    <!-- ── Theme settings drawer ── -->
    <v-navigation-drawer class="setting-drawer" temporary location="right" v-model="rightDrawer" hide-overlay>
      <ThemeSettings />
    </v-navigation-drawer>

    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemeSettings from '@/components/ThemeSettings.vue';
import NotificationList from '@/components/widgets/list/NotificationList.vue';
import { useLicense } from '@/composables/useLicense';
import { useMessageBox } from '@/composables/useMessageBox';
import MessageBoxDialog from "@/dialogs/MessageBoxDialog.vue";
import QuickSearch from '@/dialogs/QuickSearch.vue';
import Schedule from '@/interfaces/Schedule';
import NotificationService from '@/services/NotificationService';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import BrowserFullScreen from "@/utilities/BrowserFullScreen";
import Language from "@/utilities/Language";
import { logout } from '@/utilities/MyUtilities';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();
const { t, locale } = useI18n();
const { msgBox, closeMsgBox } = useMessageBox();
const { checkLicenseStatus, getLicenseSummary } = useLicense();

const rightDrawer = ref(false);
const publicMobileDrawer = ref(false);
const timer = ref(0);
const notificationsList = ref<Schedule[]>([]);

const items = ref([
  {
    icon: 'mdi-account-circle',
    translationKey: 'Profile',
    title: '',
    click: () => goToProfile(),
  },
  {
    icon: 'mdi-logout',
    translationKey: 'Logout',
    title: '',
    click: () => logoutUser(),
  },
]);

// ── Computed ──────────────────────────────────────────────────────────────────

const superUser = computed(() => userStore.superUser);

const isLoggedIn = computed(() =>
  superUser.value !== undefined &&
  superUser.value.id !== undefined &&
  superUser.value.id !== -1
);

const displayName = computed(() => {
  const u = superUser.value;
  if (!u) return '';
  // Use Person object for name (from backend relationship)
  const first = u.person?.firstName || '';
  const last = u.person?.lastName || '';
  return (first + ' ' + last).trim() || u.userName || '';
});

const userInitials = computed(() => {
  const u = superUser.value;
  if (!u) return '?';
  // Use Person object for name (from backend relationship)
  const first = (u.person?.firstName || u.userName || '?')[0].toUpperCase();
  const last = u.person?.lastName ? u.person.lastName[0].toUpperCase() : '';
  return first + last;
});

const userRoleName = computed(() => {
  const u = superUser.value;
  if (!u) return '';
  if (u.role?.name) return u.role.name;
  if (u.roles && u.roles.length > 0) return u.roles[0].name;
  return '';
});

// Generate a consistent color from the username
const avatarColor = computed(() => {
  const colors = ['indigo', 'teal', 'purple', 'blue', 'green', 'orange', 'deep-purple'];
  const name = superUser.value?.userName || '';
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
});

const hasPhoto = computed(() => false); // extend later when photo upload is supported

const profileAvatar = computed(() =>
  new URL('@/static/avatar/man.jpg', import.meta.url).href
);

const logo = computed(() =>
  new URL('@/static/PranicHealingLogo.png', import.meta.url).href
);

const langs = computed(() => Language.langs);

const currentLang = computed(() => {
  const lang = langs.value.find(l => l.value === locale.value);
  return lang ? lang.text : 'English';
});

const textDirection = computed(() => locale.value === 'ar' ? 'rtl' : 'ltr');

const fontStyle = computed(() => locale.value === 'ar'
  ? { fontFamily: "'Cairo', 'Segoe UI', sans-serif" }
  : {}
);

const notificationsNumber = computed((): number => {
  const notList: Schedule[] = appStore.getNotificationList;
  return notList ? notList.length : 0;
});

// ── Methods ───────────────────────────────────────────────────────────────────

const goToProfile = () => {
  if (router.currentRoute.value.path === '/admin/Profile') return;
  router.push('/admin/Profile').catch(console.log);
};

const logoutUser = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  logout(router);
  router.push('/');
};

const handleDrawerToggle = () => {
  appStore.setAPP_DRAWER_TOGGLED();
};

const handleFullScreen = () => {
  BrowserFullScreen.toggleFullScreen(document);
};

const changeLanguage = (langValue: string) => {
  locale.value = langValue;
  appStore.setLocale(langValue);
};

const translateContents = () => {
  items.value.forEach((item) => {
    item.title = t(item.translationKey);
  });
};

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (userStore.superUser?.id) {
    await NotificationService.updateNotificationsList(appStore);
    await checkLicenseStatus(userStore.superUser);
    getLicenseSummary();
  }
  translateContents();
});

onBeforeUnmount(() => {
  clearInterval(timer.value);
});

watch(() => appStore.locale, (newLocale, oldLocale) => {
  if (!newLocale || newLocale === oldLocale) return;
  translateContents();
});

watch(locale, (newLocale) => {
  if (newLocale) {
    appStore.setLocale(newLocale);
  }
});

watch(superUser, async (newUser) => {
  if (newUser?.id) {
    await NotificationService.updateNotificationsList(appStore);
    await checkLicenseStatus(newUser);
    getLicenseSummary();
  }
});

watch(() => appStore.getNotificationList, (notList) => {
  if (notList?.length > 0) notificationsList.value = notList;
});
</script>

<style scoped>
.app-toolbar {
  border-bottom: 1px solid rgba(74,46,107,0.08);
}

:deep(.app-toolbar .v-btn) {
  font-weight: 600;
}

:deep(.nav-link-btn) {
  font-size: 0.9rem;
  font-weight: 600;
}

.vip-badge {
  background: #CFA052;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
}

.auth-btn-login {
  border-color: rgba(74,46,107,0.3) !important;
  color: #4A2E6B !important;
}

.auth-btn-signup {
  background: #4A2E6B !important;
}
</style>
