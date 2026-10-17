<template>
  <main class="q-page">
    <PageHero eyebrow="Quiz_Kicker" title="Quiz_Title" subtitle="Quiz_Subtitle" />
    <div class="q-inner">
      <!-- ── Step 1: who is this journey for ─────────────────────────────────── -->
      <div v-if="phase === 'who'" class="q-card" v-reveal>
        <div class="q-step-head">
          <h2 class="q-question">{{ t('Quiz_WhoFor') }}</h2>
          <p class="q-question-note">{{ t('Quiz_Who_Sub') }}</p>
        </div>

        <div class="q-who-pick">
          <button
            type="button"
            class="q-who-card pressable"
            :class="{ active: forWhom === 'self' }"
            :aria-pressed="forWhom === 'self'"
            @click="forWhom = 'self'"
          >
            <span class="q-who-ico"><v-icon size="22">mdi-account-outline</v-icon></span>
            <span class="q-who-meta">
              <strong>{{ t('Quiz_For_Self') }}</strong>
            </span>
            <v-icon v-if="forWhom === 'self'" class="q-who-check" size="20">mdi-check-circle</v-icon>
          </button>

          <button
            v-for="m in familyMembers"
            :key="m.id"
            type="button"
            class="q-who-card pressable"
            :class="{ active: forWhom === m.id }"
            :aria-pressed="forWhom === m.id"
            :data-member="m.id"
            @click="forWhom = m.id"
          >
            <span class="q-who-ico"><v-icon size="22">mdi-account-heart-outline</v-icon></span>
            <span class="q-who-meta">
              <strong>{{ m.name }}</strong>
              <small>{{ t('Family_Relation_' + m.relation) }}</small>
            </span>
            <v-icon v-if="forWhom === m.id" class="q-who-check" size="20">mdi-check-circle</v-icon>
          </button>

          <router-link to="/family" class="q-who-card q-who-card--add pressable">
            <span class="q-who-ico q-who-ico--add"><v-icon size="22">mdi-account-plus-outline</v-icon></span>
            <span class="q-who-meta">
              <strong>{{ t('Quiz_Who_Add') }}</strong>
              <small>{{ t('Quiz_Who_Choose') }}</small>
            </span>
            <v-icon class="q-who-arrow" size="20">mdi-chevron-right</v-icon>
          </router-link>
        </div>

        <p v-if="!familyMembers.length" class="q-empty-note">
          <v-icon size="16" class="q-empty-ico">mdi-information-outline</v-icon>
          {{ t('Quiz_Who_NobodyYet') }}
        </p>

        <div class="q-actions">
          <span class="q-actions-spacer"></span>
          <button type="button" class="q-next q-next--ready pressable" @click="startQuestions">
            {{ t('Quiz_Start') }}
            <v-icon end size="18">mdi-arrow-right</v-icon>
          </button>
        </div>
      </div>

      <!-- ── Step 2: the questions ──────────────────────────────────────────── -->
      <div v-else-if="phase === 'questions'" class="q-card" v-reveal>
        <div class="q-progress" role="progressbar" :aria-valuenow="step + 1" :aria-valuemin="1" :aria-valuemax="questions.length">
          <div class="q-progress-bar" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="q-step-count">
          {{ t('Quiz_Step', { current: step + 1, total: questions.length }) }}
          <span class="q-step-for">{{ t('Quiz_Plan_For', { name: forTitle }) }}</span>
        </div>

        <div class="q-step-head">
          <h2 class="q-question" :key="'q' + step">{{ questions[step].text }}</h2>
        </div>

        <div class="q-options" :key="'opt' + step" role="radiogroup" :aria-label="questions[step].text">
          <button
            v-for="(opt, i) in questions[step].options"
            :key="opt.value"
            type="button"
            role="radio"
            class="q-option pressable stagger-in-scale"
            :class="{ selected: currentAnswer === opt.value }"
            :aria-checked="currentAnswer === opt.value"
            :style="{ '--i': Math.min(i, 8) }"
            @click="select(opt.value)"
          >
            <span v-if="opt.icon" class="q-option-ico"><v-icon size="20">{{ opt.icon }}</v-icon></span>
            <span class="q-option-label">{{ opt.label }}</span>
            <v-icon v-if="currentAnswer === opt.value" class="q-option-check" size="20">mdi-check-circle</v-icon>
          </button>
        </div>

        <p v-if="showValidation" class="q-error" role="alert">
          <v-icon size="16">mdi-alert-circle-outline</v-icon>
          {{ t('Quiz_PickOne') }}
        </p>

        <div class="q-actions">
          <button type="button" class="q-back pressable" @click="goBack">
            <v-icon :class="{ 'q-flip-rtl': isRtl }" size="16">mdi-arrow-left</v-icon>
            {{ t('Quiz_Back') }}
          </button>
          <button
            type="button"
            class="q-next pressable"
            :class="{ 'q-next--ready': !!currentAnswer }"
            :aria-disabled="!currentAnswer"
            @click="goNext"
          >
            {{ isLastStep ? t('Quiz_See_Suggestion') : t('Quiz_Next') }}
            <v-icon end size="18">mdi-arrow-right</v-icon>
          </button>
        </div>

        <p class="q-saved-note">
          <v-icon size="14">mdi-content-save-outline</v-icon>
          {{ t('Quiz_Who_Saved') }}
        </p>
      </div>

      <!-- ── Step 3: the suggestion ─────────────────────────────────────────── -->
      <div v-else class="q-result" v-reveal>
        <span class="q-result-ico"><v-icon size="36" color="white">mdi-lightbulb-on</v-icon></span>
        <h2 class="q-result-title">{{ t('Quiz_Result_Title') }}</h2>
        <p class="q-result-sub">{{ t('Quiz_Plan_For', { name: forTitle }) }}</p>

        <div class="q-reco">
          <router-link
            v-for="(r, i) in recommendations"
            :key="r.slug"
            :to="`/symptoms/${r.slug}`"
            class="q-reco-item pressable stagger-in"
            :style="{ '--i': i }"
          >
            <v-icon size="18" class="q-reco-ico">{{ r.icon }}</v-icon>
            <div>
              <strong>{{ r.title }}</strong>
              <p>{{ r.summary }}</p>
            </div>
            <v-icon class="q-reco-arrow">mdi-chevron-right</v-icon>
          </router-link>
        </div>

        <div class="q-actions q-actions--center">
          <button type="button" class="q-back pressable" @click="phase = 'questions'; step = questions.length - 1">
            <v-icon :class="{ 'q-flip-rtl': isRtl }" size="16">mdi-arrow-left</v-icon>
            {{ t('Quiz_Back') }}
          </button>
        </div>

        <div class="q-result-actions">
          <v-btn :to="bookTarget" color="primary" elevation="0" size="large" class="pressable">
            {{ t('Quiz_Book') }}
            <v-icon end>mdi-calendar-check</v-icon>
          </v-btn>
          <v-btn to="/body" variant="outlined" color="primary" size="large" class="pressable">
            {{ t('Quiz_ExploreBody') }}
          </v-btn>
          <v-btn variant="text" color="primary" size="large" @click="restart" class="pressable">
            {{ t('Quiz_Restart') }}
          </v-btn>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHero from '@/components/layout/PageHero.vue';
import { TOPICS, LangCode } from '@/data/wellness';
import { QUIZ_QUESTIONS, quizRecommendations } from '@/data/quiz';
import { useFamilyStore } from '@/stores/family';

const { t, locale } = useI18n();
const currentLocale = computed(() => (locale.value as LangCode) || 'en');
const isRtl = computed(() => locale.value === 'ar');

const family = useFamilyStore();
const familyMembers = computed(() => family.members);

type Phase = 'who' | 'questions' | 'result';
const STORAGE_KEY = 'orkod-quiz-v1';

interface SavedQuiz {
  phase: Phase;
  step: number;
  answers: Record<string, string>;
  forWhom: string;
}

function loadSaved(): SavedQuiz | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedQuiz;
    // Guard against a stale shape from an older build. `answers` is a
    // Record<string, string>, so it must be checked as a plain object.
    if (!parsed || typeof parsed.answers !== 'object' || parsed.answers === null || Array.isArray(parsed.answers)) {
      return null;
    }
    if (!(['who', 'questions', 'result'] as string[]).includes(parsed.phase)) return null;
    if (typeof parsed.step !== 'number' || parsed.step < 0) parsed.step = 0;
    if (parsed.step > QUIZ_QUESTIONS.length - 1) parsed.phase = 'result';
    if (typeof parsed.forWhom !== 'string' || !parsed.forWhom) parsed.forWhom = 'self';
    return parsed;
  } catch {
    return null;
  }
}

const saved = loadSaved();

const phase = ref<Phase>(saved?.phase ?? 'who');
const step = ref<number>(saved?.step ?? 0);
const answers = ref<Record<string, string>>(saved?.answers ?? {});
const forWhom = ref<string>(saved?.forWhom ?? 'self');
const showValidation = ref(false);

watch([phase, step, answers, forWhom], () => {
  if (typeof localStorage === 'undefined') return;
  const payload: SavedQuiz = {
    phase: phase.value,
    step: step.value,
    answers: { ...answers.value },
    forWhom: forWhom.value,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota — the quiz still works, it just will not resume */
  }
}, { deep: true });

const forTitle = computed(() => {
  if (forWhom.value === 'self') return t('Quiz_For_Self');
  const member = family.members.find((m) => m.id === forWhom.value);
  return member ? member.name : t('Quiz_For_Self');
});

const bookTarget = computed(() => {
  const slug = recommendations.value[0]?.slug || 'back-pain';
  const query = forWhom.value !== 'self' ? `?for=${encodeURIComponent(forWhom.value)}` : '';
  return `/specialty/${slug}${query}`;
});

interface QOption {
  value: string;
  label: string;
  icon?: string;
}
interface Question {
  text: string;
  options: QOption[];
}

const questions = computed<Question[]>(() =>
  QUIZ_QUESTIONS.map((q) => ({
    text: t(q.textKey),
    options: q.options.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
      icon: opt.icon,
    })),
  }))
);

const currentQuestionId = computed(() => QUIZ_QUESTIONS[step.value]?.id ?? '');
const currentAnswer = computed(() => answers.value[currentQuestionId.value] ?? '');
const isLastStep = computed(() => step.value >= questions.value.length - 1);

/** Counts the question the user is looking at, so the bar is never empty. */
const progressPct = computed(() =>
  Math.round(((step.value + 1) / questions.value.length) * 100)
);

const recommendations = computed(() => {
  const slugs = quizRecommendations(answers.value);
  return slugs
    .map((slug) => {
      const topic = TOPICS.find((tp) => tp.slug === slug);
      if (!topic) return null;
      const content = topic.content[currentLocale.value] || topic.content.en;
      return {
        slug,
        icon: topic.icon,
        title: content.title,
        summary: content.summary,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
});

function startQuestions() {
  phase.value = 'questions';
  showValidation.value = false;
}

function select(value: string) {
  answers.value[currentQuestionId.value] = value;
  showValidation.value = false;
}

function goBack() {
  showValidation.value = false;
  if (step.value > 0) {
    step.value--;
  } else {
    phase.value = 'who';
  }
}

function goNext() {
  if (!currentAnswer.value) {
    showValidation.value = true;
    return;
  }
  showValidation.value = false;
  if (isLastStep.value) {
    phase.value = 'result';
  } else {
    step.value++;
  }
}

function restart() {
  answers.value = {};
  step.value = 0;
  forWhom.value = 'self';
  phase.value = 'who';
  showValidation.value = false;
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}
</script>

<style scoped lang="scss">
.q-page {
  background: #0B0718;
  color: #F3EFFC;
  min-height: 70svh;
  padding: 0 0 70px;
}

.q-inner {
  width: min(100% - 48px, 760px);
  margin-inline: auto;
  padding-top: 44px;
}

.q-card {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 34px;
}

.q-progress {
  height: 3px;
  border-radius: 0;
  background: rgba(240, 236, 250, 0.1);
  overflow: hidden;
}

.q-progress-bar {
  height: 100%;
  border-radius: 0;
  background: linear-gradient(90deg, #D4AF37, #f1d27a);
  transition: width 420ms var(--ease-out);
}

.q-step-count {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  margin-top: 10px;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.q-step-for {
  font-weight: 600;
  color: #D4AF37;
}

.q-step-head {
  margin: 22px 0 18px;
}

.q-question {
  margin: 0;
  font-size: clamp(19px, 2.4vw, 24px);
  font-weight: 500;
  animation: fade-in-up 420ms var(--ease-out) both;
}

html[dir="ltr"] .q-question {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.q-question-note {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.55;
}

.q-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.q-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 3px;
  border: 1px solid rgba(240, 236, 250, 0.12);
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  text-align: start;
  transition: border-color 150ms var(--ease-out), background 150ms var(--ease-out),
    transform 150ms var(--ease-out);

  &:hover {
    border-color: #D4AF37;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #D4AF37;
    outline-offset: 2px;
  }

  &.selected {
    border-color: #D4AF37;
    background: rgba(212, 175, 55, 0.1);
  }
}

.q-option-label {
  flex: 1;
}

.q-option-ico {
  flex: none;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: rgba(212, 175, 55, 0.12);
  color: #D4AF37;
}

.q-option-check {
  flex: none;
  color: #D4AF37;
}

/* ── who-is-this-for ─────────────────────────────────────────────────────── */
.q-who-pick {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.q-who-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 3px;
  border: 1px solid rgba(240, 236, 250, 0.12);
  background: transparent;
  text-decoration: none;
  color: #F3EFFC;
  cursor: pointer;
  text-align: start;
  transition: border-color 150ms var(--ease-out), background 150ms var(--ease-out),
    transform 150ms var(--ease-out);

  &:hover {
    border-color: #D4AF37;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #D4AF37;
    outline-offset: 2px;
  }

  &.active {
    border-color: #D4AF37;
    background: rgba(212, 175, 55, 0.1);
  }
}

.q-who-ico {
  flex: none;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  color: #fff;
}

.q-who-ico--add {
  background: transparent;
  border: 1px dashed rgba(212, 175, 55, 0.6);
  color: #D4AF37;
}

.q-who-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 15.5px;
  }

  small {
    font-size: 12.5px;
    color: var(--color-text-muted);
  }
}

.q-who-check {
  flex: none;
  color: var(--color-primary);
}

.q-who-arrow {
  flex: none;
  color: var(--color-text-muted);
}

.q-empty-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 0;
  font-size: 13.5px;
  color: var(--color-text-muted);
}

.q-empty-ico {
  flex: none;
}

/* ── actions ─────────────────────────────────────────────────────────────── */
.q-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.q-actions--center {
  justify-content: center;
}

.q-actions-spacer {
  flex: 1;
}

.q-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 2px;
  background: none;
  border: 1px solid transparent;
  color: rgba(240, 236, 250, 0.6);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 150ms var(--ease-out), background 150ms var(--ease-out);

  &:hover {
    color: #D4AF37;
    background: rgba(212, 175, 55, 0.1);
  }

  &:focus-visible {
    outline: 2px solid #D4AF37;
    outline-offset: 2px;
  }
}

.q-flip-rtl {
  transform: scaleX(-1);
}

.q-next {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 12px 26px;
  border-radius: 2px;
  border: none;
  /* Muted until an answer is picked, but still clickable: a hard `disabled`
     swallowed the click and the validation message could never appear. */
  background: transparent;
  color: rgba(240, 236, 250, 0.5);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  opacity: 0.85;
  box-shadow: inset 0 0 0 1px rgba(240, 236, 250, 0.16);
  transition: background 180ms var(--ease-out), color 180ms var(--ease-out),
    transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out), opacity 180ms var(--ease-out);

  &--ready {
    background: linear-gradient(135deg, #f1d27a, #d4af37);
    color: #1c1327;
    cursor: pointer;
    opacity: 1;
    box-shadow: none;
  }

  &--ready:hover {
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #D4AF37;
    outline-offset: 2px;
  }
}

.q-error {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 14px 0 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-error, #C62828);
}

.q-saved-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 18px 0 0;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

/* ── result ──────────────────────────────────────────────────────────────── */
.q-result {
  text-align: center;
}

.q-result-ico {
  width: 76px;
  height: 76px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #D4AF37, #D4AF37);
  box-shadow: 0 16px 40px rgba(212, 175, 55, 0.4);
  animation: scale-in 520ms var(--ease-spring) both, float-gentle 5.5s ease-in-out 520ms infinite;
}

.q-result-title {
  margin: 20px 0 6px;
  font-size: 27px;
  font-weight: 500;
}

html[dir="ltr"] .q-result-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.q-result-sub {
  color: rgba(240, 236, 250, 0.6);
  margin: 0 0 26px;
  font-weight: 600;
}

.q-reco {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: start;
}

.q-reco-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 3px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  text-decoration: none;
  color: #F3EFFC;
  transition: border-color 150ms var(--ease-out), transform 150ms var(--ease-out);

  &:hover {
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #D4AF37;
    outline-offset: 2px;
  }

  strong {
    font-size: 16px;
  }

  p {
    margin: 3px 0 0;
    font-size: 13px;
    color: rgba(240, 236, 250, 0.6);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.q-reco-ico {
  flex: none;
  width: 44px;
  height: 44px;
  padding: 11px;
  border-radius: 3px;
  background: rgba(212, 175, 55, 0.12);
  color: #D4AF37;
}

.q-reco-arrow {
  margin-inline-start: auto;
  color: rgba(240, 236, 250, 0.5);
}

.q-result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 26px;
}

@media (max-width: 560px) {
  .q-card {
    padding: 22px 18px;
  }

  .q-options {
    grid-template-columns: 1fr;
  }

  .q-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .q-back,
  .q-next {
    justify-content: center;
    width: 100%;
  }
}
</style>
