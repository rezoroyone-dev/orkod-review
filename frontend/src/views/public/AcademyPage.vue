<template>
  <div>
    <PageHero
      eyebrow="Academy_Eyebrow"
      :title="t('Academy_Title')"
      :subtitle="t('Academy_Subtitle')"
    />

    <section class="ac-section">
      <div class="ac-inner">
        <!-- Featured course hero -->
        <div class="ac-featured" v-reveal.up v-if="featuredCourse">
          <router-link :to="'/academy/' + featuredCourse.slug" class="ac-featured-link">
            <div class="ac-featured-visual">
              <div class="ac-featured-badge">{{ t('Academy_Featured') }}</div>
              <div class="ac-featured-icon" :style="{ background: 'linear-gradient(135deg, ' + featuredCourse.accent.from + ' 0%, ' + featuredCourse.accent.to + ' 100%)' }">
                <v-icon size="48" color="#fff">{{ featuredCourse.icon }}</v-icon>
              </div>
            </div>
            <div class="ac-featured-content">
              <span class="ac-category">{{ t(courseCategoryLabelKey(featuredCourse.category)) }}</span>
              <h2 class="ac-featured-title">{{ t(featuredCourse.titleKey) }}</h2>
              <p class="ac-featured-desc">{{ t(featuredCourse.descriptionKey) }}</p>
              <ul class="ac-featured-meta">
                <li><v-icon size="18">mdi-calendar-clock</v-icon> {{ t('Academy_Course_Duration', { days: featuredCourse.days }) }}</li>
                <li><v-icon size="18">mdi-playlist-check</v-icon> {{ t('Academy_Course_Lessons', { count: featuredCourse.lessons }) }}</li>
                <li><v-icon size="18">mdi-signal-cellular-2</v-icon> {{ t(featuredCourse.levelKey) }}</li>
              </ul>
              <v-btn
                variant="outlined"
                color="primary"
                rounded="pill"
                size="large"
                class="ac-featured-cta pressable"
                :to="'/academy/' + featuredCourse.slug"
              >
                {{ t('Academy_Enquire') }}
                <v-icon end size="20">mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </router-link>
        </div>

        <!-- Filters -->
        <div class="ac-filters" role="group" :aria-label="t('Academy_Filter_Label')" v-reveal.up :style="{ '--reveal-delay': '100ms' }">
          <button
            type="button"
            class="ac-filter"
            :class="{ selected: activeCategory === null }"
            @click="activeCategory = null"
          >
            {{ t('Academy_All') }}
          </button>
          <button
            v-for="cat in ACADEMY_CATEGORIES"
            :key="cat.key"
            type="button"
            class="ac-filter"
            :class="{ selected: activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >
            {{ t(cat.labelKey) }}
          </button>
        </div>

        <!-- Courses grid -->
        <div class="ac-grid">
          <article
            v-for="course in filteredCourses"
            :key="course.slug"
            class="ac-card card-interactive"
            v-reveal
            :style="{ '--reveal-delay': `${(indexOf(course) % 8) * 60}ms` }"
          >
            <router-link :to="'/academy/' + course.slug" class="ac-card-main">
              <span
                class="ac-banner"
                :style="{ background: 'linear-gradient(135deg, ' + course.accent.from + ' 0%, ' + course.accent.to + ' 100%)' }"
              >
                <v-icon size="40" color="#fff">{{ course.icon }}</v-icon>
              </span>
              <div class="ac-body">
                <span class="ac-category">{{ t(courseCategoryLabelKey(course.category)) }}</span>
                <h2 class="ac-title">{{ t(course.titleKey) }}</h2>
                <p class="ac-desc">{{ t(course.descriptionKey) }}</p>
                <ul class="ac-meta">
                  <li>
                    <v-icon size="16">mdi-calendar-clock</v-icon>
                    {{ t('Academy_Course_Duration', { days: course.days }) }}
                  </li>
                  <li>
                    <v-icon size="16">mdi-playlist-check</v-icon>
                    {{ t('Academy_Course_Lessons', { count: course.lessons }) }}
                  </li>
                  <li>
                    <v-icon size="16">mdi-signal-cellular-2</v-icon>
                    {{ t(course.levelKey) }}
                  </li>
                </ul>
              </div>
            </router-link>
            <div class="ac-foot">
              <span class="ac-level">{{ t(course.levelKey) }}</span>
              <v-btn
                variant="outlined"
                color="primary"
                rounded="pill"
                size="small"
                class="ac-cta pressable"
                :to="'/academy/' + course.slug"
              >
                {{ t('Academy_Enquire') }}
              </v-btn>
            </div>
          </article>
        </div>

        <p class="ac-indicative">{{ t('Academy_Indicative') }}</p>

        <!-- Coming soon -->
        <div class="ac-coming" v-reveal.up :style="{ '--reveal-delay': '200ms' }">
          <v-icon size="24" color="primary">mdi-school-outline</v-icon>
          <div>
            <h3 class="ac-coming-title">{{ t('Academy_Coming') }}</h3>
            <p class="ac-coming-desc">{{ t('Academy_Coming_desc') }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';
import {
  ACADEMY_CATEGORIES,
  ACADEMY_COURSES,
  type AcademyCategory,
} from '@/data/academy';

const { t } = useI18n();
const activeCategory = ref<AcademyCategory | null>(null);

const filteredCourses = computed(() =>
  activeCategory.value
    ? ACADEMY_COURSES.filter((c) => c.category === activeCategory.value)
    : ACADEMY_COURSES
);

const featuredCourse = computed(() => filteredCourses.value[0]);

function indexOf(course: typeof ACADEMY_COURSES[0]): number {
  return filteredCourses.value.findIndex((c) => c.slug === course.slug);
}

function courseCategoryLabelKey(category: AcademyCategory): string {
  return 'Academy_Category_' + category;
}
</script>

<style scoped lang="scss">
.ac-section {
  position: relative;
  padding-block: clamp(64px, 9vw, 112px);
  background: #0B0718;
  color: #F3EFFC;
}

.ac-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

/* Featured */
.ac-featured {
  margin-bottom: 56px;
  border-radius: 3px;
  overflow: hidden;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
}

.ac-featured-link {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) 1fr;
  gap: 0;
  text-decoration: none;
  color: inherit;
}

.ac-featured-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(90% 110% at 30% 20%, rgba(139, 92, 246, 0.14), transparent 60%),
    #0B0718;
  padding: 64px;
  min-height: 380px;
}

.ac-featured-badge {
  position: absolute;
  top: 28px;
  inset-inline-start: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--gradient-gold);
  color: #1c1327;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 2px;
}

.ac-featured-icon {
  width: 140px;
  height: 140px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.ac-featured-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px 56px;
  max-width: 640px;
}

.ac-featured-content .ac-category {
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #D4AF37;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.32);
  border-radius: 2px;
  padding: 6px 14px;
  margin-bottom: 18px;
}

.ac-featured-title {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 500;
  line-height: 1.08;
  color: #F3EFFC;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}

html[dir="ltr"] .ac-featured-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.ac-featured-desc {
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(240, 236, 250, 0.62);
  margin: 0 0 24px;
  max-width: 580px;
}

.ac-featured-meta {
  list-style: none;
  margin: 0 0 28px;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 28px;
}

.ac-featured-meta li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(240, 236, 250, 0.62);
}

.ac-featured-meta .v-icon { color: #D4AF37; }

.ac-featured-cta {
  align-self: flex-start;
  padding-block: 18px;
  padding-inline: 36px;
  font-size: 1rem;
}

@media (max-width: 960px) {
  .ac-featured-link { grid-template-columns: 1fr; }
  .ac-featured-visual { min-height: 280px; padding: 48px 40px; }
  .ac-featured-content { padding: 40px 36px; }
}

@media (max-width: 600px) {
  .ac-featured-visual { min-height: 220px; padding: 32px 24px; }
  .ac-featured-icon { width: 100px; height: 100px; }
  .ac-featured-content { padding: 28px 20px; }
}

/* Filters */
.ac-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 32px;
  justify-content: center;
}

.ac-filter {
  cursor: pointer;
  border: 1px solid rgba(240, 236, 250, 0.16);
  background: transparent;
  color: #F3EFFC;
  border-radius: 2px;
  padding: 10px 20px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease;
}

.ac-filter:hover {
  border-color: #D4AF37;
  color: #D4AF37;
}

.ac-filter.selected {
  border-color: transparent;
  background: linear-gradient(135deg, #f1d27a 0%, #d4af37 100%);
  color: #1c1327;
}

/* Grid */
.ac-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.ac-card {
  display: flex;
  flex-direction: column;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  overflow: hidden;
  transition: border-color 240ms var(--ease-out), transform 240ms var(--ease-out);
}

.ac-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.ac-card-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  text-decoration: none;
}

.ac-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 130px;
  background: var(--color-turquoise);
  overflow: hidden;
}

.ac-banner .v-icon {
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25));
}

.ac-card:hover .ac-banner .v-icon {
  transform: none;
}

.ac-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  padding: 28px;
}

.ac-body .ac-category {
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #E9C766;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 2px;
  padding: 5px 12px;
}

.ac-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0;
  line-height: 1.25;
}

html[dir="ltr"] .ac-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.ac-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ac-meta {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.ac-meta li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-charcoal-light);
}

.ac-meta .v-icon {
  color: #D4AF37;
}

.ac-indicative {
  font-size: 0.82rem;
  line-height: 1.6;
  color: rgba(240, 236, 250, 0.55);
  margin: 28px 0 0;
  padding: 16px 20px;
  background: transparent;
  border: 1px dashed rgba(240, 236, 250, 0.2);
  border-radius: 3px;
}

.ac-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid rgba(240, 236, 250, 0.1);
  background: transparent;
}

.ac-level {
  font-size: 0.78rem;
  font-weight: 700;
  color: #E9C766;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 2px;
  padding: 5px 12px;
}

.ac-cta {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.ac-coming {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-top: 48px;
  padding: 28px 32px;
  background: #0B0718;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
}

.ac-coming-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 6px;
}

.ac-coming-desc {
  font-size: 0.95rem;
  line-height: 1.65;
  color: rgba(240, 236, 250, 0.6);
  margin: 0;
}

@media (max-width: 600px) {
  .ac-featured-content { padding: 28px 20px; }
  .ac-filters { gap: 8px; }
  .ac-filter { padding: 8px 16px; font-size: 0.8rem; }
  .ac-grid { grid-template-columns: 1fr; }
  .ac-card-main { padding: 20px; }
}
</style>