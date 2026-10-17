<template>
  <v-app :class="{ 'app-stage': isStageRoute }">
    <!-- Admin shell -->
    <template v-if="chrome === 'admin'">
      <AppToolbar v-if="appStore.isToolBarVisible" />
      <AppDrawer v-if="appStore.isToolBarVisible" />
      <v-main>
        <v-container fluid class="MyContainer">
          <router-view />
        </v-container>
      </v-main>
    </template>

    <!-- Public site shell (header + footer) -->
    <template v-else-if="showPublicChrome && !isStageRoute">
      <PublicHeader />
      <div class="orkod-public">
        <router-view />
      </div>
      <PublicFooter />
    </template>

    <!-- Full-bleed stage (/body): header recolours itself, no footer -->
    <template v-else-if="showPublicChrome">
      <PublicHeader />
      <div class="orkod-public orkod-stage">
        <router-view />
      </div>
    </template>

    <!-- Bare shell (language gate, login, 404) -->
    <template v-else>
      <router-view />
    </template>
  </v-app>
</template>

<script setup lang="ts">
import AppDrawer from '@/components/AppDrawer.vue';
import AppToolbar from '@/components/AppToolbar.vue';
import PublicFooter from '@/components/layout/PublicFooter.vue';
import PublicHeader from '@/components/layout/PublicHeader.vue';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { langsEnum } from './enumerators/enums';
import SicknessNatureService from './services/SicknessNatureService';
import Language from './utilities/Language';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const userStore = useUserStore();
const { locale } = useI18n();

/** Which shell wraps the current route. Defaults to the public shell. */
const chrome = computed(() => (route.meta.chrome as string) || 'public');

/** True for the header + footer public pages. */
const showPublicChrome = computed(() => chrome.value === 'public');

/**
 * /body sets `meta.stage`, which turns the page into a true full-bleed black
 * stage: the footer is suppressed so no cream or brown sits around the canvas.
 */
const isStageRoute = computed(() => route.meta.stage === true);

function isAdminRoute(): boolean {
  return route.path.startsWith('/admin');
}

// Keep <html> lang/dir in sync with the active locale so RTL and the
// direction-aware typography (Cairo for Arabic, Inter for Latin) apply.
watch(
  () => locale.value,
  (l) => {
    const value = l || 'en';
    document.documentElement.lang = value;
    document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
  },
  { immediate: true }
);

onMounted(async () => {
  const admin = isAdminRoute();
  if (!userStore.superUser || userStore.superUser.id === -1) {
    if (admin) {
      goToLoginPage();
    }
    appStore.setIsToolBarVisible(false);
  } else {
    appStore.setIsToolBarVisible(admin);
    // Populate sickness natures for the admin UI.
    const activeLang: langsEnum = Language.getActiveLang(appStore.locale);
    await SicknessNatureService.populateSickNatures(activeLang);
  }
});

watch(
  () => route.path,
  (newPath) => {
    const admin = newPath.startsWith('/admin');
    if (userStore.superUser && userStore.superUser.id !== -1) {
      appStore.setIsToolBarVisible(admin);
    }
  }
);

function goToLoginPage() {
  if (route.name === 'login') {
    return;
  }
  router.push('/login').catch((error) => {
    console.log(error);
  });
}
</script>

<style lang="scss">
  html {
    overflow: auto;
  }

  #app {
    font-weight: normal;
  }

  .MyContainer {
    min-width: 100%;
    max-width: 100%;
    margin-right: 0;
    margin-left: 0;
    padding-right: 10px;
    padding-left: 10px;
  }

  /* The public site owns its own full-bleed surfaces; make sure the shell
     never introduces the default Vuetify application background on top. */
  .orkod-public {
    background: var(--color-background, #020204);
    color: var(--color-text-primary, #fff);
    min-height: 100vh;
  }

  /* The full-bleed /body stage paints the whole application black. */
  .v-application.app-stage {
    background: #020204;
  }

  .material-icons {
    font-family: "Material Icons";
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    word-wrap: normal;
    white-space: nowrap;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
</style>
