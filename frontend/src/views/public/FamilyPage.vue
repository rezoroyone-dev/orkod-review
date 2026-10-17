<template>
  <main class="fm-page">
    <section class="fm-hero">
      <div class="fm-hero-inner">
        <span class="fm-kicker">{{ t('Family_Kicker') }}</span>
        <h1 class="fm-title">{{ t('Family_Title') }}</h1>
        <p class="fm-sub">{{ t('Family_Subtitle') }}</p>
        <div class="fm-hero-actions">
          <v-btn to="/booking" color="primary" size="large" elevation="0" class="pressable">
            {{ t('Family_Cta_Book') }}
            <v-icon end>mdi-calendar-check</v-icon>
          </v-btn>
          <v-btn to="/consultations" variant="outlined" color="gold-ink" size="large" class="pressable">
            {{ t('Family_Cta_Consult') }}
          </v-btn>
        </div>
      </div>
      <div class="fm-hero-art" aria-hidden="true">
        <v-icon size="150" class="fm-hero-ico">mdi-home-heart</v-icon>
      </div>
    </section>

    <section class="fm-section">
      <div class="fm-inner">
        <div class="fm-circle" v-reveal>
          <div class="fm-circle-head">
            <div>
              <span class="fm-kicker">{{ t('Family_How_Kicker') }}</span>
              <h2 class="fm-circle-title">{{ t('Family_Circle_Title') }}</h2>
              <p class="fm-circle-sub">{{ t('Family_Circle_Sub') }}</p>
            </div>
          </div>

          <div v-if="circleStore.members.length" class="fm-cards">
            <article
              v-for="member in circleStore.members"
              :key="member.id"
              class="fm-card"
              :class="{ active: circleStore.activeMember?.id === member.id }"
            >
              <span class="fm-card-ico"><v-icon size="26">{{ relationIcon(member.relation) }}</v-icon></span>
              <div class="fm-card-body">
                <h3 class="fm-card-name">{{ member.name }}</h3>
                <p class="fm-card-meta">
                  {{ t(relationKey(member.relation)) }} · {{ t(ageKey(member.ageGroup)) }}
                </p>
                <div class="fm-card-actions">
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    class="pressable"
                    @click="circleStore.selectMember(member.id)"
                  >
                    {{ t('Family_Member_Select') }}
                  </v-btn>
                  <v-btn
                    size="small"
                    variant="text"
                    color="primary"
                    class="pressable"
                    @click="circleStore.removeMember(member.id)"
                  >
                    <v-icon size="16">mdi-delete-outline</v-icon>
                    {{ t('Family_Member_Remove') }}
                  </v-btn>
                </div>
              </div>
              <span v-if="circleStore.activeMember?.id === member.id" class="fm-card-active">
                {{ t('Family_Member_Active') }}
              </span>
            </article>
          </div>

          <v-empty-state
            v-else
            :text="t('Family_Empty')"
            icon="mdi-account-group-outline"
          />

          <div class="fm-circle-cta">
            <v-btn color="primary" size="large" elevation="0" class="pressable" @click="dialog = true">
              <v-icon start>mdi-account-plus</v-icon>
              {{ t('Family_Add_Member') }}
            </v-btn>
            <v-btn
              v-if="circleStore.activeMember"
              :to="`/booking?for=${encodeURIComponent(circleStore.activeMember.name)}`"
              color="primary"
              variant="outlined"
              size="large"
              class="pressable"
            >
              {{ t('Family_Book_For') }} {{ circleStore.activeMember.name }}
            </v-btn>
            <p v-if="savedNote" class="fm-saved-note">
              <v-icon size="15" color="primary">mdi-check-circle</v-icon>
              {{ t('Family_Saved') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <v-dialog v-model="dialog" max-width="440">
      <v-card class="fm-dialog">
        <v-card-title class="fm-dialog-title">{{ t('Family_Add_Member') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newMember.name"
            :label="t('Family_Member_Name')"
            variant="outlined"
            density="comfortable"
            :rules="[() => !!newMember.name.trim() || t('Book_Checkout_Buyer_Required')]"
            class="mb-4"
          />
          <v-select
            v-model="newMember.relation"
            :label="t('Family_Member_Relation')"
            :items="relationOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            class="mb-4"
          />
          <v-select
            v-model="newMember.ageGroup"
            :label="t('Family_Age')"
            :items="ageOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="fm-dialog-actions">
          <v-btn variant="text" color="primary" @click="dialog = false">
            {{ t('Book_Close') }}
          </v-btn>
          <v-btn color="primary" elevation="0" :disabled="!newMember.name.trim()" @click="addMember">
            {{ t('Family_Member_Add') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <section class="fm-section">
      <div class="fm-inner">
        <div class="fm-features">
          <article
            v-for="f in features"
            :key="f.title"
            class="fm-feature"
            v-reveal
          >
            <span class="fm-feature-ico"><v-icon size="26">{{ f.icon }}</v-icon></span>
            <h2 class="fm-feature-title">{{ f.title }}</h2>
            <p class="fm-feature-text">{{ f.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="fm-section fm-section--alt">
      <div class="fm-inner fm-steps" v-reveal>
        <div class="fm-steps-copy">
          <span class="fm-kicker">{{ t('Family_How_Kicker') }}</span>
          <h2 class="fm-steps-title">{{ t('Family_How_Title') }}</h2>
          <p class="fm-steps-sub">{{ t('Family_How_Sub') }}</p>
        </div>
        <ol class="fm-step-list">
          <li v-for="(s, i) in steps" :key="s" class="fm-step">
            <span class="fm-step-num">{{ i + 1 }}</span>
            <span>{{ s }}</span>
          </li>
        </ol>
      </div>
    </section>

    <section class="fm-section">
      <div class="fm-inner">
        <div class="fm-cta" v-reveal>
          <div>
            <h2 class="fm-cta-title">{{ t('Family_Cta_Title') }}</h2>
            <p class="fm-cta-sub">{{ t('Family_Cta_Sub') }}</p>
          </div>
          <v-btn to="/contact" color="primary" size="large" elevation="0" class="pressable">
            {{ t('Family_Cta_Contact') }}
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFamilyStore, type FamilyAgeGroup, type FamilyMember, type FamilyRelation } from '@/stores/family';

const { t } = useI18n();

const circleStore = useFamilyStore();

const dialog = ref(false);
const savedNote = ref(false);

const newMember = ref<{ name: string; relation: FamilyRelation; ageGroup: FamilyAgeGroup }>({
  name: '',
  relation: 'self',
  ageGroup: 'adult',
});

const RELATION_ICONS: Record<FamilyRelation, string> = {
  self: 'mdi-account',
  partner: 'mdi-account-heart',
  child: 'mdi-baby-face-outline',
  parent: 'mdi-account-cowboy-hat',
  sibling: 'mdi-account-multiple-outline',
  grandparent: 'mdi-human-cane',
  other: 'mdi-account-question',
};

const RELATION_KEYS: Record<FamilyRelation, string> = {
  self: 'Family_Relation_Self',
  partner: 'Family_Relation_Partner',
  child: 'Family_Relation_Child',
  parent: 'Family_Relation_Parent',
  sibling: 'Family_Relation_Sibling',
  grandparent: 'Family_Relation_Grandparent',
  other: 'Family_Relation_Other',
};

const AGE_KEYS: Record<FamilyAgeGroup, string> = {
  child: 'Family_Age_Child',
  teen: 'Family_Age_Teen',
  adult: 'Family_Age_Adult',
  senior: 'Family_Age_Senior',
};

const relationOptions = computed(() =>
  (Object.keys(RELATION_KEYS) as FamilyRelation[]).map((value) => ({
    value,
    label: t(RELATION_KEYS[value]),
  }))
);

const ageOptions = computed(() =>
  (Object.keys(AGE_KEYS) as FamilyAgeGroup[]).map((value) => ({
    value,
    label: t(AGE_KEYS[value]),
  }))
);

function relationIcon(relation: FamilyRelation): string {
  return RELATION_ICONS[relation] ?? 'mdi-account';
}

function relationKey(relation: FamilyRelation): string {
  return RELATION_KEYS[relation];
}

function ageKey(ageGroup: FamilyAgeGroup): string {
  return AGE_KEYS[ageGroup];
}

function addMember() {
  const member: FamilyMember = circleStore.addMember({
    name: newMember.value.name.trim(),
    relation: newMember.value.relation,
    ageGroup: newMember.value.ageGroup,
  });
  circleStore.selectMember(member.id);
  newMember.value = { name: '', relation: 'self', ageGroup: 'adult' };
  dialog.value = false;
  savedNote.value = true;
  window.setTimeout(() => { savedNote.value = false; }, 2600);
}

const features = computed(() => [
  {
    icon: 'mdi-account-heart-outline',
    title: t('Family_F1_Title'),
    text: t('Family_F1_Text'),
  },
  {
    icon: 'mdi-account-group-outline',
    title: t('Family_F2_Title'),
    text: t('Family_F2_Text'),
  },
  {
    icon: 'mdi-baby-face-outline',
    title: t('Family_F3_Title'),
    text: t('Family_F3_Text'),
  },
]);

const steps = computed(() => [
  t('Family_S1'),
  t('Family_S2'),
  t('Family_S3'),
  t('Family_S4'),
]);
</script>

<style scoped lang="scss">
.fm-page {
  background: #0B0718;
  color: #F3EFFC;
}

.fm-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 30px;
  align-items: center;
  padding: 72px 0 84px;
  background:
    radial-gradient(120% 150% at 88% -14%, rgba(212, 175, 55, 0.16), transparent 55%),
    radial-gradient(100% 130% at -6% 118%, rgba(139, 92, 246, 0.10), transparent 62%),
    linear-gradient(160deg, #140C29 0%, #0B0718 52%, #160D2B 100%);
}

.fm-hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  inset-inline: 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0.55) 50%, rgba(212, 175, 55, 0) 100%);
}

.fm-hero-inner {
  width: min(100% - 40px, 1180px);
  margin-inline: auto;
  padding-inline-start: max(20px, calc((100vw - 1180px) / 2));
}

.fm-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.fm-hero .fm-kicker {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #D4AF37;
}

.fm-hero .fm-kicker::before {
  content: '';
  width: 40px;
  height: 1px;
  border-radius: 1px;
  background: #D4AF37;
}

html[dir="rtl"] .fm-hero .fm-kicker::before { width: 0; }

.fm-title {
  margin: 10px 0;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.14;
  color: #F3EFFC;
}

html[dir="ltr"] .fm-title {
  font-family: var(--font-family-display);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.fm-sub {
  margin: 0;
  max-width: 540px;
  color: rgba(240, 236, 250, 0.62);
  line-height: 1.65;
}

.fm-hero-actions {
  display: flex;
  gap: 14px;
  margin-top: 26px;
  flex-wrap: wrap;
}

.fm-hero-art {
  display: grid;
  place-items: center;
  min-height: 260px;
}

.fm-hero-ico {
  color: #D4AF37;
  opacity: 0.5;
}

.fm-section {
  padding: clamp(60px, 8vw, 104px) 0;
}

.fm-section--alt {
  background: #0B0718;
}

.fm-inner {
  width: min(100% - 40px, 1180px);
  margin-inline: auto;
}

.fm-circle {
  display: grid;
  gap: 26px;
  padding: 36px;
  border-radius: 3px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
}

.fm-circle-title {
  margin: 8px 0 6px;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 500;
}

html[dir="ltr"] .fm-circle-title,
html[dir="ltr"] .fm-steps-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.fm-circle-sub {
  margin: 0;
  color: rgba(240, 236, 250, 0.6);
  line-height: 1.6;
}

.fm-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.fm-card {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 20px;
  border-radius: 3px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  transition: border-color 200ms ease;

  &.active {
    border-color: #D4AF37;
  }
}

.fm-card-ico {
  flex: none;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: rgba(212, 175, 55, 0.12);
  color: #D4AF37;
}

.fm-card-body {
  min-width: 0;
}

.fm-card-name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 500;
}

html[dir="ltr"] .fm-card-name {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.fm-card-meta {
  margin: 0 0 12px;
  font-size: 13px;
  color: rgba(240, 236, 250, 0.6);
}

.fm-card-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.fm-card-active {
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #D4AF37;
}

.fm-circle-cta {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.fm-saved-note {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--color-primary);
  font-weight: 600;
}

.fm-dialog-title {
  font-weight: 800;
}

.fm-dialog-actions {
  padding: 8px 16px 16px;
}

.fm-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.fm-feature {
  padding: 28px;
  border-radius: 3px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
}

.fm-feature-ico {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: rgba(212, 175, 55, 0.12);
  color: #D4AF37;
}

.fm-feature-title {
  margin: 16px 0 8px;
  font-size: 19px;
  font-weight: 500;
}

html[dir="ltr"] .fm-feature-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.fm-feature-text {
  margin: 0;
  color: rgba(240, 236, 250, 0.6);
  font-size: 14.5px;
  line-height: 1.6;
}

.fm-steps {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 40px;
  align-items: center;
}

.fm-steps-title {
  margin: 8px 0;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 500;
}

.fm-steps-sub {
  color: rgba(240, 236, 250, 0.6);
  line-height: 1.6;
}

.fm-step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.fm-step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 3px;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  font-size: 15px;
}

.fm-step-num {
  flex: none;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: linear-gradient(135deg, #f1d27a, #d4af37);
  color: #1c1327;
  font-weight: 700;
  font-size: 14px;
}

.fm-cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  padding: 36px;
  border-radius: 3px;
  background:
    radial-gradient(90% 130% at 100% 0%, rgba(212, 175, 55, 0.18), transparent 60%),
    #0B0718;
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: #F3EFFC;
}

.fm-cta-title {
  margin: 0 0 6px;
  font-size: clamp(21px, 2.6vw, 27px);
  font-weight: 500;
}

html[dir="ltr"] .fm-cta-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.fm-cta-sub {
  margin: 0;
  color: rgba(240, 236, 250, 0.62);
  max-width: 460px;
  line-height: 1.6;
}

@media (max-width: 860px) {
  .fm-hero {
    grid-template-columns: 1fr;
    padding: 44px 0;
  }

  .fm-steps {
    grid-template-columns: 1fr;
  }
}
</style>