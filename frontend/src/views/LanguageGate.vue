<template>
  <main class="gate">
    <!-- Warm ivory stage: a soft brand aurora under a film-grain wash, matching
         the light editorial hero used across the rest of the site. -->
    <div class="gate-aura aurora" aria-hidden="true"></div>
    <div class="gate-grain grain" aria-hidden="true"></div>

    <div class="gate-card">
      <span class="gate-emblem">
        <img :src="logo" alt="Orkod" class="gate-logo" />
      </span>
      <h1 class="gate-title">
        <span class="gate-title-word">Orkod</span><span class="gate-title-acc">.</span>
      </h1>
      <p class="gate-sub">{{ t('Gate_Subtitle') }}</p>

      <div class="gate-divider"><span>{{ t('Gate_ChooseLanguage') }}</span></div>

      <div class="gate-grid">
        <button
          v-for="(opt, i) in options"
          :key="opt.value"
          type="button"
          class="gate-lang pressable sheen"
          :lang="opt.value"
          :style="{ '--i': i }"
          @click="choose(opt.value)"
        >
          <span :class="['fi', 'fi-' + opt.flag]" :title="opt.text" />
          <span class="gate-lang-name">{{ opt.text }}</span>
          <span class="gate-lang-go" aria-hidden="true">
            <v-icon size="16">mdi-arrow-right</v-icon>
          </span>
        </button>
      </div>

      <p class="gate-foot">{{ t('Gate_Footnote') }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import Language from '@/utilities/Language';

const { t, locale } = useI18n();
const router = useRouter();
const appStore = useAppStore();

const logo = computed(() =>
  new URL('@/static/OrkodLogo.png', import.meta.url).href
);

const flagByLang: Record<string, string> = {
  en: 'gb',
  fr: 'fr',
  id: 'id',
  ar: 'sa',
};

const options = Language.langs.map((l) => ({
  value: l.value,
  text: l.text,
  flag: flagByLang[l.value] || 'gb',
}));

function choose(lang: string) {
  locale.value = lang;
  appStore.setLocale(lang);
  router.push('/home');
}
</script>

<style scoped lang="scss">
// The first screen everyone sees. It carries the same warm ivory editorial
// surface as the public hero — soft brand aurora, film grain, gold hairlines —
// and stages the language choice as the site's opening beat.
.gate {
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: 48px 20px;
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 50% -12%, #241540 0%, #0B0718 46%, #160D2B 100%);
  color: #F3EFFC;
}

.gate-aura {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.3;
}

.gate-grain {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.35;
}

.gate-card {
  position: relative;
  z-index: 2;
  width: min(100%, 660px);
  text-align: center;
  padding: 52px 34px 44px;
  border-radius: 4px;
  background: rgba(22, 13, 43, 0.62);
  border: 1px solid rgba(212, 175, 55, 0.28);
  backdrop-filter: blur(20px);
  box-shadow:
    0 44px 100px -46px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  animation: gate-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.gate-emblem {
  display: inline-grid;
  place-items: center;
  padding: 8px;
  border-radius: 50%;
  background: conic-gradient(from 210deg, rgba(241, 210, 122, 0.95), rgba(139, 92, 246, 0.85), rgba(241, 210, 122, 0.95));
  box-shadow: 0 18px 40px -18px rgba(240, 236, 250, 0.4);
  animation: gate-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
}

.gate-logo {
  /* The logo asset is a square emblem on a white field; frame it deliberately. */
  display: block;
  width: 76px;
  height: 76px;
  object-fit: cover;
  border-radius: 50%;
  background: #160D2B;
}

.gate-title {
  margin: 18px 0 8px;
  font-family: var(--font-family-display, var(--font-family-heading, var(--font-family-latin)));
  font-size: clamp(40px, 7vw, 62px);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #F3EFFC;
  animation: gate-rise 760ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both;
}

.gate-title-acc {
  color: #D4AF37;
}

.gate-sub {
  margin: 0 auto;
  max-width: 430px;
  color: rgba(240, 236, 250, 0.62);
  font-size: 15px;
  line-height: 1.6;
  animation: gate-rise 760ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both;
}

.gate-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 34px 0 22px;
  color: rgba(240, 236, 250, 0.55);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  animation: gate-rise 760ms cubic-bezier(0.22, 1, 0.36, 1) 320ms both;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(240, 236, 250, 0.16), transparent);
  }
}

.gate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(216px, 1fr));
  gap: 14px;
}

.gate-lang {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 16px;
  border-radius: 3px;
  border: 1px solid rgba(240, 236, 250, 0.14);
  background: #160D2B;
  color: #F3EFFC;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 220ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    background 220ms var(--ease-out, ease),
    border-color 220ms var(--ease-out, ease),
    box-shadow 220ms var(--ease-out, ease);
  animation: gate-pop 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(380ms + var(--i, 0) * 70ms);

  &:hover {
    background: #160D2B;
    border-color: rgba(212, 175, 55, 0.6);
    transform: translateY(-3px);
    box-shadow: 0 18px 36px -20px rgba(240, 236, 250, 0.34);
  }

  &:hover .gate-lang-go {
    opacity: 1;
    transform: translateX(2px);
  }

  :deep(.fi) {
    width: 30px;
    height: 21px;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(240, 236, 250, 0.18);
  }
}

.gate-lang-name {
  flex: 1;
  text-align: start;
}

.gate-lang-go {
  display: inline-flex;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 220ms ease, transform 220ms ease;
  color: #D4AF37;
}

.gate-foot {
  margin-top: 28px;
  color: rgba(240, 236, 250, 0.5);
  font-size: 12.5px;
  animation: gate-rise 760ms cubic-bezier(0.22, 1, 0.36, 1) 560ms both;
}

@keyframes gate-in {
  from {
    opacity: 0;
    transform: translate3d(0, 26px, 0) scale(0.988);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: blur(0);
  }
}

@keyframes gate-rise {
  from {
    opacity: 0;
    transform: translate3d(0, 18px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes gate-pop {
  from {
    opacity: 0;
    transform: translate3d(0, 14px, 0) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
