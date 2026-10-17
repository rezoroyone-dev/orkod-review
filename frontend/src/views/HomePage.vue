<template>
  <main class="hp">
    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
    <section class="hp-hero">
      <span class="hp-hero-aura aurora" aria-hidden="true"></span>
      <span class="hp-hero-grain grain" aria-hidden="true"></span>

      <motion.div
        class="hp-hero-inner"
        :variants="heroContainer"
        initial="hidden"
        animate="show"
      >
        <motion.p class="hp-hero-eyebrow" :variants="heroItem"><span class="hp-hero-rule" aria-hidden="true"></span>{{ t('Home_Kicker') }}</motion.p>
        <motion.div :variants="heroItem">
          <SplitHeading tag="h1" class="hp-hero-title" :text="t('Home_HeroTitle')" />
        </motion.div>
        <motion.p class="hp-hero-sub" :variants="heroItem">{{ t('Home_HeroSubtitle') }}</motion.p>

        <motion.div class="hp-hero-actions" :variants="heroItem">
          <router-link to="/booking" class="hp-cta hp-cta--gold pressable sheen">
            {{ t('Book_a_Healing_Session') }}
            <v-icon size="18">mdi-arrow-right</v-icon>
          </router-link>
          <router-link to="/body" class="hp-cta hp-cta--ghost pressable">
            {{ t('Nav_BodyExplorer') }}
          </router-link>
        </motion.div>
      </motion.div>

      <span class="hp-cue" aria-hidden="true"><i></i></span>
    </section>

    <!-- ── Ticker ───────────────────────────────────────────────────────── -->
    <section class="hp-marquee" aria-hidden="true">
      <div class="marquee">
        <div class="marquee-track">
          <span v-for="(w, i) in marqueeWords" :key="'m' + i" class="hp-marquee-item">{{ w }}<i class="hp-marquee-dot"></i></span>
          <span v-for="(w, i) in marqueeWords" :key="'n' + i" class="hp-marquee-item">{{ w }}<i class="hp-marquee-dot"></i></span>
        </div>
      </div>
    </section>

    <!-- ── Three ways in (editorial doors) ──────────────────────────────── -->
    <section class="hp-section hp-doors-section">
      <div class="hp-wrap">
        <div class="hp-doors">
          <router-link
            v-for="(door, i) in doors"
            :key="door.to"
            :to="door.to"
            class="hp-door pressable"
            :style="{ '--i': i }"
          >
            <span class="hp-door-num" aria-hidden="true">0{{ i + 1 }}</span>
            <span class="hp-door-ico"><v-icon size="26">{{ door.icon }}</v-icon></span>
            <h2 class="hp-door-title">{{ t(door.titleKey) }}</h2>
            <p class="hp-door-desc">{{ t(door.descKey) }}</p>
            <span class="hp-door-go" aria-hidden="true"><v-icon size="18">mdi-arrow-right</v-icon></span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ── Explore (search) ────────────────────────────────────────────── -->
    <FederatedSearch />

    <!-- ── Areas / healers (editorial index) ───────────────────────────── -->
    <section class="hp-section">
      <div class="hp-wrap hp-split">
        <div class="hp-split-head">
          <p class="hp-eyebrow"><b aria-hidden="true">01</b>{{ t('Home_Practitioners_Kicker') }}</p>
          <SplitHeading tag="h2" class="hp-title" :text="t('Home_Practitioners_Title')" />
          <p class="hp-lede">{{ t('Home_Practitioners_Sub') }}</p>
          <router-link to="/practitioners" class="hp-inline-link pressable">
            {{ t('Nav_Practitioners') }}<v-icon size="16">mdi-arrow-right</v-icon>
          </router-link>
        </div>

        <ul class="hp-index">
          <li v-for="topic in topicPreview" :key="topic.slug">
            <button type="button" class="hp-index-row pressable" @click="go(topic.slug)">
              <span class="hp-index-title">{{ topic.content[currentLocale]?.title }}</span>
              <span class="hp-index-region">{{ topic.content[currentLocale]?.region }}</span>
              <span class="hp-index-arrow" aria-hidden="true"><v-icon size="18">mdi-arrow-right</v-icon></span>
            </button>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Giving ──────────────────────────────────────────────────────── -->
    <section v-if="donations.enabled" class="hp-section hp-section--tint">
      <div class="hp-wrap">
        <div class="hp-split-head hp-split-head--center">
          <p class="hp-eyebrow"><b aria-hidden="true">02</b>{{ t('Home_Donations_Kicker') }}</p>
          <SplitHeading tag="h2" class="hp-title" :text="t('Home_Donations_Title')" />
        </div>

        <div v-if="donations.donations.length" class="hp-donations">
          <figure v-for="d in donations.donations.slice(0, 4)" :key="d.id" class="hp-donation">
            <span class="hp-donation-amount">{{ t('Currency') }}{{ d.amount }}</span>
            <blockquote class="hp-donation-msg">{{ d.message || '—' }}</blockquote>
            <figcaption class="hp-donation-name">{{ d.name }}</figcaption>
          </figure>
        </div>
        <p v-else class="hp-donations-empty">{{ t('Donations_Empty') }}</p>

        <div class="hp-section-foot">
          <router-link to="/donations" class="hp-cta hp-cta--ghost hp-cta--sm pressable">
            {{ t('Home_Donations_SeeAll') }}
            <v-icon size="16">mdi-arrow-right</v-icon>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ── Family ──────────────────────────────────────────────────────── -->
    <section class="hp-section">
      <div class="hp-wrap hp-family">
        <div class="hp-family-copy">
          <p class="hp-eyebrow"><b aria-hidden="true">03</b>{{ t('Home_Family_Kicker') }}</p>
          <SplitHeading tag="h2" class="hp-title" :text="t('Home_Family_Title')" />
          <p class="hp-lede">{{ t('Home_Family_Sub') }}</p>
          <router-link to="/family" class="hp-cta hp-cta--gold pressable sheen">
            {{ t('Home_Family_Cta') }}
            <v-icon size="18">mdi-arrow-right</v-icon>
          </router-link>
        </div>
        <div class="hp-family-art scroll-scale" aria-hidden="true">
          <span class="hp-family-ring hp-family-ring--a"></span>
          <span class="hp-family-ring hp-family-ring--b"></span>
          <v-icon size="96" class="hp-family-ico">mdi-account-group</v-icon>
        </div>
      </div>
    </section>

    <TrustStrip />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { motion } from 'motion-v';
import TrustStrip from '@/components/home/TrustStrip.vue';
import FederatedSearch from '@/components/home/FederatedSearch.vue';
import SplitHeading from '@/components/common/SplitHeading.vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { TOPICS, LangCode } from '@/data/wellness';
import DonationService, { DonationFeed } from '@/services/DonationService';

const { t, locale } = useI18n();
const router = useRouter();

// Hero entrance: a short staggered rise on first paint. Reduced-motion visitors
// get the same layout instantly, with zero travel.
const reducedMotion = useReducedMotion();

const heroContainer = computed(() => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: reducedMotion.value ? 0 : 0.09,
      delayChildren: reducedMotion.value ? 0 : 0.05,
    },
  },
}));

const heroItem = computed(() => ({
  hidden: { opacity: 0, y: reducedMotion.value ? 0 : 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: reducedMotion.value ? 0 : 0.6, ease: 'easeOut' as const },
  },
}));

const currentLocale = computed(() => (locale.value as LangCode) || 'en');

const topicPreview = computed(() => TOPICS.slice(0, 8));

// The three ways into Orkod, presented as an editorial index rather than cards.
const doors = [
  { to: '/body', icon: 'mdi-human-male-height-variant', titleKey: 'Home_ChoiceKnow_Title', descKey: 'Home_ChoiceKnow_Desc' },
  { to: '/quiz', icon: 'mdi-comment-question-outline', titleKey: 'Home_ChoiceQuiz_Title', descKey: 'Home_ChoiceQuiz_Desc' },
  { to: '/booking', icon: 'mdi-calendar-check-outline', titleKey: 'Home_ChoiceBook_Title', descKey: 'Home_ChoiceBook_Desc' },
];

// Signature ticker: the practice's own vocabulary, recycled as a scrolling band.
const marqueeWords = computed(() =>
  TOPICS.map((topic) => topic.content[currentLocale.value]?.title).filter((w): w is string => !!w)
);

const donations = ref<DonationFeed>({ enabled: false, donations: [] });
onMounted(async () => {
  try {
    donations.value = await DonationService.getPublicDonations();
  } catch {
    donations.value = { enabled: false, donations: [] };
  }
});

function go(slug: string) {
  router.push('/symptoms/' + slug);
}
</script>

<style scoped lang="scss">
// Luxury editorial home — a warm ivory hero over a warm ivory body, Fraunces
// display type, gold hairlines, generous negative space. One idea per screen.
.hp {
  --hp-ink: #F3EFFC;
  --hp-ink-soft: rgba(240, 236, 250, 0.6);
  --hp-line: rgba(240, 236, 250, 0.1);
  --hp-gold: #D4AF37;
  --hp-gold-line: rgba(212, 175, 55, 0.34);
  --hp-ivory: #0B0718;
  --hp-panel: #160D2B;

  position: relative;
  background: var(--hp-ivory);
  color: var(--hp-ink);
  overflow-x: clip;
}

// ── Hero ─────────────────────────────────────────────────────────────────
.hp-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  align-content: center;
  min-height: clamp(560px, 84vh, 860px);
  padding: clamp(104px, 15vh, 172px) 24px clamp(84px, 13vh, 132px);
  text-align: center;
  color: var(--hp-ink);
  overflow: clip;
  background:
    radial-gradient(120% 130% at 84% -18%, rgba(212, 175, 55, 0.18), transparent 55%),
    radial-gradient(112% 128% at 0% 124%, rgba(139, 92, 246, 0.10), transparent 60%),
    linear-gradient(165deg, #140C29 0%, #0B0718 48%, #160D2B 100%);
}

.hp-hero-aura {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.42;
}

.hp-hero-grain {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.hp-hero-inner {
  position: relative;
  z-index: 2;
  width: min(100%, 1080px);
  margin-inline: auto;
}

.hp-hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #D4AF37;
}

.hp-hero-rule {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.9));
}

html[dir="rtl"] .hp-hero-rule {
  background: linear-gradient(270deg, transparent, rgba(212, 175, 55, 0.9));
}

.hp-hero-title {
  max-width: 16ch;
  margin: 22px auto 0;
  font-size: clamp(2.9rem, 6.6vw, 5.6rem);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: -0.02em;
}

html[dir="ltr"] .hp-hero-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

html[dir="rtl"] .hp-hero-title {
  font-family: var(--font-family-arabic);
}

.hp-hero-sub {
  max-width: 560px;
  margin: 24px auto 0;
  color: rgba(240, 236, 250, 0.64);
  font-size: 17px;
  line-height: 1.7;
}

.hp-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  margin-top: 38px;
}

.hp-cue {
  position: absolute;
  left: 50%;
  bottom: 26px;
  z-index: 2;
  width: 1px;
  height: 46px;
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.7), transparent);
  overflow: hidden;
}

.hp-cue i {
  position: absolute;
  inset: 0;
  background: #D4AF37;
  animation: hp-cue 2.4s ease-in-out infinite;
}

@keyframes hp-cue {
  0% { transform: translateY(-100%); }
  60%, 100% { transform: translateY(100%); }
}

// ── Shared CTA ───────────────────────────────────────────────────────────
.hp-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 28px;
  border-radius: 2px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  transition: transform 220ms var(--ease-out), background 220ms var(--ease-out), color 220ms var(--ease-out), border-color 220ms var(--ease-out);

  &:hover { transform: translateY(-2px); }
}

.hp-cta--sm { padding: 12px 22px; }

.hp-cta--gold {
  background: linear-gradient(135deg, #f1d27a 0%, #d4af37 100%);
  color: #1c1327;
  box-shadow: 0 14px 30px -14px rgba(212, 175, 55, 0.7);
}

.hp-cta--ghost {
  color: var(--hp-ink);
  border: 1px solid rgba(240, 236, 250, 0.22);
  background: transparent;
}

.hp-cta--ghost:hover {
  border-color: rgba(212, 175, 55, 0.7);
  color: #E9C766;
}

// Ghost on the ivory body needs ink colours.
.hp-section--tint .hp-cta--ghost,
.hp-section .hp-cta--ghost {
  color: var(--hp-ink);
  border-color: rgba(240, 236, 250, 0.22);
}

.hp-section .hp-cta--ghost:hover {
  border-color: var(--hp-gold);
  color: var(--hp-gold);
}

// ── Marquee ──────────────────────────────────────────────────────────────
.hp-marquee {
  padding: 18px 0;
  background: #0B0718;
  border-block: 1px solid rgba(212, 175, 55, 0.28);
}

.hp-marquee-item {
  display: inline-flex;
  align-items: center;
  gap: 0.9em;
  white-space: nowrap;
  font-size: clamp(0.95rem, 1.4vw, 1.25rem);
  font-weight: 600;
  color: rgba(240, 236, 250, 0.66);
}

html[dir="ltr"] .hp-marquee-item {
  font-family: var(--font-family-display);
  font-weight: 500;
  letter-spacing: 0.01em;
}

.hp-marquee-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gradient-gold);
  box-shadow: 0 0 10px rgba(241, 210, 122, 0.7);
}

// ── Sections ─────────────────────────────────────────────────────────────
.hp-section {
  padding-block: clamp(72px, 10vw, 128px);
}

.hp-section--tint {
  background: #0B0718;
  border-block: 1px solid var(--hp-line);
}

.hp-wrap {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
}

.hp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 18px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--hp-gold);

  b {
    font-weight: 700;
    color: var(--hp-ink-soft);
    font-variant-numeric: tabular-nums;
  }
}

.hp-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 500;
  line-height: 1.06;
  letter-spacing: -0.02em;
}

html[dir="ltr"] .hp-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

html[dir="rtl"] .hp-title {
  font-family: var(--font-family-arabic);
}

.hp-lede {
  max-width: 46ch;
  margin: 20px 0 0;
  color: var(--hp-ink-soft);
  font-size: 17px;
  line-height: 1.7;
}

.hp-inline-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 26px;
  padding-bottom: 3px;
  border-bottom: 1px solid var(--hp-gold-line);
  color: var(--hp-ink);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  transition: border-color 200ms var(--ease-out), color 200ms var(--ease-out);

  &:hover { border-color: var(--hp-gold); color: var(--hp-gold); }
}

.hp-section-foot {
  margin-top: 40px;
  text-align: center;
}

.hp-split-head--center {
  text-align: center;
  margin-inline: auto;
  margin-bottom: 44px;

  .hp-title { margin-inline: auto; max-width: 20ch; }
}

// ── Doors ────────────────────────────────────────────────────────────────
.hp-doors {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--hp-line);
}

.hp-door {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(32px, 4vw, 52px) clamp(24px, 3vw, 44px);
  color: var(--hp-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--hp-line);
  border-inline-start: 1px solid var(--hp-line);
  transition: background 260ms var(--ease-out), transform 260ms var(--ease-out);

  &:first-child { border-inline-start: none; }

  &:hover {
    background: #160D2B;
    transform: translateY(-3px);
  }

  &:hover .hp-door-go {
    opacity: 1;
    transform: translateX(4px);
  }
}

html[dir="rtl"] .hp-door:hover .hp-door-go {
  transform: translateX(-4px);
}

.hp-door-num {
  font-family: var(--font-family-display);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--hp-gold);
}

.hp-door-ico {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 2px;
  color: #fff;
  background: linear-gradient(135deg, #2a1450 0%, #6d28d9 100%);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.hp-door-title {
  margin: 6px 0 0;
  font-size: clamp(1.3rem, 1.8vw, 1.6rem);
  font-weight: 500;
  line-height: 1.15;
}

html[dir="ltr"] .hp-door-title {
  font-family: var(--font-family-display);
}

html[dir="rtl"] .hp-door-title {
  font-family: var(--font-family-arabic);
}

.hp-door-desc {
  margin: 0;
  flex: 1;
  color: var(--hp-ink-soft);
  font-size: 15px;
  line-height: 1.65;
}

.hp-door-go {
  display: inline-flex;
  color: var(--hp-gold);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 240ms var(--ease-out), transform 240ms var(--ease-out);
}

// ── Index list ───────────────────────────────────────────────────────────
.hp-split {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}

.hp-index {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--hp-line);
}

.hp-index-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 18px;
  width: 100%;
  padding: 20px 6px;
  border: none;
  border-bottom: 1px solid var(--hp-line);
  background: transparent;
  color: var(--hp-ink);
  text-align: start;
  cursor: pointer;
  transition: padding-inline-start 220ms var(--ease-out), color 220ms var(--ease-out);

  &:hover {
    padding-inline-start: 16px;
    color: var(--hp-gold);
  }

  &:hover .hp-index-arrow {
    opacity: 1;
    transform: translateX(0);
  }
}

.hp-index-title {
  font-size: 17px;
  font-weight: 500;
}

.hp-index-region {
  font-size: 13px;
  color: var(--hp-ink-soft);
  white-space: nowrap;
}

.hp-index-arrow {
  display: inline-flex;
  color: var(--hp-gold);
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out);
}

html[dir="rtl"] .hp-index-row:hover .hp-index-arrow {
  transform: translateX(0);
}

// ── Donations ────────────────────────────────────────────────────────────
.hp-donations {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 20px;
}

.hp-donation {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 28px 26px;
  background: var(--hp-panel);
  border: 1px solid var(--hp-line);
  border-radius: 3px;
}

.hp-donation-amount {
  font-family: var(--font-family-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--hp-gold);
}

.hp-donation-msg {
  margin: 0;
  flex: 1;
  color: var(--hp-ink);
  font-size: 15px;
  line-height: 1.6;
}

.hp-donation-name {
  font-size: 13px;
  color: var(--hp-ink-soft);
}

.hp-donations-empty {
  margin: 0;
  text-align: center;
  color: var(--hp-ink-soft);
  font-size: 0.95rem;
}

// ── Family ───────────────────────────────────────────────────────────────
.hp-family {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: clamp(40px, 6vw, 88px);
  align-items: center;
}

.hp-family-copy .hp-cta {
  margin-top: 30px;
}

.hp-family-art {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1 / 1;
  max-height: 380px;
  overflow: hidden;
  background: radial-gradient(80% 80% at 50% 32%, rgba(212, 175, 55, 0.16), transparent 70%);
}

.hp-family-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--hp-gold-line);

  &--a {
    width: 62%;
    height: 62%;
    animation: spin-slow 26s linear infinite;
  }

  &--b {
    width: 86%;
    height: 86%;
    border-style: dashed;
    opacity: 0.6;
    animation: spin-slow 40s linear infinite reverse;
  }
}

.hp-family-ico {
  position: relative;
  color: #8B5CF6;
  opacity: 0.9;
}

@keyframes spin-slow {
  to { transform: rotate(360deg); }
}

// ── Responsive ───────────────────────────────────────────────────────────
@media (max-width: 900px) {
  .hp-doors { grid-template-columns: 1fr; }
  .hp-door { border-inline-start: none; }
  .hp-split { grid-template-columns: 1fr; }
  .hp-family { grid-template-columns: 1fr; }
  .hp-family-art { max-height: 300px; }
}

@media (max-width: 560px) {
  .hp-hero-actions { flex-direction: column; }
  .hp-cta { justify-content: center; width: 100%; }
  .hp-hero-title { max-width: 100%; }
}
</style>
