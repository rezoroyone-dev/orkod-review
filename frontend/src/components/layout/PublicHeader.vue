<template>
  <header
    class="public-header"
    :class="{ scrolled, 'public-header--stage': isStageRoute }"
    :dir="textDirection"
  >
    <div class="ph-inner">
      <div class="ph-left">
        <router-link to="/home" class="ph-brand" aria-label="Orkod home">
          <img :src="logo" alt="Orkod" class="ph-brand-logo" />
          <span class="ph-brand-name">
            Orkod<span class="ph-brand-dot">.</span>
          </span>
        </router-link>

        <nav class="ph-nav d-none d-lg-flex" :aria-label="t('Header_MainNav')">
          <router-link
            v-for="route in navRoutes"
            :key="route.path"
            :to="route.path"
            class="ph-link"
            :class="{ active: isActive(route) }"
          >
            {{ t(route.labelKey) }}
          </router-link>
        </nav>
      </div>

      <div class="ph-right">
        <div class="d-none d-md-flex align-center">
          <v-menu offset-y>
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                color="charcoal-muted"
                size="small"
                class="ph-lang-btn pressable"
                :aria-label="t('Language')"
              >
                <span :class="['fi', 'fi-' + currentFlag]" class="ph-lang-flag" aria-hidden="true" />
                {{ currentLang }}
                <v-icon end size="16">mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" min-width="176">
              <v-list-item v-for="lang in langsList" :key="lang.value" @click="changeLanguage(lang.value)">
                <div class="ph-lang-option">
                  <span :class="['fi', 'fi-' + flagFor(lang.value)]" class="ph-lang-flag" aria-hidden="true" />
                  <span>{{ lang.text }}</span>
                  <v-icon v-if="lang.value === locale" end size="14" class="ph-lang-check">mdi-check</v-icon>
                </div>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>

        <div class="ph-actions d-none d-md-flex align-center ga-2 ms-2">
          <v-btn variant="text" size="small" to="/login" class="ph-btn-login pressable">
            {{ t('Login') }}
          </v-btn>
          <v-btn to="/booking" class="ph-btn-book" size="small" elevation="0">
            {{ t('Book_a_Session') }}
          </v-btn>
        </div>

      <v-app-bar-nav-icon
        class="d-flex d-lg-none"
        color="charcoal"
        :aria-label="t('Header_OpenMenu')"
        @click="mobileOpen = true"
      />
      </div>
    </div>

    <!-- Mobile navigation -->
    <v-navigation-drawer
      v-model="mobileOpen"
      temporary
      width="320"
      :location="isRtl ? 'left' : 'right'"
      class="ph-mobile-drawer"
    >
      <div class="ph-mobile-header">
        <router-link to="/home" class="ph-brand" @click="mobileOpen = false">
          <img :src="logo" alt="Orkod" class="ph-brand-logo" />
          <span class="ph-brand-name">Orkod<span class="ph-brand-dot">.</span></span>
        </router-link>
        <v-btn icon :aria-label="t('Header_CloseMenu')" variant="text" @click="mobileOpen = false" class="pressable">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

        <v-list nav density="comfortable">
          <v-list-item
            v-for="(item, i) in mobileNavItems"
            :key="item.path"
            :to="item.path"
            :prepend-icon="item.icon"
            :title="t(item.labelKey)"
            :active="isActive(item)"
            @click="mobileOpen = false"
            class="stagger-in ph-drawer-link"
            :class="{ 'ph-drawer-link--active': isActive(item) }"
            :style="{ '--i': i + 1 }"
          />
        <v-divider class="my-2 stagger-in" style="--i: 9;" />
        <v-list-item
          prepend-icon="mdi-login"
          :title="t('Login')"
          to="/login"
          @click="mobileOpen = false"
          class="stagger-in"
          style="--i: 10;"
        />
      </v-list>

      <template #append>
        <div class="pa-4 stagger-in" style="--i: 11;">
          <v-btn block color="primary" to="/booking" elevation="0" class="ph-drawer-book pressable" @click="mobileOpen = false">
            {{ t('Book_a_Session') }}
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/app';
import Language from '@/utilities/Language';

const flagByLang: Record<string, string> = { en: 'gb', fr: 'fr', id: 'id', ar: 'sa' };

const { t, locale } = useI18n();
const appStore = useAppStore();
const route = useRoute();

const mobileOpen = ref(false);
const scrolled = ref(false);

/**
 * The /body route renders as a true full-bleed stage: a near-black void with the
 * figure floating in it. This header normally sits on a warm ivory page and uses
 * charcoal text plus the brand bronze for links and the logo dot; left alone on a
 * black stage it reads as a white bar with brown accents at the top of the void,
 * which is exactly the "white page with a 3D widget" look the stage is meant to
 * avoid. So on stage routes the header is recoloured into the same
 * black/purple/gold system. Every other route is untouched.
 */
const isStageRoute = computed(() => route.meta.stage === true);

let scrollRaf = 0;
function checkScroll() {
  scrollRaf = 0;
  scrolled.value = window.scrollY > 8;
}
function onWindowScroll() {
  if (!scrollRaf) scrollRaf = window.requestAnimationFrame(checkScroll);
}

onMounted(() => {
  checkScroll();
  window.addEventListener('scroll', onWindowScroll, { passive: true });
});

onBeforeUnmount(() => {
  if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
  window.removeEventListener('scroll', onWindowScroll);
});

const logo = computed(() => new URL('@/static/OrkodLogo.png', import.meta.url).href);
const textDirection = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'));
const isRtl = computed(() => locale.value === 'ar');

const langsList = computed(() => Language.langs);

const currentLang = computed(() => {
  const lang = langsList.value.find((l) => l.value === locale.value);
  return lang ? lang.text : 'English';
});

const currentFlag = computed(() => flagByLang[locale.value] || 'gb');

function flagFor(value: string): string {
  return flagByLang[value] || 'gb';
}

// One source of truth for public navigation. Desktop and the mobile drawer used
// to declare separate lists, so the two chrome variants advertised different
// sections (desktop had no booking/quiz/academy/contact). `primary` marks the
// items that fit in the desktop bar; everything else is still reachable from the
// drawer, which renders the same list.
interface NavItem {
  path: string;
  name: string;
  icon: string;
  labelKey: string;
  primary: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/home', name: 'Home', icon: 'mdi-home-outline', labelKey: 'Home', primary: true },
  { path: '/body', name: 'BodyExplorer', icon: 'mdi-human-male-height', labelKey: 'Nav_BodyExplorer', primary: true },
  { path: '/quiz', name: 'Quiz', icon: 'mdi-comment-question', labelKey: 'Nav_Quiz', primary: true },
  { path: '/symptoms', name: 'Symptoms', icon: 'mdi-magnify', labelKey: 'Nav_Symptoms', primary: true },
  { path: '/practitioners', name: 'practitioners', icon: 'mdi-account-heart-outline', labelKey: 'Nav_Experts', primary: true },
  { path: '/book', name: 'BookShop', icon: 'mdi-book-open-page-variant', labelKey: 'Nav_Book', primary: false },
  { path: '/academy', name: 'Academy', icon: 'mdi-school-outline', labelKey: 'Nav_Academy', primary: false },
  { path: '/family', name: 'Family', icon: 'mdi-account-group-outline', labelKey: 'Nav_Family', primary: false },
  { path: '/assistant', name: 'Assistant', icon: 'mdi-robot-outline', labelKey: 'Nav_Assistant', primary: false },
  { path: '/donations', name: 'Donations', icon: 'mdi-hand-heart-outline', labelKey: 'Nav_Donations', primary: false },
  { path: '/contact', name: 'ContactUs', icon: 'mdi-email-outline', labelKey: 'Contact_Us', primary: false },
];

const navRoutes = computed(() => NAV_ITEMS.filter((i) => i.primary));
const mobileNavItems = computed(() => NAV_ITEMS);

/**
 * Active state has to survive nested routes: on /symptoms/headache or
 * /practitioners/4 an exact route-name match highlighted nothing at all.
 */
function isActive(item: NavItem): boolean {
  if (route.path === item.path) return true;
  // Guard against '/' matching everything.
  if (item.path === '/home') return false;
  return route.path.startsWith(item.path + '/');
}

function changeLanguage(langValue: string) {
  locale.value = langValue;
  appStore.setLocale(langValue);
}
</script>

<style scoped lang="scss">
.public-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(11, 7, 24, 0.72);
  backdrop-filter: blur(20px) saturate(120%);
  border-bottom: 1px solid rgba(212, 175, 55, 0.14);
  transition: background 240ms ease, box-shadow 240ms ease, border-color 240ms ease;
}

.public-header.scrolled {
  background: rgba(3, 3, 10, 0.9);
  border-color: rgba(139, 92, 246, 0.32);
  box-shadow: 0 10px 40px -18px rgba(109, 40, 217, 0.55);
}

/*
 * ── Stage mode (/body) ────────────────────────────────────────────────────────────
 *
 * On the full-bleed black stage the ivory header and its bronze accents would sit
 * on top of the void as a white bar with brown details. These rules re-point the
 * header into the page's black/purple/gold system. They only exist under
 * `.public-header--stage`, which is applied solely when the route sets
 * `meta.stage`, so no other page's header changes.
 *
 * Every colour below is chosen for contrast against #020204, not lifted from the
 * light-theme tokens: the light-mode charcoal text would be invisible here.
 */
.public-header--stage {
  background: rgba(5, 5, 10, 0.82);
  backdrop-filter: blur(20px) saturate(120%);
  border-bottom: 1px solid rgba(109, 59, 232, 0.32);
}

.public-header--stage.scrolled {
  background: rgba(3, 3, 10, 0.94);
  border-bottom-color: rgba(124, 77, 255, 0.4);
  box-shadow: 0 10px 40px -18px rgba(109, 59, 232, 0.55);
}

.public-header--stage .ph-brand-name {
  color: #f3efff;
}

.public-header--stage .ph-brand-dot {
  color: #F1D27A;
}

.public-header--stage .ph-brand-logo {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(169, 139, 255, 0.4);
}

.public-header--stage .ph-link {
  color: rgba(199, 184, 255, 0.78);
}

.public-header--stage .ph-link:hover {
  color: #fff;
  background: rgba(109, 59, 232, 0.24);
}

.public-header--stage .ph-link.active {
  color: #F1D27A;
  background: rgba(109, 59, 232, 0.28);
  box-shadow: inset 0 0 0 1.5px rgba(215, 184, 102, 0.5);
}

.public-header--stage .ph-btn-login {
  color: #D4AF37 !important;
  border-color: rgba(215, 184, 102, 0.45) !important;
}

.public-header--stage .ph-btn-login:hover {
  background: rgba(215, 184, 102, 0.16) !important;
}

.public-header--stage .ph-lang-check {
  color: #D4AF37;
}

.public-header--stage .ph-btn-book {
  color: #150d24;
  background: linear-gradient(135deg, #F1D27A, #D4AF37);
  box-shadow: 0 2px 12px rgba(215, 184, 102, 0.3);
}

.ph-inner {
  width: min(100% - 32px, 1280px);
  margin-inline: auto;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.ph-left {
  display: flex;
  align-items: center;
  gap: 40px;
  min-width: 0;
}

.ph-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  flex-shrink: 0;
}

.ph-brand-logo {
  height: 42px;
  width: 42px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18), inset 0 0 0 1px rgba(212, 175, 55, 0.15);
}

.ph-brand-name {
  font-family: var(--font-family-latin);
  font-weight: 800;
  font-size: 1.2rem;
  letter-spacing: -0.01em;
  color: var(--color-charcoal);
  line-height: 1;
  white-space: nowrap;
}

.ph-brand-dot { color: var(--color-gold-strong); }

.ph-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.ph-link {
  position: relative;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-charcoal-light);
  padding: 9px 14px;
  border-radius: 999px;
  text-decoration: none;
  transition: color 180ms ease, background 200ms ease, box-shadow 200ms ease;
}

.ph-link:hover {
  color: var(--color-charcoal);
  background: var(--color-turquoise-soft);
}

.ph-link.active {
  color: var(--color-turquoise);
  font-weight: 700;
  background: var(--color-turquoise-soft);
  box-shadow: inset 0 0 0 1.5px rgba(212, 175, 55, 0.45);
}

.ph-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ph-lang-btn {
  text-transform: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ph-lang-flag {
  width: 21px;
  height: 15px;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.ph-lang-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 20px;
}

.ph-lang-check {
  margin-inline-start: auto;
  color: var(--color-turquoise);
}

.ph-btn-login {
  text-transform: none;
  font-weight: 700;
  color: var(--color-turquoise) !important;
  border: 1.5px solid rgba(212, 175, 55, 0.4) !important;
  border-radius: 999px;
}

.ph-btn-login:hover {
  background: var(--color-turquoise-soft) !important;
}

.ph-btn-book {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
  color: #4A3612;
  background: var(--gradient-gold);
  border-radius: 999px;
  padding-inline: 26px;
  transition: transform 180ms var(--ease-out), box-shadow 180ms ease;
  box-shadow: 0 2px 10px rgba(212, 175, 55, 0.22);
}
.ph-btn-book:active { transform: translateY(1px) scale(0.98); }
.ph-btn-book:hover { box-shadow: 0 6px 20px rgba(212, 175, 55, 0.34); }

/* Drawer active state mirrors the desktop pill so the two chrome variants read
   as one product. */
.ph-drawer-link--active {
  color: var(--color-turquoise);
}
.ph-drawer-link--active :deep(.v-list-item__overlay) {
  background: var(--color-turquoise-soft);
  opacity: 1;
}

/* Mobile drawer */
.ph-mobile-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}

.ph-drawer-book {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.ph-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

@media (max-width: 640px) {
  .ph-inner {
    width: min(100% - 20px, 1280px);
    height: 60px;
    gap: 16px;
  }
  .ph-brand-logo { height: 34px; width: 34px; }
  .ph-brand-name { font-size: 1.1rem; }
}
</style>