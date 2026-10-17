<template>
  <main class="sb-page">
    <!-- Once the booking exists the "final step / pick a date" framing is wrong.
         The topic title stays as context for what was booked; the kicker and
         the "pick a date" subtitle are dropped so they do not contradict the
         confirmation panel below. -->
    <PageHero
      :eyebrow="confirmed ? undefined : 'Booking_Kicker'"
      :title-text="topicTitle"
      :subtitle="confirmed ? undefined : 'Booking_Subtitle'"
    />
    <div class="sb-inner">
      <div v-if="specialtyInfo && specialtyInfo.healerCount === 0" class="sb-notice">
        <v-icon size="20" color="warning">mdi-account-clock-outline</v-icon>
        <span>{{ t('Booking_NoHealers') }}</span>
      </div>

      <div class="sb-steps" v-if="!confirmed">
        <section class="sb-card" v-reveal>
          <div class="sb-card-head">
            <span class="sb-step-num">1</span>
            <div>
              <h2 class="sb-card-title">{{ t('Booking_StepDate_Title') }}</h2>
              <p class="sb-card-note">{{ t('Booking_StepDate_Note') }}</p>
            </div>
          </div>

          <div class="sb-dates">
            <button
              v-for="d in days"
              :key="d.iso"
              type="button"
              class="sb-date"
              :class="{ active: d.iso === date }"
              @click="onPickDate(d.iso)"
            >
              <span class="sb-date-wd">{{ d.weekday }}</span>
              <span class="sb-date-num">{{ d.day }}</span>
              <span class="sb-date-mon">{{ d.month }}</span>
            </button>
          </div>
        </section>

        <section class="sb-card" v-reveal :style="{ '--reveal-delay': '60ms' }">
          <div class="sb-card-head">
            <span class="sb-step-num">2</span>
            <div>
              <h2 class="sb-card-title">{{ t('Booking_StepTime_Title') }}</h2>
              <p class="sb-card-note">{{ t('Booking_StepTime_Note') }}</p>
            </div>
          </div>

          <div v-if="!date" class="sb-empty">{{ t('Booking_PickDateFirst') }}</div>
          <div v-else-if="loadingSlots" class="sb-empty">
            <v-progress-circular indeterminate color="primary" size="22" width="2" />
            {{ t('Booking_Loading') }}
          </div>
          <div v-else-if="slots.length === 0" class="sb-empty">{{ t('Booking_NoSlots') }}</div>
          <div v-else class="sb-times">
            <button
              v-for="s in slots"
              :key="s.start"
              type="button"
              class="sb-time"
              :class="{ active: picked?.start === s.start }"
              @click="picked = s"
            >
              <strong>{{ timeLabel(s.start) }}</strong>
              <span class="sb-time-healers">{{ s.healers.length }} {{ t('Booking_Healers') }}</span>
            </button>
          </div>
        </section>

        <section class="sb-card" v-reveal :style="{ '--reveal-delay': '120ms' }">
          <div class="sb-card-head">
            <span class="sb-step-num">3</span>
            <div>
              <h2 class="sb-card-title">{{ t('Booking_StepForm_Title') }}</h2>
              <p class="sb-card-note">{{ t('Booking_StepForm_Note') }}</p>
            </div>
          </div>

          <div class="sb-form">
            <v-text-field v-model="form.firstName" :label="t('Booking_FirstName')" density="comfortable" variant="outlined" />
            <v-text-field v-model="form.lastName" :label="t('Booking_LastName')" density="comfortable" variant="outlined" />
            <v-text-field v-model="form.phone" :label="t('Booking_Phone')" density="comfortable" variant="outlined" :rules="[rules.required]" />
            <v-text-field v-model="form.email" :label="t('Booking_Email_Opt')" density="comfortable" variant="outlined" />
          </div>

          <div class="sb-summary">
            <div class="sb-sum-row"><span>{{ t('Booking_Summary_Session') }}</span><strong>{{ topicTitle }}</strong></div>
            <div class="sb-sum-row"><span>{{ t('Booking_Summary_When') }}</span><strong>{{ picked ? `${dateLabel} · ${timeLabel(picked.start)}` : '—' }}</strong></div>
            <div class="sb-sum-row"><span>{{ t('Booking_Summary_Assigned') }}</span><strong>{{ t('Booking_Assigned_Auto') }}</strong></div>
            <div v-if="sessionPrice > 0" class="sb-sum-row sb-fee-row">
              <span>{{ t('Booking_Summary_Fee') }}</span>
              <strong>{{ t('Currency') }}{{ sessionPriceToFixed }}</strong>
            </div>
            <div class="sb-sum-row"><span>{{ t('Booking_Summary_Payment') }}</span><strong class="sb-muted">{{ t('Booking_Payment_Placeholder') }}</strong></div>
          </div>

          <v-checkbox
            v-model="form.consent"
            :label="t('Booking_Consent')"
            density="comfortable"
            color="primary"
            hide-details
          />

          <div v-if="payStep" class="sb-pay">
            <span class="sb-pay-eye">{{ t('Booking_Pay_Title') }}</span>
            <div class="sb-sum-row"><span>{{ t('Booking_Summary_Session') }}</span><strong>{{ topicTitle }}</strong></div>
            <div class="sb-sum-row"><span>{{ t('Booking_Summary_When') }}</span><strong>{{ picked ? `${dateLabel} · ${timeLabel(picked.start)}` : '—' }}</strong></div>
            <div class="sb-sum-row"><span>{{ t('Booking_Summary_Assigned') }}</span><strong>{{ t('Booking_Assigned_Auto') }}</strong></div>
            <div v-if="sessionPrice > 0" class="sb-sum-row sb-fee-row">
              <span>{{ t('Booking_Summary_Fee') }}</span>
              <strong>{{ t('Currency') }}{{ sessionPriceToFixed }}</strong>
            </div>

            <div class="sb-pay-methods" aria-hidden="true">
              <v-icon size="18">mdi-credit-card-outline</v-icon>
              <v-icon size="18">mdi-credit-card-multiple-outline</v-icon>
              <v-icon size="14">mdi-lock-outline</v-icon>
            </div>
            <p class="sb-pay-note">{{ t('Booking_Pay_Note') }}</p>
            <p class="sb-pay-demo">{{ t('Booking_Pay_Demo') }}</p>
          </div>

          <div class="sb-actions">
            <v-btn
              v-if="payStep"
              variant="text"
              color="primary"
              size="large"
              class="pressable"
              @click="payStep = false"
            >
              {{ t('Booking_Pay_Back') }}
            </v-btn>
            <v-btn
              :color="payStep ? 'success' : 'primary'"
              size="large"
              elevation="0"
              :disabled="!canSubmit || submitting"
              :loading="submitting"
              class="pressable"
              @click="onPrimaryAction"
            >
              <template v-if="payStep">
                {{ t('Booking_Pay_Button', { amount: t('Currency') + sessionPriceToFixed }) }}
              </template>
              <template v-else>
                {{ t('Booking_ToPayment') }}
                <v-icon end>mdi-credit-card-outline</v-icon>
              </template>
            </v-btn>
            <p v-if="errorMsg" class="sb-error">{{ friendlyError }}</p>
          </div>
        </section>
      </div>

      <div v-else class="sb-done" v-reveal>
        <span class="sb-done-ico"><v-icon size="44" color="white">mdi-check</v-icon></span>
        <h2 class="sb-done-title">{{ t('Booking_Done_Title') }}</h2>
        <p class="sb-done-sub">{{ t('Booking_Done_Sub') }}</p>

        <div class="sb-done-card">
          <div class="sb-sum-row"><span>{{ t('Booking_Rec_Number') }}</span><strong>#{{ confirmed.id }}</strong></div>
          <div class="sb-sum-row"><span>{{ t('Booking_Rec_Healer') }}</span><strong>{{ confirmed.healerName }}</strong></div>
          <div class="sb-sum-row"><span>{{ t('Booking_Rec_When') }}</span><strong>{{ confirmed.when }}</strong></div>
          <div class="sb-sum-row"><span>{{ t('Booking_Rec_Status') }}</span><strong class="sb-status">{{ confirmed.status }}</strong></div>
        </div>

        <div class="sb-done-actions">
          <v-btn to="/home" variant="outlined" color="primary" class="pressable">{{ t('Booking_BackHome') }}</v-btn>
          <v-btn to="/body" color="primary" elevation="0" class="pressable">{{ t('Booking_Explore') }}</v-btn>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PageHero from '@/components/layout/PageHero.vue';
import { TOPICS, LangCode } from '@/data/wellness';
import { useFamilyStore } from '@/stores/family';
import SpecialtyService, {
  PublicSlot,
  PublicSpecialty,
} from '@/services/SpecialtyService';

const route = useRoute();
const { t, locale } = useI18n();
const family = useFamilyStore();

const slug = computed(() => String(route.params.slug || ''));
const currentLocale = computed(() => (locale.value as LangCode) || 'en');

const topicTitle = computed(() => {
  const topic = TOPICS.find((tp) => tp.slug === slug.value);
  return topic?.content[currentLocale.value]?.title || topic?.content.en.title || slug.value;
});

const rules = {
  required: (v: string) => !!String(v || '').trim() || t('Validation_Required'),
};

const specialtyInfo = ref<PublicSpecialty | null>(null);
const date = ref('');
const slots = ref<PublicSlot[]>([]);
const loadingSlots = ref(false);
const picked = ref<PublicSlot | null>(null);
const submitting = ref(false);
const errorMsg = ref('');
const confirmed = ref<{ id: number; healerName: string; when: string; status: string } | null>(null);
const sessionPrice = ref(0);
const sessionPriceToFixed = computed(() => Number(sessionPrice.value).toFixed(2));

const form = ref({
  firstName: route.query.for ? prefillName(String(route.query.for)) : '',
  lastName: '',
  phone: '',
  email: '',
  consent: false,
});

function prefillName(memberId: string): string {
  const member = family.members.find((m) => m.id === memberId);
  return member ? member.name : '';
}

const payStep = ref(false);

function onPrimaryAction() {
  if (payStep.value) {
    submit();
  } else if (canSubmit.value) {
    payStep.value = true;
  }
}

watch(
  () => [date.value, picked.value, form.value.firstName, form.value.lastName, form.value.phone, form.value.email, form.value.consent],
  () => {
    payStep.value = false;
  }
);

const tzOffset = -new Date().getTimezoneOffset();

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const days = computed(() => {
  const out: { iso: string; weekday: string; day: string; month: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({
      iso,
      weekday: dayNames[d.getDay()],
      day: String(d.getDate()).padStart(2, '0'),
      month: monthNames[d.getMonth()],
    });
  }
  return out;
});

const dateLabel = computed(() => {
  const d = days.value.find((x) => x.iso === date.value);
  return d ? `${d.weekday} ${d.day} ${d.month}` : date.value;
});

function timeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const canSubmit = computed(
  () =>
    form.value.firstName.trim() !== '' &&
    form.value.phone.trim() !== '' &&
    form.value.consent &&
    picked.value !== null &&
    date.value !== ''
);

const friendlyError = computed(() => {
  const map: Record<string, string> = {
    No_healers_available: t('Booking_Err_NoHealers'),
    Already_has_upcoming_booking: t('Booking_Err_Duplicate'),
    Contact_required: t('Booking_Err_Contact'),
    Consent_required: t('Booking_Err_Consent'),
    Invalid_booking_times: t('Booking_Err_Times'),
    Invalid_date_range: t('Booking_Err_Times'),
    Slot_already_booked: t('Booking_Err_Taken'),
    Slot_in_the_past: t('Booking_Err_Past'),
    Specialty_required: t('Booking_Err_Specialty'),
  };
  if (map[errorMsg.value]) return map[errorMsg.value];
  // Never surface a raw machine code (e.g. a new backend code this build does
  // not know yet) to a visitor.
  if (/^[A-Za-z][A-Za-z0-9_]*$/.test(errorMsg.value)) return t('Booking_Err_Generic');
  return errorMsg.value;
});

async function loadSlots() {
  if (!date.value || !slug.value) return;
  loadingSlots.value = true;
  picked.value = null;
  try {
    const res = await SpecialtyService.getPublicSlots(slug.value, date.value, tzOffset);
    slots.value = res.slots;
  } catch {
    slots.value = [];
  } finally {
    loadingSlots.value = false;
  }
}

function onPickDate(iso: string) {
  date.value = iso;
  loadSlots();
}

async function submit() {
  if (!picked.value || !canSubmit.value) return;
  submitting.value = true;
  errorMsg.value = '';
  try {
    const slot = picked.value;
    const result = await SpecialtyService.bookSpecialty({
      specialty: slug.value,
      title: topicTitle.value,
      start: slot.start,
      end: slot.end,
      attendees: [
        {
          firstName: form.value.firstName.trim(),
          lastName: form.value.lastName.trim(),
          email: form.value.email.trim(),
          phone: form.value.phone.trim(),
        },
      ],
      consent: form.value.consent,
    });
    confirmed.value = {
      id: result.booking.id,
      healerName: result.healer?.name || '—',
      when: `${dateLabel.value} · ${timeLabel(slot.start)}`,
      status: result.booking.status,
    };
    slots.value = slots.value.filter((s) => s.start !== slot.start);
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { error?: string } } })?.response?.data;
    errorMsg.value = data?.error || t('Booking_Err_Generic');
  } finally {
    submitting.value = false;
  }
}

watch(slug, async () => {
  specialtyInfo.value = null;
  confirmed.value = null;
  date.value = '';
  slots.value = [];
  picked.value = null;
  await fetchSpecialty();
});

async function fetchSpecialty() {
  if (!slug.value) return;
  try {
    const list = await SpecialtyService.getPublicSpecialties();
    specialtyInfo.value = list.find((s) => s.specialty === slug.value) || null;
  } catch {
    specialtyInfo.value = null;
  }
}

async function fetchConfig() {
  try {
    const config = await SpecialtyService.getPublicConfig();
    sessionPrice.value = config.sessionPrice || 0;
  } catch {
    sessionPrice.value = 0;
  }
}

onMounted(() => {
  fetchConfig();
  fetchSpecialty();
  date.value = days.value[0]?.iso || '';
  loadSlots();
});
</script>

<style scoped lang="scss">
.sb-page {
  background: #0B0718;
  color: #F3EFFC;
  min-height: 70svh;
  padding: 0 0 70px;
}

.sb-inner {
  width: min(100% - 48px, 1080px);
  margin-inline: auto;
  padding-top: 44px;
}

.sb-sub {
  margin: 0 0 26px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.sb-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  margin-bottom: 20px;
  font-size: 14px;
}

.sb-steps {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sb-card {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 28px;
}

.sb-card-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.sb-step-num {
  flex: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: linear-gradient(135deg, #f1d27a, #d4af37);
  color: #1c1327;
  font-weight: 700;
  font-size: 15px;
}

.sb-card-title {
  margin: 0;
  font-size: 19px;
  font-weight: 500;
}

html[dir="ltr"] .sb-card-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.sb-card-note {
  margin: 3px 0 0;
  color: rgba(240, 236, 250, 0.6);
  font-size: 13.5px;
}

.sb-dates {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.sb-date {
  flex: none;
  width: 66px;
  padding: 10px 6px;
  border-radius: 3px;
  border: 1px solid rgba(240, 236, 250, 0.12);
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 150ms var(--ease-out);

  &:hover {
    border-color: #D4AF37;
  }

  &.active {
    background: linear-gradient(135deg, #f1d27a, #d4af37);
    border-color: transparent;
    color: #1c1327;
  }
}

.sb-date-wd {
  font-size: 11px;
  opacity: 0.75;
}

.sb-date-num {
  font-size: 19px;
  font-weight: 700;
}

.sb-date-mon {
  font-size: 10.5px;
  opacity: 0.75;
}

.sb-times {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.sb-time {
  padding: 12px;
  border-radius: 3px;
  border: 1px solid rgba(240, 236, 250, 0.12);
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 3px;
  cursor: pointer;
  transition: all 150ms var(--ease-out);

  strong {
    font-size: 16px;
  }

  &:hover {
    border-color: #D4AF37;
  }

  &.active {
    background: linear-gradient(135deg, #f1d27a, #d4af37);
    border-color: transparent;
    color: #1c1327;

    .sb-time-healers {
      color: rgba(28, 19, 39, 0.75);
    }
  }
}

.sb-time-healers {
  font-size: 12px;
  color: rgba(240, 236, 250, 0.6);
}

.sb-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(240, 236, 250, 0.6);
  font-size: 14px;
  padding: 8px 0;
}

.sb-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.sb-summary,
.sb-done-card {
  margin: 16px 0;
  padding: 16px;
  border-radius: 3px;
  background: #0B0718;
  border: 1px solid rgba(240, 236, 250, 0.1);
}

.sb-sum-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 7px 0;
  font-size: 14px;

  span {
    color: rgba(240, 236, 250, 0.6);
  }

  strong {
    text-align: end;
  }
}

.sb-muted {
  color: #D4AF37;
}

.sb-fee-row strong {
  color: #D4AF37;
  font-size: 15px;
}

.sb-pay {
  margin-top: 18px;
  padding: 18px;
  border-radius: 3px;
  background: #0B0718;
  border: 1px solid rgba(212, 175, 55, 0.35);
  animation: fade-in-up 240ms var(--ease-out) both;
}

.sb-pay-eye {
  display: block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #D4AF37;
  margin-bottom: 6px;
}

.sb-pay-methods {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  color: rgba(240, 236, 250, 0.6);
}

.sb-pay-note {
  margin: 10px 0 0;
  font-size: 13px;
  color: rgba(240, 236, 250, 0.6);
  line-height: 1.6;
}

.sb-pay-demo {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: #D4AF37;
}

.sb-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.sb-error {
  color: #dc2626;
  font-size: 14px;
  margin: 0;
}

.sb-done {
  text-align: center;
  padding: 30px 0;
}

.sb-done-ico {
  width: 84px;
  height: 84px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  border-radius: 3px;
  background: linear-gradient(135deg, #f1d27a, #d4af37);
}

.sb-done-title {
  margin: 22px 0 6px;
  font-size: 28px;
  font-weight: 500;
}

html[dir="ltr"] .sb-done-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.sb-done-sub {
  color: rgba(240, 236, 250, 0.6);
  margin: 0 auto;
  max-width: 460px;
  line-height: 1.6;
}

.sb-done-card {
  max-width: 460px;
  margin-inline: auto;
  text-align: start;
}

.sb-status {
  text-transform: capitalize;
  color: #D4AF37;
}

.sb-done-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 22px;
  flex-wrap: wrap;
}
</style>