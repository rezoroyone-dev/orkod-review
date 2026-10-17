<template>
  <div>
    <PageHero
      eyebrow="Assistant_Eyebrow"
      :title="t('Assistant_Title')"
      :subtitle="t('Assistant_Subtitle')"
    />

    <section class="as-section">
      <div class="as-inner">
        <div class="as-preview-banner">
          <v-icon size="20">mdi-flask-outline</v-icon>
          <span>{{ t('Assistant_Demo') }}</span>
        </div>

        <div class="as-card">
          <div class="as-header">
            <span class="as-avatar"><v-icon size="22">mdi-robot-happy-outline</v-icon></span>
            <div>
              <p class="as-header-name">{{ t('Assistant_Title') }}</p>
              <p class="as-header-status">
                <span class="as-dot"></span>
                {{ t('Assistant_Status') }}
              </p>
            </div>
          </div>

          <div class="as-body">
            <!-- Result screen -->
            <template v-if="done">
              <Transition name="as-fade-up" appear>
                <div v-if="redFlag" class="as-red stagger-in" style="--i: 0">
                  <span class="as-red-ico"><v-icon size="30">mdi-alert-decagram-outline</v-icon></span>
                  <h2 class="as-red-title">{{ t('Assistant_Red_Flag_Title') }}</h2>
                  <p class="as-red-desc">{{ t('Assistant_Red_Flag_Desc') }}</p>
                </div>
              </Transition>

              <Transition name="as-fade-up" appear>
                <h2 class="as-result-title stagger-in" style="--i: 1">
                  <v-icon size="22" class="as-result-ico">mdi-compass-outline</v-icon>
                  {{ t('Assistant_Result_Title') }}
                </h2>
              </Transition>

              <Transition name="as-fade-up" appear>
                <p class="as-result-preview stagger-in" style="--i: 2">{{ t('Assistant_Preview_Note') }}</p>
              </Transition>

              <Transition name="as-fade-up" appear>
                <div v-if="guides.length" class="as-block stagger-in" style="--i: 3">
                  <p class="as-block-label">{{ t('Assistant_Guides_Title') }}</p>
                  <router-link
                    v-for="(g, i) in guides"
                    :key="g.slug"
                    class="as-guide stagger-in"
                    :style="{ '--i': i }"
                    :to="'/symptoms/' + g.slug"
                  >
                    <span class="as-guide-ico"><v-icon size="20">{{ g.icon }}</v-icon></span>
                    <span class="as-guide-body">
                      <strong>{{ g.title }}</strong>
                      <em>{{ t('Symptoms_Topic_Guide') }}</em>
                    </span>
                    <v-icon size="18" class="as-guide-arrow arrow-shift">mdi-arrow-right</v-icon>
                  </router-link>
                </div>
              </Transition>

              <Transition name="as-fade-up" appear>
                <div class="as-block stagger-in" style="--i: 4">
                  <p class="as-block-label">{{ t('Assistant_Next_Title') }}</p>
                  <div class="as-next">
                    <router-link class="as-next-item pressable" to="/practitioners">
                      <v-icon size="20">mdi-account-heart</v-icon>
                      <span>{{ t('Assistant_Next_Practitioners') }}</span>
                    </router-link>
                    <router-link class="as-next-item pressable" to="/consultations">
                      <v-icon size="20">mdi-message-text-outline</v-icon>
                      <span>{{ t('Assistant_Next_Consultations') }}</span>
                    </router-link>
                    <router-link class="as-next-item pressable" to="/academy">
                      <v-icon size="20">mdi-book-open-variant</v-icon>
                      <span>{{ t('Assistant_Next_Academy') }}</span>
                    </router-link>
                    <router-link class="as-next-item pressable" to="/booking">
                      <v-icon size="20">mdi-calendar-plus</v-icon>
                      <span>{{ t('Assistant_Next_Book') }}</span>
                    </router-link>
                  </div>
                </div>
              </Transition>
            </template>

            <!-- Question flow -->
            <template v-else>
              <Transition name="as-progress" mode="out-in">
                <div class="as-progress" :key="step">
                  <div class="as-progress-track" :style="{ width: progress + '%' }"></div>
                </div>
              </Transition>

              <Transition :name="questionTransitionName" mode="out-in">
                <div class="as-question-wrapper" :key="step">
                  <p class="as-step-label">{{ t('Assistant_Step_Label', { n: step + 1, total: QUESTIONS.length }) }}</p>
                  <h2 class="as-question">{{ t(QUESTIONS[step].titleKey) }}</h2>

                  <div v-if="QUESTIONS[step].multi" class="as-options as-options--multi">
                    <label
                      v-for="(opt, i) in QUESTIONS[step].options"
                      :key="opt.key"
                      class="as-opt stagger-in-scale"
                      :style="{ '--i': i }"
                      :class="{ selected: selection[QUESTIONS[step].key]?.includes(opt.key) }"
                    >
                      <input
                        v-model="selection[QUESTIONS[step].key]"
                        type="checkbox"
                        :value="opt.key"
                        class="as-opt-input"
                      />
                      <span>{{ t(opt.labelKey) }}</span>
                    </label>
                  </div>

                  <div v-else class="as-options">
                    <button
                      v-for="(opt, i) in QUESTIONS[step].options"
                      :key="opt.key"
                      type="button"
                      class="as-opt as-opt--btn stagger-in-scale pressable"
                      :style="{ '--i': i }"
                      :class="{ selected: selection[QUESTIONS[step].key] === opt.key }"
                      @click="selectOption(QUESTIONS[step].key, opt.key)"
                    >
                      <span>{{ t(opt.labelKey) }}</span>
                    </button>
                  </div>
                </div>
              </Transition>
            </template>
          </div>

          <div class="as-footer">
            <template v-if="!done">
              <v-btn v-if="step > 0" variant="text" @click="goBack" class="pressable">
                <v-icon start size="18" class="as-back-arrow">mdi-arrow-left</v-icon>
                {{ t('Assistant_Back') }}
              </v-btn>
              <div class="as-spacer" />
              <v-btn
                color="primary"
                rounded="pill"
                elevation="0"
                :disabled="!canProceed"
                @click="goNext"
                class="pressable sheen"
              >
                {{ step < QUESTIONS.length - 1 ? t('Assistant_Next') : t('Assistant_See_Results') }}
                <v-icon end size="18" class="arrow-shift">mdi-arrow-right</v-icon>
              </v-btn>
            </template>
            <v-btn v-else variant="outlined" color="primary" rounded="pill" @click="restart" class="pressable">
              <v-icon start size="18">mdi-restart</v-icon>
              {{ t('Assistant_Restart') }}
            </v-btn>
          </div>
        </div>

        <div class="as-disclaimer">
          <Disclaimer variant="notice">
            {{ t('Assistant_Result_Note') }}
          </Disclaimer>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import { getTopic } from '@/data/wellness';

const { t, locale } = useI18n();

interface AssistantOption {
  key: string;
  labelKey: string;
}

interface AssistantQuestion {
  key: string;
  titleKey: string;
  options: AssistantOption[];
  multi?: boolean;
}

const QUESTIONS: AssistantQuestion[] = [
  {
    key: 'region',
    titleKey: 'Assistant_Q1',
    options: [
      { key: 'head', labelKey: 'Assistant_Q1_Head' },
      { key: 'neck', labelKey: 'Assistant_Q1_Neck' },
      { key: 'shoulders', labelKey: 'Assistant_Q1_Shoulders' },
      { key: 'back', labelKey: 'Assistant_Q1_Back' },
      { key: 'abdomen', labelKey: 'Assistant_Q1_Abdomen' },
      { key: 'legs', labelKey: 'Assistant_Q1_Legs' },
      { key: 'whole', labelKey: 'Assistant_Q1_Whole' },
    ],
  },
  {
    key: 'duration',
    titleKey: 'Assistant_Q2',
    options: [
      { key: 'few-days', labelKey: 'Assistant_Q2_Days' },
      { key: 'few-weeks', labelKey: 'Assistant_Q2_Weeks' },
      { key: 'month', labelKey: 'Assistant_Q2_Month' },
      { key: 'comes-goes', labelKey: 'Assistant_Q2_Varies' },
    ],
  },
  {
    key: 'intensity',
    titleKey: 'Assistant_Q3',
    options: [
      { key: 'mild', labelKey: 'Assistant_Q3_Mild' },
      { key: 'noticeable', labelKey: 'Assistant_Q3_Noticeable' },
      { key: 'tiring', labelKey: 'Assistant_Q3_Tiring' },
      { key: 'worrying', labelKey: 'Assistant_Q3_Worrying' },
    ],
  },
  {
    key: 'redflags',
    titleKey: 'Assistant_Q4',
    multi: true,
    options: [
      { key: 'severe', labelKey: 'Assistant_Q4_Severe' },
      { key: 'chest', labelKey: 'Assistant_Q4_Chest' },
      { key: 'numbness', labelKey: 'Assistant_Q4_Numbness' },
      { key: 'fever', labelKey: 'Assistant_Q4_Fever' },
    ],
  },
  {
    key: 'support',
    titleKey: 'Assistant_Q5',
    options: [
      { key: 'understand', labelKey: 'Assistant_Q5_Understand' },
      { key: 'sessions', labelKey: 'Assistant_Q5_Sessions' },
      { key: 'human', labelKey: 'Assistant_Q5_Human' },
      { key: 'book', labelKey: 'Assistant_Q5_Book' },
      { key: 'unsure', labelKey: 'Assistant_Q5_Unsure' },
    ],
  },
];

const step = ref(0);
const done = ref(false);
const direction = ref<'forward' | 'backward'>('forward');

const selection = reactive<Record<string, any>>({
  region: '',
  duration: '',
  intensity: '',
  redflags: [] as string[],
  support: '',
});

const current = computed(() => QUESTIONS[step.value]);

const canProceed = computed(() => {
  const q = current.value;
  const v = selection[q.key];
  if (q.multi) return Array.isArray(v) && v.length > 0;
  return Boolean(v);
});

const progress = computed(() => ((step.value + 1) / QUESTIONS.length) * 100);

// Direction-aware transition name
const questionTransitionName = computed(() => {
  return direction.value === 'forward' ? 'as-slide-forward' : 'as-slide-backward';
});

function selectOption(questionKey: string, optionKey: string) {
  selection[questionKey] = optionKey;
}

function goNext() {
  if (!canProceed.value) return;
  if (step.value < QUESTIONS.length - 1) {
    direction.value = 'forward';
    step.value += 1;
  } else {
    done.value = true;
  }
}

function goBack() {
  if (step.value > 0) {
    direction.value = 'backward';
    step.value -= 1;
  }
}

function restart() {
  step.value = 0;
  done.value = false;
  direction.value = 'forward';
  selection.region = '';
  selection.duration = '';
  selection.intensity = '';
  selection.redflags = [];
  selection.support = '';
}

const redFlag = computed(
  () => Array.isArray(selection.redflags) && selection.redflags.length > 0
);

const REGION_TO_SLUG: Record<string, string> = {
  head: 'headache',
  neck: 'neck-pain',
  shoulders: 'shoulder-tension',
  back: 'back-pain',
  abdomen: 'digestive-discomfort',
  legs: 'knee-pain',
};

const guides = computed(() => {
  const slugs: string[] = [];
  const primary = REGION_TO_SLUG[selection.region as string];
  if (primary) slugs.push(primary);
  if (!primary || selection.region === 'whole') slugs.push('stress-anxiety');
  if (selection.intensity === 'worrying' || selection.duration === 'month') slugs.push('insomnia');
  return [...new Set(slugs)]
    .map((slug) => {
      const topic = getTopic(slug);
      if (!topic) return null;
      const lang = (locale.value as string) in topic.content ? (locale.value as string) : 'en';
      return { slug, icon: topic.icon, title: topic.content[lang].title };
    })
    .filter((g): g is { slug: string; icon: string; title: string } => g !== null)
    .slice(0, 3);
});
</script>

<style scoped lang="scss">
.as-section {
  padding-block: clamp(56px, 8vw, 96px);
  background: #0B0718;
  color: #F3EFFC;
}

.as-inner {
  width: min(100% - 48px, 860px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.as-preview-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 3px;
  background: #0B0718;
  border: 1px solid rgba(212, 175, 55, 0.34);
  color: #4a3612;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.5;
}

.as-card {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.as-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(240, 236, 250, 0.1);
  background: linear-gradient(135deg, #2a1450, #6d28d9);
}

.as-avatar {
  width: 44px;
  height: 44px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1d27a;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.as-header-name {
  font-size: 0.98rem;
  font-weight: 500;
  color: #fff;
  margin: 0;
}

html[dir="ltr"] .as-header-name {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.as-header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 2px 0 0;
}

.as-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d4af37;
}

@keyframes as-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.as-body {
  padding: 24px 22px;
  min-height: 260px;
}

.as-body > .as-progress,
.as-body > .as-step-label,
.as-body > .as-question,
.as-body > .as-options {
  animation: as-fade-up 240ms ease both;
}

.as-body > .as-red,
.as-body > .as-result-title,
.as-body > .as-result-preview,
.as-body > .as-block {
  animation: as-fade-up 320ms ease both;
}

.as-body > .as-result-title { animation-delay: 80ms; }
.as-body > .as-result-preview { animation-delay: 160ms; }
.as-body > .as-block:nth-of-type(1) { animation-delay: 240ms; }
.as-body > .as-block:nth-of-type(2) { animation-delay: 320ms; }

.as-progress {
  height: 4px;
  border-radius: 2px;
  background: rgba(240, 236, 250, 0.08);
  overflow: hidden;
  margin-bottom: 18px;
}

.as-progress-track {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(135deg, #f1d27a, #d4af37);
  transition: width 220ms ease;
}

.as-step-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 8px;
}

.as-question {
  font-size: clamp(1.25rem, 3vw, 1.7rem);
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 22px;
}

html[dir="ltr"] .as-question {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.as-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.as-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(240, 236, 250, 0.14);
  border-radius: 3px;
  padding: 14px 18px;
  font-size: 0.92rem;
  font-weight: 600;
  color: #F3EFFC;
  cursor: pointer;
  background: #160D2B;
  transition: border-color 180ms ease, background 180ms ease;
  text-align: start;
}

.as-opt--btn {
  text-align: start;
}

.as-opt:hover {
  border-color: #D4AF37;
}

.as-opt.selected {
  border-color: #D4AF37;
  background: rgba(212, 175, 55, 0.1);
}

.as-opt-input {
  width: 18px;
  height: 18px;
  accent-color: #D4AF37;
  flex-shrink: 0;
}

.as-options--multi .as-opt span {
  line-height: 1.4;
}

.as-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 22px;
  border-top: 1px solid rgba(240, 236, 250, 0.1);
  background: #0B0718;
}

.as-footer .v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.as-spacer {
  flex: 1;
}

.as-red {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  background: #fdf2f2;
  border: 1px solid rgba(217, 83, 79, 0.4);
  border-radius: 3px;
  padding: 24px;
  margin-bottom: 24px;
}

.as-red-ico {
  width: 56px;
  height: 56px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #d9534f 0%, #b03a37 100%);
}

.as-red-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #8f2d2a;
  margin: 0;
}

.as-red-desc {
  font-size: 0.92rem;
  line-height: 1.7;
  color: #7a3a38;
  margin: 0;
  max-width: 580px;
}

.as-result-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.45rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 6px;
}

html[dir="ltr"] .as-result-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.as-result-ico {
  color: #D4AF37;
}

.as-result-preview {
  font-size: 0.86rem;
  line-height: 1.6;
  color: rgba(240, 236, 250, 0.6);
  margin: 0 0 24px;
  max-width: 620px;
}

.as-block-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #D4AF37;
  margin: 0 0 12px;
}

.as-block {
  margin-bottom: 24px;
}

.as-guide {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  text-decoration: none;
  background: #160D2B;
  margin-bottom: 10px;
  transition: border-color 180ms ease, transform 180ms ease;
}

.as-guide:hover {
  border-color: #D4AF37;
  transform: translateY(-2px);
}

.as-guide-ico {
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

.as-guide-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.as-guide-body strong {
  font-size: 0.95rem;
  font-weight: 700;
  color: #F3EFFC;
}

.as-guide-body em {
  font-style: normal;
  font-size: 0.8rem;
  color: rgba(240, 236, 250, 0.55);
}

.as-guide-arrow {
  color: #D4AF37;
}

[dir='rtl'] .as-guide-arrow {
  transform: scaleX(-1);
}

[dir='rtl'] .as-back-arrow {
  transform: scaleX(-1);
}

.as-next {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.as-next-item {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 16px 18px;
  text-decoration: none;
  color: #F3EFFC;
  font-size: 0.94rem;
  font-weight: 600;
  background: #160D2B;
  transition: border-color 180ms ease, transform 180ms ease;
}

.as-next-item:hover {
  border-color: #D4AF37;
  transform: translateY(-2px);
}

.as-next-item .v-icon {
  color: #D4AF37;
}

.as-disclaimer {
  max-width: 720px;
}

/* Direction-aware slide transitions for question flow */
.as-slide-forward-enter-active,
.as-slide-forward-leave-active,
.as-slide-backward-enter-active,
.as-slide-backward-leave-active {
  transition: opacity 280ms var(--ease-out), transform 280ms var(--ease-out);
}

.as-slide-forward-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.as-slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.as-slide-backward-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.as-slide-backward-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* RTL support for slide transitions */
[dir="rtl"] .as-slide-forward-enter-from { transform: translateX(-30px); }
[dir="rtl"] .as-slide-forward-leave-to { transform: translateX(30px); }
[dir="rtl"] .as-slide-backward-enter-from { transform: translateX(30px); }
[dir="rtl"] .as-slide-backward-leave-to { transform: translateX(-30px); }

/* Progress bar transition */
.as-progress-enter-active,
.as-progress-leave-active {
  transition: opacity 220ms ease, transform 220ms var(--ease-out);
}

.as-progress-enter-from,
.as-progress-leave-to {
  opacity: 0;
  transform: scaleX(0.9);
}

/* Enhanced selected option feedback */
.as-opt.selected {
  border-color: #D4AF37;
  background: rgba(212, 175, 55, 0.1);
  animation: opt-select 300ms var(--ease-out);
}

@keyframes opt-select {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@media (max-width: 600px) {
  .as-options {
    grid-template-columns: 1fr;
  }

  .as-next {
    grid-template-columns: 1fr;
  }
}
</style>