<template>
  <div>
    <template v-if="course">
      <PageHero
        eyebrow="Academy_Eyebrow"
        :title="t(course.titleKey)"
        :subtitle="t(course.descriptionKey)"
        back-to="/academy"
        back-label="Academy_Back_Link"
      >
        <template #breadcrumb>{{ t('Academy_Title') }}</template>
      </PageHero>

      <section class="ct-section">
        <div class="ct-inner">
          <div class="ct-layout">
            <main class="ct-main">
              <div class="ct-block">
                <p class="ct-about">{{ t(course.descriptionKey) }}</p>
              </div>

              <div class="ct-block" v-if="course.modules.length">
                <div class="ct-block-head">
                  <span class="ct-badge"><v-icon size="22">mdi-playlist-check</v-icon></span>
                  <h2 class="ct-title">{{ t('Academy_Modules_Title') }}</h2>
                </div>
                <div class="ct-modules">
                  <div v-for="(mod, i) in course.modules" :key="i" class="ct-module stagger-in" :style="{ '--i': i }">
                    <h3 class="ct-module-title">{{ mod.title }}</h3>
                    <ul class="ct-list">
                      <li v-for="item in mod.items" :key="item">
                        <v-icon size="16" class="ct-li-ico">mdi-check-circle-outline</v-icon>
                        <span>{{ item }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="ct-block">
                <div class="ct-block-head">
                  <span class="ct-badge"><v-icon size="22">mdi-lightbulb-on-outline</v-icon></span>
                  <h2 class="ct-title">{{ t('Academy_What_Youll_Learn') }}</h2>
                </div>
                <ul class="ct-list">
                  <li v-for="n in 3" :key="n">
                    <v-icon size="16" class="ct-li-ico">mdi-check-circle-outline</v-icon>
                    {{ t('Academy_Bullet_' + n) }}
                  </li>
                </ul>
              </div>

              <Disclaimer variant="notice" class="ct-disclaimer">
                {{ t('Academy_Disclaimer') }}
              </Disclaimer>

              <div class="ct-note">
                <v-icon size="22" class="ct-note-ico">mdi-school-outline</v-icon>
                <div>
                  <h3 class="ct-note-title">{{ t('Academy_Coming') }}</h3>
                  <p class="ct-note-desc">{{ t('Academy_Coming_desc') }}</p>
                </div>
              </div>
            </main>

            <aside class="ct-side">
              <div class="ct-card">
                <span
                  class="ct-cover"
                  :style="{ background: 'linear-gradient(135deg, ' + course.accent.from + ' 0%, ' + course.accent.to + ' 100%)' }"
                >
                  <v-icon size="40" color="#fff">{{ course.icon }}</v-icon>
                </span>
                <p class="ct-side-label">{{ t('Academy_Category') }}</p>
                <span class="ct-level-pill">{{ t(courseCategoryLabelKey(course.category)) }}</span>
                <ul class="ct-facts">
                  <li>
                    <v-icon size="18">mdi-calendar-clock</v-icon>
                    <div>
                      <strong>{{ t('Academy_Course_Duration', { days: course.days }) }}</strong>
                      <em>{{ t('Academy_Duration_Note') }}</em>
                    </div>
                  </li>
                  <li>
                    <v-icon size="18">mdi-playlist-check</v-icon>
                    <div>
                      <strong>{{ t('Academy_Course_Lessons', { count: course.lessons }) }}</strong>
                      <em>{{ t('Academy_Lessons_Note') }}</em>
                    </div>
                  </li>
                  <li>
                    <v-icon size="18">mdi-signal-cellular-2</v-icon>
                    <div>
                      <strong>{{ t(course.levelKey) }}</strong>
                      <em>{{ t('Academy_Level') }}</em>
                    </div>
                  </li>
                </ul>
                <v-btn
                  color="primary"
                  size="large"
                  rounded="pill"
                  elevation="0"
                  block
                  to="/contact"
                >
                  {{ t('Academy_Enquire') }}
                </v-btn>
                <v-btn
                  variant="outlined"
                  color="primary"
                  rounded="pill"
                  block
                  to="/booking"
                >
                  {{ t('Consultations_Book') }}
                </v-btn>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </template>

    <v-container v-else class="ct-state">
      <v-empty-state :title="t('Academy_NotFound')" icon="mdi-school-outline">
        <v-btn color="primary" rounded="pill" to="/academy">{{ t('Academy_Back_Link') }}</v-btn>
      </v-empty-state>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import { getCourse, type AcademyCategory } from '@/data/academy';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const course = computed(() => getCourse(String(route.params.slug)));

function courseCategoryLabelKey(category: AcademyCategory): string {
  return 'Academy_Category_' + category;
}

onMounted(() => {
  if (!course.value) router.replace('/academy');
});
</script>

<style scoped lang="scss">
.ct-section {
  padding-block: clamp(56px, 8vw, 96px);
  background: #0B0718;
  color: #F3EFFC;
}

.ct-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

.ct-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 36px;
  align-items: start;
}

.ct-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.ct-block {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 26px;
}

.ct-about {
  font-size: 0.98rem;
  line-height: 1.75;
  color: rgba(240, 236, 250, 0.75);
  margin: 0;
}

.ct-block-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ct-badge {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.ct-title {
  font-size: 1.3rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0;
}

html[dir="ltr"] .ct-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.ct-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ct-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.94rem;
  line-height: 1.6;
  color: #F3EFFC;
}

.ct-modules {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ct-module {
  padding-bottom: 18px;
  border-bottom: 1px dashed rgba(240, 236, 250, 0.14);
}

.ct-module:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.ct-module-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #E9C766;
  margin: 0 0 10px;
}

html[dir="ltr"] .ct-module-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.ct-disclaimer {
  margin: 0;
}

.ct-li-ico {
  margin-top: 4px;
  color: #D4AF37;
}

.ct-note {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 20px 24px;
  background: #0B0718;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 3px;
}

.ct-note-ico {
  margin-top: 2px;
  color: #D4AF37;
}

.ct-note-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #F3EFFC;
  margin: 0 0 4px;
}

html[dir="ltr"] .ct-note-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.ct-note-desc {
  font-size: 0.88rem;
  line-height: 1.6;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
}

.ct-side {
  position: sticky;
  top: 88px;
}

.ct-card {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ct-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
}

.ct-cover .v-icon {
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
}

.ct-card > .ct-side-label,
.ct-card > .ct-level-pill,
.ct-card > .ct-facts,
.ct-card > .v-btn {
  margin-inline: 22px;
}

.ct-card > :first-child:not(.ct-cover) {
  margin-top: 22px;
}

.ct-card > .v-btn:last-child {
  margin-bottom: 22px;
}

.ct-facts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ct-facts li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.ct-facts .v-icon {
  margin-top: 2px;
  color: #D4AF37;
}

.ct-facts strong {
  display: block;
  font-size: 0.92rem;
  font-weight: 600;
  color: #F3EFFC;
}

.ct-facts em {
  display: block;
  font-style: normal;
  font-size: 0.78rem;
  color: rgba(240, 236, 250, 0.55);
}

.ct-side-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0;
}

.ct-level-pill {
  align-self: flex-start;
  display: inline-flex;
  color: #E9C766;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 2px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
}

.ct-card .v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.ct-state {
  padding-block: 72px;
}

@media (max-width: 960px) {
  .ct-layout {
    grid-template-columns: 1fr;
  }

  .ct-side {
    position: static;
  }
}
</style>