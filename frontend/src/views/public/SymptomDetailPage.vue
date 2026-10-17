<template>
  <div>
    <template v-if="content">
      <PageHero
        eyebrow="Symptom_Breadcrumb"
        :title="content.title"
        :subtitle="content.summary"
        back-to="/symptoms"
        back-label="Symptom_Back_Link"
      >
        <template #breadcrumb>{{ content.region }}</template>
      </PageHero>

      <section class="sd-section">
      <div class="sd-inner">
        <div class="sd-layout">
          <article class="sd-main">
            <section class="sd-block" v-reveal>
              <div class="sd-block-head">
                <span class="sd-badge"><v-icon size="22">mdi-account-question-outline</v-icon></span>
                <div>
                  <h2 class="sd-title">{{ t('Symptom_Causes_Title') }}</h2>
                  <p class="sd-note">{{ t('Symptom_Causes_Note') }}</p>
                </div>
              </div>
              <ul class="sd-list">
                <li v-for="cause in content.causes" :key="cause">
                  <v-icon size="16" class="sd-li-ico">mdi-minus</v-icon>
                  <span>{{ cause }}</span>
                </li>
              </ul>
            </section>

            <section class="sd-block" v-reveal :style="{ '--reveal-delay': '60ms' }">
              <div class="sd-block-head">
                <span class="sd-badge sd-badge--green"><v-icon size="22">mdi-heart-pulse</v-icon></span>
                <div>
                  <h2 class="sd-title">{{ t('Symptom_Approach_Title') }}</h2>
                  <p class="sd-note">{{ t('Symptom_Approach_Note') }}</p>
                </div>
              </div>
              <ol class="sd-steps">
                <li
                  v-for="(step, i) in content.approach"
                  :key="step"
                  class="stagger-in"
                  :style="{ '--i': i }"
                >{{ step }}</li>
              </ol>
            </section>

            <section class="sd-block sd-block--selfcare" v-reveal :style="{ '--reveal-delay': '90ms' }">
              <div class="sd-block-head">
                <span class="sd-badge sd-badge--turquoise"><v-icon size="22">mdi-spa-outline</v-icon></span>
                <div>
                  <h2 class="sd-title">{{ t('Symptom_Selfcare_Title') }}</h2>
                  <p class="sd-note">{{ t('Symptom_Selfcare_Note') }}</p>
                </div>
              </div>
              <div class="sd-self-grid">
                <div class="sd-self-item">
                  <h3 class="sd-self-title">
                    <v-icon size="18" class="sd-self-ico">mdi-human-handsdown</v-icon>
                    {{ t('Symptom_Exercises_Title') }}
                  </h3>
                  <ul class="sd-self-list">
                    <li v-for="e in content.exercises" :key="e">{{ e }}</li>
                  </ul>
                </div>
                <div class="sd-self-item">
                  <h3 class="sd-self-title">
                    <v-icon size="18" class="sd-self-ico">mdi-meditation</v-icon>
                    {{ t('Symptom_Meditation_Title') }}
                  </h3>
                  <p class="sd-self-text">{{ content.meditation }}</p>
                </div>
                <div class="sd-self-item">
                  <h3 class="sd-self-title">
                    <v-icon size="18" class="sd-self-ico">mdi-sofa-outline</v-icon>
                    {{ t('Symptom_Relaxation_Title') }}
                  </h3>
                  <p class="sd-self-text">{{ content.relaxation }}</p>
                </div>
                <div class="sd-self-item">
                  <h3 class="sd-self-title">
                    <v-icon size="18" class="sd-self-ico">mdi-silverware-fork-knife</v-icon>
                    {{ t('Symptom_Nutrition_Title') }}
                  </h3>
                  <p class="sd-self-text">{{ content.nutrition }}</p>
                </div>
              </div>
            </section>

            <section class="sd-block sd-block--urgent" v-reveal :style="{ '--reveal-delay': '150ms' }">
              <div class="sd-block-head">
                <span class="sd-badge sd-badge--red"><v-icon size="22">mdi-alert-octagon-outline</v-icon></span>
                <div>
                  <h2 class="sd-title">{{ t('Symptom_RedFlags_Title') }}</h2>
                  <p class="sd-note">{{ t('Symptom_RedFlags_Note') }}</p>
                </div>
              </div>
              <ul class="sd-list">
                <li v-for="flag in content.redFlags" :key="flag">
                  <v-icon size="16" class="sd-li-ico sd-li-ico--red">mdi-alert-circle</v-icon>
                  <strong class="sd-flag-text">{{ flag }}</strong>
                </li>
              </ul>
            </section>

            <section class="sd-block sd-block--risk" v-reveal :style="{ '--reveal-delay': '210ms' }">
              <div class="sd-block-head">
                <span class="sd-badge sd-badge--gold"><v-icon size="22">mdi-shield-alert-outline</v-icon></span>
                <div>
                  <h2 class="sd-title">{{ t('Symptom_Risk_Title') }}</h2>
                  <p class="sd-note">{{ t('Symptom_Risk_Note') }}</p>
                </div>
              </div>
              <ul class="sd-list">
                <li v-for="factor in content.riskFactors" :key="factor">
                  <v-icon size="16" class="sd-li-ico sd-li-ico--gold">mdi-circle-small</v-icon>
                  <span>{{ factor }}</span>
                </li>
              </ul>
            </section>

            <section class="sd-block sd-block--doctor" v-reveal :style="{ '--reveal-delay': '180ms' }">
              <div class="sd-block-head">
                <span class="sd-badge sd-badge--red"><v-icon size="22">mdi-stethoscope</v-icon></span>
                <div>
                  <h2 class="sd-title">{{ t('Symptom_Doctor_Title') }}</h2>
                  <p class="sd-note">{{ t('Symptom_Doctor_Note') }}</p>
                </div>
              </div>
              <ul class="sd-list">
                <li v-for="sign in content.seeDoctor" :key="sign">
                  <v-icon size="16" class="sd-li-ico sd-li-ico--red">mdi-alert-circle-outline</v-icon>
                  <span>{{ sign }}</span>
                </li>
              </ul>
              <p class="sd-doctor-hint">
                <v-icon size="16">mdi-information-outline</v-icon>
                {{ t('Symptom_Doctor_Red_Line') }}
              </p>
            </section>

            <aside class="sd-tip" v-reveal :style="{ '--reveal-delay': '240ms' }">
              <v-icon size="22" class="sd-tip-ico">mdi-lightbulb-on-outline</v-icon>
              <div>
                <h3 class="sd-tip-title">{{ t('Symptom_Tip_Title') }}</h3>
                <p class="sd-tip-text">{{ content.tip }}</p>
              </div>
            </aside>

            <section class="sd-block sd-block--complementary" v-reveal :style="{ '--reveal-delay': '300ms' }">
              <div class="sd-block-head">
                <span class="sd-badge sd-badge--turquoise"><v-icon size="22">mdi-leaf</v-icon></span>
                <div>
                  <h2 class="sd-title">{{ t('Symptom_Complementary_Title') }}</h2>
                  <p class="sd-note">{{ t('Symptom_Complementary_Note') }}</p>
                </div>
              </div>
              <div class="sd-comp-grid">
                <div v-for="(item, i) in complementaryApproaches" :key="item" class="sd-comp-item stagger-in" :style="{ '--i': i }">
                  <v-icon size="18" class="sd-comp-ico">mdi-check-circle-outline</v-icon>
                  <span>{{ item }}</span>
                </div>
              </div>
              <p class="sd-doctor-hint">
                <v-icon size="16">mdi-information-outline</v-icon>
                {{ t('Symptom_Complementary_Disclaimer') }}
              </p>
            </section>

            <div class="sd-red-flags">
              <Disclaimer variant="redflags" />
            </div>
          </article>

          <aside class="sd-side">
            <div class="sd-card" v-reveal :style="{ '--reveal-delay': '140ms' }">
              <p class="sd-side-label">{{ t('Symptom_Region_Label') }}</p>
              <div class="sd-region-pill">{{ content.region }}</div>
              <v-btn
                to="/booking"
                color="primary"
                size="large"
                rounded="pill"
                elevation="0"
                block
                class="sd-cta pressable"
              >
                {{ t('Symptom_Book_CTA') }}
              </v-btn>
              <v-btn
                to="/practitioners"
                variant="outlined"
                color="primary"
                size="large"
                rounded="pill"
                block
                class="sd-cta-secondary"
              >
                {{ t('Healers') }}
              </v-btn>
            </div>

            <Disclaimer variant="notice" class="sd-side-dis">
              {{ t('Symptoms_Disclaimer') }}
            </Disclaimer>
          </aside>
        </div>

        <section v-if="relatedTopics.length" class="sd-related">
          <h2 class="sd-related-title">{{ t('Explore_Eyebrow') }}</h2>
          <div class="sym-grid">
            <router-link
              v-for="(topic, i) in relatedTopics"
              :key="topic.slug"
              class="topic-card hover-lift-premium hover-zoom-img"
              :to="'/symptoms/' + topic.slug"
              v-reveal
              :style="{ '--reveal-delay': `${i * 70}ms` }"
            >
              <span class="tc-icon"><v-icon size="26">{{ topic.icon }}</v-icon></span>
              <div class="tc-body">
                <h3 class="tc-title">{{ contentOf(topic).title }}</h3>
                <p class="tc-summary">{{ contentOf(topic).summary }}</p>
                <span class="tc-link">{{ t('Symptoms_Topic_Guide') }}</span>
              </div>
            </router-link>
          </div>
        </section>
      </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import { getTopic, TOPICS, type LangCode, type Topic } from '@/data/wellness';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const topic = computed(() => getTopic(String(route.params.slug)));
if (!topic.value) router.replace('/symptoms');

const content = computed(() => {
  if (!topic.value) return null;
  const lang = (locale.value as LangCode) in topic.value.content ? (locale.value as LangCode) : 'en';
  return topic.value.content[lang];
});

const relatedTopics = computed(() => {
  if (!topic.value) return [];
  return TOPICS.filter((t) => t.region === topic.value!.region && t.slug !== topic.value!.slug).slice(0, 3);
});

const complementaryApproaches = computed(() => {
  const keys = ['Symptom_Complementary_1', 'Symptom_Complementary_2', 'Symptom_Complementary_3', 'Symptom_Complementary_4'];
  return keys.map((k) => t(k));
});

function contentOf(t: Topic) {
  const lang = (locale.value as LangCode) in t.content ? (locale.value as LangCode) : 'en';
  return t.content[lang];
}
</script>

<style scoped lang="scss">
.sd-section {
  padding-block: clamp(56px, 8vw, 96px);
  background: #0B0718;
  color: #F3EFFC;
}

.sd-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

.sd-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 36px;
  align-items: start;
}

.sd-main {
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-width: 0;
}

.sd-block {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 26px;
}

.sd-block-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.sd-badge {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.sd-badge--green {
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
}

.sd-badge--turquoise {
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
}

.sd-badge--gold {
  color: #1c1327;
  background: linear-gradient(135deg, #f1d27a, #d4af37);
  box-shadow: none;
}

.sd-badge--red {
  color: #fff;
  background: linear-gradient(135deg, #d9534f 0%, #b03a37 100%);
  box-shadow: none;
}

.sd-title {
  font-size: 1.3rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 4px;
}

html[dir="ltr"] .sd-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.sd-note {
  font-size: 0.84rem;
  color: rgba(240, 236, 250, 0.55);
  margin: 0;
}

.sd-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sd-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #F3EFFC;
}

.sd-li-ico {
  margin-top: 4px;
  color: #D4AF37;
}

.sd-li-ico--gold {
  color: #D4AF37;
}

.sd-li-ico--red {
  color: #b03a37;
}

.sd-block--risk {
  border-color: rgba(212, 175, 55, 0.34);
}

.sd-block--doctor {
  border-color: rgba(217, 83, 79, 0.32);
}

.sd-block--complementary {
  border-color: rgba(212, 175, 55, 0.3);
}

.sd-block--urgent {
  border-color: rgba(217, 83, 79, 0.4);
}

.sd-flag-text {
  font-weight: 700;
}

.sd-self-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.sd-self-item {
  background: #0B0718;
  border: 1px solid rgba(212, 175, 55, 0.22);
  border-radius: 3px;
  padding: 18px;
}

.sd-self-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.98rem;
  font-weight: 600;
  color: #E9C766;
  margin: 0 0 10px;
}

.sd-self-ico {
  color: #D4AF37;
}

.sd-self-list {
  margin: 0;
  padding-inline-start: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.88rem;
  line-height: 1.55;
  color: #F3EFFC;
}

.sd-self-text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: #F3EFFC;
}

.sd-doctor-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px dashed rgba(212, 175, 55, 0.3);
  font-size: 0.85rem;
  line-height: 1.55;
  color: rgba(240, 236, 250, 0.6);
}

.sd-comp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.sd-comp-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #0B0718;
  border: 1px solid rgba(212, 175, 55, 0.22);
  border-radius: 3px;
  padding: 14px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
  color: #F3EFFC;
}

.sd-comp-ico {
  color: #D4AF37;
  margin-top: 2px;
  flex-shrink: 0;
}

.sd-steps {
  margin: 0;
  padding-inline-start: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #F3EFFC;
}

.sd-tip {
  display: flex;
  gap: 14px;
  background: #0B0718;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 3px;
  padding: 20px 22px;
}

.sd-tip-ico {
  color: #D4AF37;
  margin-top: 2px;
}

.sd-tip-title {
  font-size: 0.98rem;
  font-weight: 600;
  color: #E9C766;
  margin: 0 0 4px;
}

.sd-tip-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #4a3612;
  margin: 0;
}

.sd-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: sticky;
  top: 88px;
}

.sd-card {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sd-side-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0;
}

.sd-region-pill {
  display: inline-flex;
  align-self: flex-start;
  background: rgba(212, 175, 55, 0.1);
  color: #F3EFFC;
  border: 1px solid rgba(212, 175, 55, 0.34);
  border-radius: 2px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
}

.sd-cta,
.sd-cta-secondary {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.sd-related {
  margin-top: 48px;
}

.sd-related-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 18px;
}

html[dir="ltr"] .sd-related-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.sym-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.topic-card {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  text-decoration: none;
  transition: border-color 200ms ease, transform 200ms ease;
}

.topic-card:hover {
  border-color: #D4AF37;
  transform: translateY(-2px);
}

.tc-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.tc-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #F3EFFC;
  margin: 0 0 6px;
}

.tc-summary {
  font-size: 0.84rem;
  line-height: 1.6;
  color: rgba(240, 236, 250, 0.6);
  margin: 0 0 8px;
}

.tc-link {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #D4AF37;
}

@media (max-width: 960px) {
  .sd-layout {
    grid-template-columns: 1fr;
  }

  .sd-side {
    position: static;
  }
}
</style>