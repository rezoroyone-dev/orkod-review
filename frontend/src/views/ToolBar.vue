<template>
  <v-app-bar
    app
    flat
    color="white"
    height="66"
    dir="rtl"
    style="border-bottom: 1px solid rgba(0,0,0,0.07); z-index: 100;"
  >
    <v-container class="d-flex align-center pa-0 h-100" style="max-width: 1400px;">

      <!-- Logo (right in RTL) -->
      <div class="d-flex align-center logo-wrap" @click="router.push('/')" style="cursor: pointer;">
        <v-img :src="logo" height="44" width="44" contain class="me-2" />
        <div>
          <div class="brand-name">Orkod</div>
          <div class="brand-sub">بوابة الاستشفاء المتكامل</div>
        </div>
      </div>

      <v-spacer />

      <!-- Nav links (desktop only) -->
      <nav class="d-none d-lg-flex align-center ga-1">
        <router-link to="/" class="nav-link" :class="{ 'nav-active': $route.path === '/' }">الرئيسية</router-link>

        <div class="nav-link nav-vip-wrap">
          <span class="vip-badge">VIP</span>
        </div>

        <router-link to="/" class="nav-link">استشفاء ORKOD</router-link>
        <router-link to="/booking" class="nav-link">الخبراء</router-link>
        <router-link to="/" class="nav-link">الأعراض</router-link>
        <router-link to="/" class="nav-link">العلاجات</router-link>
        <router-link to="/" class="nav-link">الأكاديمية</router-link>
        <router-link to="/" class="nav-link">المجتمع</router-link>
        <router-link to="/contact" class="nav-link">تواصل معنا</router-link>
      </nav>

      <v-spacer />

      <!-- Right actions (left in RTL) -->
      <div class="d-flex align-center ga-2">
        <!-- Language toggle -->
        <v-btn variant="text" size="small" class="lang-btn d-none d-md-flex px-2" density="comfortable">
          <v-icon size="16" class="me-1">mdi-web</v-icon>
          العربية
          <v-icon size="14" class="ms-1">mdi-chevron-down</v-icon>
        </v-btn>

        <!-- Login -->
        <v-btn
          variant="outlined"
          size="small"
          rounded="pill"
          class="auth-btn-outline d-none d-sm-flex"
          @click="router.push('/login')"
        >
          تسجيل الدخول
        </v-btn>

        <!-- Register -->
        <v-btn
          color="#4A2E6B"
          size="small"
          rounded="pill"
          elevation="0"
          class="auth-btn-filled"
          @click="router.push('/register')"
        >
          إنشاء حساب
        </v-btn>

        <!-- Hamburger (mobile) -->
        <v-btn icon size="small" class="d-flex d-lg-none ms-1" @click="drawer = !drawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </div>
    </v-container>
  </v-app-bar>

  <!-- Mobile drawer -->
  <v-navigation-drawer v-model="drawer" location="end" temporary dir="rtl">
    <div class="d-flex align-center pa-4">
      <v-img :src="logo" height="36" width="36" contain class="me-2" />
      <span class="brand-name">Orkod</span>
    </div>
    <v-divider />
    <v-list nav density="compact">
      <v-list-item to="/" title="الرئيسية" prepend-icon="mdi-home-outline" />
      <v-list-item to="/" title="استشفاء ORKOD" prepend-icon="mdi-crown-outline" />
      <v-list-item to="/booking" title="الخبراء" prepend-icon="mdi-account-group-outline" />
      <v-list-item to="/" title="الأعراض" prepend-icon="mdi-medical-bag" />
      <v-list-item to="/" title="العلاجات" prepend-icon="mdi-leaf-outline" />
      <v-list-item to="/" title="الأكاديمية" prepend-icon="mdi-school-outline" />
      <v-list-item to="/" title="المجتمع" prepend-icon="mdi-account-heart-outline" />
      <v-list-item to="/contact" title="تواصل معنا" prepend-icon="mdi-phone-outline" />
    </v-list>
    <v-divider class="my-2" />
    <div class="pa-4 d-flex flex-column ga-2">
      <v-btn variant="outlined" color="#4A2E6B" rounded="pill" block @click="router.push('/login')">تسجيل الدخول</v-btn>
      <v-btn color="#4A2E6B" rounded="pill" block @click="router.push('/register')">إنشاء حساب</v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const drawer = ref(false);
const logo = computed(() => new URL('@/static/PranicHealingLogo.png', import.meta.url).href);
</script>

<style scoped>
.logo-wrap { gap: 8px; }

.brand-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #2E1B4E;
  line-height: 1.2;
  font-family: 'Cairo', sans-serif;
}

.brand-sub {
  font-size: 0.62rem;
  color: #888;
  line-height: 1.2;
  white-space: nowrap;
  font-family: 'Cairo', sans-serif;
}

.nav-link {
  text-decoration: none;
  color: #444;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 9px;
  border-radius: 8px;
  transition: color 0.18s, background 0.18s;
  white-space: nowrap;
  font-family: 'Cairo', sans-serif;
}
.nav-link:hover { color: #4A2E6B; background: #f4f1f8; }
.nav-active { color: #4A2E6B !important; font-weight: 800; }

.nav-vip-wrap {
  padding: 5px 9px;
  cursor: pointer;
}

.vip-badge {
  background: linear-gradient(135deg, #D4A853, #f0c96a);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(212,168,83,0.4);
}

.lang-btn {
  color: #555;
  font-size: 0.82rem;
  font-family: 'Cairo', sans-serif;
  font-weight: 600;
  text-transform: none !important;
  letter-spacing: 0 !important;
}

.auth-btn-outline {
  color: #4A2E6B !important;
  border-color: #4A2E6B !important;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-size: 0.82rem;
}

.auth-btn-filled {
  color: white !important;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-size: 0.82rem;
}
</style>
