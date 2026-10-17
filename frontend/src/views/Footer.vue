<template>
  <v-footer class="footer-root" style="background: #0d0318; border-top: 1px solid rgba(255,255,255,0.06);">
    <v-container class="py-10">
      <v-row>
        <!-- Brand + social -->
        <v-col cols="12" md="4" class="mb-8 mb-md-0">
          <div class="d-flex align-center mb-3">
            <v-img :src="logo" height="38" width="38" contain class="me-2" />
            <span class="text-h5 font-weight-bold text-white">Orkod</span>
          </div>
          <p class="text-caption mb-6" style="color: rgba(255,255,255,0.55); max-width: 260px; line-height: 1.7;">
            بوابتك المتكاملة للاستشفاء المتوازن بين الجسد، العقل، والطاقة.
          </p>
          <div class="d-flex ga-3">
            <v-btn icon size="small" variant="tonal" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8);" aria-label="Facebook">
              <v-icon size="18">mdi-facebook</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="tonal" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8);" aria-label="Instagram">
              <v-icon size="18">mdi-instagram</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="tonal" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8);" aria-label="YouTube">
              <v-icon size="18">mdi-youtube</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="tonal" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8);" aria-label="TikTok">
              <v-icon size="18">mdi-music-note</v-icon>
            </v-btn>
          </div>
        </v-col>

        <!-- Quick links -->
        <v-col cols="6" md="2" class="mb-6 mb-md-0">
          <p class="text-caption font-weight-bold mb-4" style="color: #c9a227; letter-spacing: 0.5px;">روابط سريعة</p>
          <div class="d-flex flex-column ga-2">
            <router-link to="/" class="footer-link">الرئيسية</router-link>
            <router-link to="/booking" class="footer-link">الخبراء</router-link>
            <router-link to="/booking" class="footer-link">الأعراض</router-link>
            <router-link to="/" class="footer-link">المجتمع</router-link>
            <router-link to="/" class="footer-link">الأكاديمية</router-link>
            <router-link to="/" class="footer-link">الفعاليات</router-link>
            <router-link to="/contact" class="footer-link">اتصل بنا</router-link>
          </div>
        </v-col>

        <!-- Info links -->
        <v-col cols="6" md="2" class="mb-6 mb-md-0">
          <p class="text-caption font-weight-bold mb-4" style="color: rgba(255,255,255,0.4); letter-spacing: 0.5px;">معلومات</p>
          <div class="d-flex flex-column ga-2">
            <router-link to="/" class="footer-link">من نحن</router-link>
            <router-link to="/" class="footer-link">وظائف</router-link>
            <router-link to="/" class="footer-link">سياسة الخصوصية</router-link>
            <router-link to="/" class="footer-link">شروط الاستخدام</router-link>
            <router-link to="/contact" class="footer-link">الدعم</router-link>
          </div>
        </v-col>

        <!-- Contact -->
        <v-col cols="12" md="4">
          <p class="text-caption font-weight-bold mb-4" style="color: rgba(255,255,255,0.4); letter-spacing: 0.5px;">تواصل معنا</p>
          <div class="d-flex flex-column ga-3">
            <div class="d-flex align-center ga-2">
              <v-icon size="16" style="color: #c9a227;">mdi-email-outline</v-icon>
              <span class="text-caption" style="color: rgba(255,255,255,0.7);">info@orkod.com</span>
            </div>
            <div class="d-flex align-center ga-2">
              <v-icon size="16" style="color: #c9a227;">mdi-phone-outline</v-icon>
              <span class="text-caption" style="color: rgba(255,255,255,0.7);">+212 600 000 000</span>
            </div>
            <div class="d-flex align-center ga-2">
              <v-icon size="16" style="color: #c9a227;">mdi-map-marker-outline</v-icon>
              <span class="text-caption" style="color: rgba(255,255,255,0.7);">الدار البيضاء، المغرب</span>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-divider style="border-color: rgba(255,255,255,0.08);" class="my-8" />

      <v-row align="center">
        <v-col cols="12" class="text-center">
          <span class="text-caption" style="color: rgba(255,255,255,0.4);">
            &copy; {{ currentYear }} ORKOD. جميع الحقوق محفوظة.
          </span>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentYear = computed(() => new Date().getFullYear());
const logo = computed(() => new URL('@/static/PranicHealingLogo.png', import.meta.url).href);
</script>

<style scoped>
.footer-link {
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  font-size: 0.82rem;
  transition: color 0.2s;
  line-height: 1.6;
}
.footer-link:hover {
  color: #c9a227;
}

@media print {
  :deep(.v-footer) {
    display: none;
  }
}
</style>
