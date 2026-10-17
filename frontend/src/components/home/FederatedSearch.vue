<template>
  <section class="fs-section" aria-labelledby="fs-title">
    <div class="fs-inner">
      <div class="fs-head">
        <span class="fs-eyebrow">{{ t('Explore_Eyebrow') }}</span>
        <h2 id="fs-title" class="fs-title">{{ t('Explore_Title') }}</h2>
        <p class="fs-sub">{{ t('Explore_Subtitle') }}</p>
      </div>

      <div class="fs-panel" :dir="textDirection">
        <div class="fs-field">
          <v-icon color="primary" size="22">mdi-magnify</v-icon>
          <input
            v-model="query"
            type="text"
            class="fs-input"
            :placeholder="t('Search_All_Placeholder')"
            :aria-label="t('Search_Label')"
            @keydown.enter.prevent="openFirstResult"
          />
          <button v-if="query" type="button" class="fs-clear pressable" @click="query = ''">
            {{ t('Search_Clear') }}
          </button>
        </div>
        <p class="fs-hint">{{ t('Search_Hint') }}</p>

        <div v-if="query.trim()" class="fs-results">
          <div v-for="group in results" :key="group.labelKey" v-show="group.items.length > 0" class="fs-group">
            <h3 class="fs-group-title">{{ t(group.labelKey) }}</h3>
            <button
              v-for="r in group.items.slice(0, maxPerGroup)"
              :key="group.labelKey + '.' + r.key"
              type="button"
              class="fs-item pressable"
              @click="go(r)"
            >
              <v-icon color="primary" size="18">{{ r.icon }}</v-icon>
              <span class="fs-item-body">
                <strong>{{ r.title }}</strong>
                <span v-if="r.sub" class="fs-item-sub">{{ r.sub }}</span>
              </span>
              <v-icon class="fs-item-arrow">mdi-chevron-right</v-icon>
            </button>
          </div>

          <p v-if="!hasResults" class="fs-nothing">
            <v-icon size="18" class="fs-nothing-ico">mdi-emoticon-sad-outline</v-icon>
            {{ t('Search_No_All') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { TOPICS, LangCode } from '@/data/wellness';
import { FRONT_BODY_REGIONS, BACK_BODY_REGIONS } from '@/data/body-regions';
import { ACADEMY_COURSES } from '@/data/academy';
import { usePublicHealers } from '@/composables/usePublicHealers';

interface SearchItem {
  key: string;
  title: string;
  sub?: string;
  icon: string;
  path: string;
}

const maxPerGroup = 5;

const { t, locale } = useI18n();
const router = useRouter();
const { healers } = usePublicHealers();

const query = ref('');

const textDirection = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'));
const currentLocale = computed(() => (locale.value as LangCode) || 'en');

const regions = computed(() => {
  const map = new Map<string, { id: string; titleKey: string; descKey: string }>();
  [...FRONT_BODY_REGIONS, ...BACK_BODY_REGIONS].forEach((r) => map.set(r.id, r));
  return [...map.values()];
});

const topicRows = computed<SearchItem[]>(() =>
  TOPICS.map((topic) => {
    const content = topic.content[currentLocale.value] || topic.content.en;
    return {
      key: topic.slug,
      title: content.title,
      sub: content.region,
      icon: topic.icon,
      path: '/symptoms/' + topic.slug,
    };
  })
);

const regionRows = computed<SearchItem[]>(() =>
  regions.value.map((r) => ({
    key: r.id,
    title: t(r.titleKey),
    sub: t(r.descKey),
    icon: 'mdi-human-male-height-variant',
    path: '/organs/' + r.id,
  }))
);

const courseRows = computed<SearchItem[]>(() =>
  ACADEMY_COURSES.map((c) => ({
    key: c.slug,
    title: t(c.titleKey),
    sub: t(c.descriptionKey),
    icon: 'mdi-book-education-outline',
    path: '/academy/' + c.slug,
  }))
);

const healerRows = computed<SearchItem[]>(() =>
  healers.value.map((h) => ({
    key: String(h.id),
    title: `${h.firstName ?? ''} ${h.lastName ?? ''}`.trim() || `#${h.id}`,
    sub: h.city,
    icon: 'mdi-account-heart-outline',
    path: h.id ? '/booking?healer=' + h.id : '/booking',
  }))
);

const PAGES: { key: string; titleKey: string; icon: string; path: string }[] = [
  { key: 'body', titleKey: 'Body_Title', icon: 'mdi-human-male-height-variant', path: '/body' },
  { key: 'quiz', titleKey: 'Quiz_Title', icon: 'mdi-comment-question', path: '/quiz' },
  { key: 'practitioners', titleKey: 'Practitioners_Title', icon: 'mdi-account-heart-outline', path: '/practitioners' },
  { key: 'academy', titleKey: 'Academy_Title', icon: 'mdi-school-outline', path: '/academy' },
  { key: 'donations', titleKey: 'Donations_Title', icon: 'mdi-hand-heart-outline', path: '/donations' },
  { key: 'family', titleKey: 'Family_Title', icon: 'mdi-account-group', path: '/family' },
  { key: 'book', titleKey: 'Book_Title', icon: 'mdi-book-open-page-variant', path: '/booking' },
];

const pageRows = computed<SearchItem[]>(() =>
  PAGES.map((p) => ({ key: p.key, title: t(p.titleKey), icon: p.icon, path: p.path }))
);

function matches(q: string, ...parts: (string | undefined)[]) {
  return parts.some((part) => (part ?? '').toLowerCase().includes(q));
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];

  const f = (rows: SearchItem[], fields: (string | undefined)[]) => rows.filter((r) => matches(q, r.title, r.sub, ...fields));

  return [
    { labelKey: 'Search_Group_Topics', items: f(topicRows.value, []) },
    { labelKey: 'Search_Group_Regions', items: f(regionRows.value, []) },
    { labelKey: 'Search_Group_Courses', items: f(courseRows.value, []) },
    { labelKey: 'Search_Group_Healers', items: f(healerRows.value, ['city']) },
    { labelKey: 'Search_Group_Pages', items: f(pageRows.value, []) },
  ];
});

const hasResults = computed(() => results.value.some((g) => g.items.length > 0));

function go(item: SearchItem) {
  router.push(item.path).catch(() => {});
}

/**
 * Enter in the field opens the first result. The result buttons are real
 * <button>s so they are already tab-navigable; this just makes the field
 * behave the way a search box is expected to. No-op when there is nothing to
 * open, so Enter never navigates the user somewhere unexpected.
 */
function openFirstResult() {
  if (!query.value.trim()) return;
  const first = results.value.find((g) => g.items.length > 0)?.items[0];
  if (first) go(first);
}
</script>

<style scoped lang="scss">
.fs-section {
  padding: 64px 0 8px;
}

.fs-inner {
  width: min(100% - 40px, 760px);
  margin-inline: auto;
}

.fs-head {
  text-align: center;
  margin-bottom: 26px;
}

.fs-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.fs-title {
  margin: 8px 0 6px;
  font-size: clamp(24px, 3vw, 32px);
}

.fs-sub {
  margin: 0 auto;
  max-width: 520px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.fs-panel {
  background: var(--color-surface);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.08);
  padding: 22px 24px;
}

.fs-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 54px;
  border-radius: 14px;
  border: 2px solid rgba(212, 175, 55, 0.45);
  background: var(--color-surface-alt);
  transition: border-color 180ms ease, box-shadow 180ms ease;

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.18);
  }
}

.fs-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-charcoal);
  font-size: 15.5px;
  font-family: inherit;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 0.75;
  }
}

.fs-clear {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.fs-hint {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.fs-results {
  margin-top: 16px;
}

.fs-group {
  margin-top: 18px;

  &:first-child {
    margin-top: 0;
  }
}

.fs-group-title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.fs-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  text-align: start;
  cursor: pointer;
  transition: background 140ms ease;

  &:hover {
    background: rgba(212, 175, 55, 0.1);
  }

  &:hover .fs-item-arrow {
    transform: translateX(3px);
  }
}

[dir="rtl"] .fs-item:hover .fs-item-arrow {
  transform: translateX(-3px);
}

.fs-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 14.5px;
  }
}

.fs-item-sub {
  font-size: 12.5px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.fs-item-arrow {
  color: var(--color-text-muted);
  transition: transform 140ms ease;
}

.fs-nothing {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 14px;
  justify-content: center;
  padding: 18px 0 6px;
}

.fs-nothing-ico {
  color: var(--color-text-muted);
}
</style>