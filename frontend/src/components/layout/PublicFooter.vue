<template>
  <footer class="public-footer" :dir="textDirection">
    <div class="pf-inner">
      <div class="pf-grid">
        <div class="pf-brand-col">
          <div class="pf-brand">
            <img :src="logo" alt="Orkod" class="pf-brand-logo" />
            <span class="pf-brand-name">Orkod<span class="pf-brand-dot">.</span></span>
          </div>
          <p class="pf-tagline">{{ t('ORKOD_Tagline') }}</p>
          <div class="pf-socials">
            <a class="pf-social" href="#" aria-label="Facebook"><v-icon size="18">mdi-facebook</v-icon></a>
            <a class="pf-social" href="#" aria-label="Instagram"><v-icon size="18">mdi-instagram</v-icon></a>
            <a class="pf-social" href="#" aria-label="YouTube"><v-icon size="18">mdi-youtube</v-icon></a>
          </div>
        </div>

        <nav class="pf-col" :aria-label="t('Quick_Links')">
          <p class="pf-heading">{{ t('Quick_Links') }}</p>
          <!-- "/" is the language gate, not the home page: pointing "Home" there sent
           visitors back to the language picker instead of the site. -->
      <router-link to="/home" class="pf-link">{{ t('Home') }}</router-link>
          <router-link to="/symptoms" class="pf-link">{{ t('Nav_Symptoms') }}</router-link>
          <router-link to="/practitioners" class="pf-link">{{ t('Nav_Experts') }}</router-link>
          <router-link to="/consultations" class="pf-link">{{ t('Nav_Consultations') }}</router-link>
          <router-link to="/academy" class="pf-link">{{ t('Nav_Academy') }}</router-link>
        </nav>

        <nav class="pf-col" :aria-label="t('Treatments')">
          <p class="pf-heading">{{ t('Treatments') }}</p>
          <router-link to="/booking" class="pf-link">{{ t('Remote_Sessions') }}</router-link>
          <router-link to="/booking" class="pf-link">{{ t('Natural_Healing') }}</router-link>
          <router-link to="/booking" class="pf-link">{{ t('Inner_Peace') }}</router-link>
          <router-link to="/assistant" class="pf-link">{{ t('Nav_Assistant') }}</router-link>
          <router-link to="/community" class="pf-link">{{ t('Community_Title') }}</router-link>
          <router-link to="/doctors" class="pf-link">{{ t('Doctors_Title') }}</router-link>
        </nav>

        <div class="pf-col">
          <p class="pf-heading">{{ t('Contact_Us') }}</p>
          <div class="pf-contact"><v-icon size="16" color="#D4AF37">mdi-email-outline</v-icon><span>info@orkod.com</span></div>
          <div class="pf-contact"><v-icon size="16" color="#D4AF37">mdi-phone-outline</v-icon><span>+212 600 000 000</span></div>
          <div class="pf-contact"><v-icon size="16" color="#D4AF37">mdi-map-marker-outline</v-icon><span>Casablanca, Morocco</span></div>
        </div>
      </div>

      <div class="pf-bottom">
        <span>&copy; {{ currentYear }} Orkod. {{ t('All_Rights_Reserved') }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const currentYear = computed(() => new Date().getFullYear());
const textDirection = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'));
const logo = computed(() => new URL('@/static/OrkodLogo.png', import.meta.url).href);
</script>

<style scoped lang="scss">
.public-footer {
  position: relative;
  background:
    radial-gradient(ellipse 60% 50% at 85% 0%, rgba(212, 175, 55, 0.12), transparent 55%),
    radial-gradient(ellipse 50% 45% at 0% 100%, rgba(212, 175, 55, 0.05), transparent 55%),
    #0B0718;
  border-top: 1px solid rgba(212, 175, 55, 0.34);
}

.pf-inner {
  width: min(100% - 32px, 1280px);
  margin-inline: auto;
  padding-block: 64px 24px;
}

.pf-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 40px;
  padding-bottom: 40px;
}

.pf-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.pf-brand-logo {
  height: 40px;
  width: 40px;
  object-fit: contain;
}

.pf-brand-name {
  font-family: var(--font-family-latin);
  font-weight: 800;
  font-size: 1.4rem;
  color: #F3EFFC;
  line-height: 1;
}

.pf-brand-dot {
  color: #D4AF37;
}

.pf-tagline {
  font-size: 0.9rem;
  line-height: 1.8;
  color: rgba(240, 236, 250, 0.58);
  max-width: 300px;
  margin: 0 0 20px;
}

.pf-socials {
  display: flex;
  gap: 10px;
}

.pf-social {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 236, 250, 0.04);
  color: rgba(240, 236, 250, 0.7);
  border: 1px solid rgba(212, 175, 55, 0.3);
  text-decoration: none;
  transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
}

.pf-social:hover {
  background: var(--gradient-gold);
  border-color: transparent;
  color: #1c1327;
}

.pf-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pf-heading {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 8px;
}

.pf-link {
  color: rgba(240, 236, 250, 0.64);
  text-decoration: none;
  font-size: 0.9rem;
  line-height: 1.5;
  transition: color 180ms ease;
  width: fit-content;
  /* The 0.9rem/1.5 line box is only ~22px tall, under the 24px WCAG 2.2 AA
     minimum target size. Vertical padding grows the hit area while keeping the
     visual type size and column rhythm unchanged. */
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 2px 0;
}

.pf-link:hover {
  color: #E9C766;
}

@media (pointer: coarse) {
  /* Comfortable thumb target on touch devices. */
  .pf-link {
    min-height: 44px;
    padding: 6px 0;
  }
}

.pf-link:hover {
  color: #E9C766;
}

.pf-contact {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(240, 236, 250, 0.7);
  font-size: 0.9rem;
}

.pf-bottom {
  border-top: 1px solid rgba(240, 236, 250, 0.1);
  padding-block: 22px;
  text-align: center;
  font-size: 0.8125rem;
  color: rgba(240, 236, 250, 0.45);
}

@media (max-width: 960px) {
  .pf-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
}

@media (max-width: 600px) {
  .pf-grid { grid-template-columns: 1fr; gap: 28px; }
  .pf-inner { padding-block: 40px 16px; }
}
</style>