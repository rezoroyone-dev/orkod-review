<template>
  <div>
    <template v-if="found">
      <PageHero
        eyebrow="Doctors_Eyebrow"
        :title="fullName"
        :subtitle="t('Doctor_Detail_Desc')"
        back-to="/doctors"
        back-label="Doctors_Back_Link"
      >
        <template #breadcrumb>{{ t('Doctors_Title') }}</template>
      </PageHero>

      <section class="dd-section">
        <div class="dd-inner">
          <div class="dd-card">
            <div class="dd-avatar">
              <img
                v-if="doctor.photoUrl"
                :src="doctor.photoUrl"
                :alt="fullName"
                class="dd-photo"
              />
              <template v-else>{{ initials }}</template>
            </div>
            <div class="dd-body">
              <h2 class="dd-name">{{ fullName }}</h2>
              <div class="dd-meta">
                <span v-if="doctor.specialty" class="dd-pill">
                  <v-icon size="14">mdi-briefcase-outline</v-icon>
                  {{ doctor.specialty }}
                </span>
                <span v-if="doctor.city" class="dd-pill">
                  <v-icon size="14">mdi-map-marker-outline</v-icon>
                  {{ doctor.city }}
                </span>
                <span v-if="doctor.yearsExperience" class="dd-pill">
                  <v-icon size="14">mdi-calendar-clock-outline</v-icon>
                  {{ t('Doctor_Detail_Years', { count: doctor.yearsExperience }) }}
                </span>
                <span v-if="doctor.verified" class="dd-pill dd-pill--green">
                  <v-icon size="14">mdi-check-circle</v-icon>
                  {{ t('Doctors_Verified') }}
                </span>
                <span
                  class="dd-pill"
                  :class="doctor.isAcceptingNew ? 'dd-pill--green' : 'dd-pill--muted'"
                >
                  <v-icon size="14">{{ doctor.isAcceptingNew ? 'mdi-check-decagram' : 'mdi-account-clock-outline' }}</v-icon>
                  {{ doctor.isAcceptingNew ? t('Doctor_Detail_AcceptingNew') : t('Doctor_Detail_NotAcceptingNew') }}
                </span>
              </div>

              <div v-if="ratingAverage > 0" class="dd-rating">
                <span class="dd-stars" :aria-label="t('Reviews_Section_Title')">
                  <v-icon
                    v-for="n in 5"
                    :key="n"
                    :size="18"
                    :color="n <= ratingAverage ? 'gold' : 'rgba(0,0,0,0.16)'"
                  >
                    {{ n <= ratingAverage ? 'mdi-star' : 'mdi-star-outline' }}
                  </v-icon>
                </span>
                <span class="dd-rating-text">
                  {{ t('Rating_Value', { rating: ratingAverage.toFixed(1), count: doctor.ratingCount || 0 }) }}
                </span>
              </div>

              <div v-if="doctor.about" class="dd-desc">{{ doctor.about }}</div>

              <div class="dd-info-grid">
                <div v-if="certifications.length" class="dd-info">
                  <h4 class="dd-info-title">{{ t('Doctor_Detail_Certifications') }}</h4>
                  <ul class="dd-list">
                    <li v-for="cert in certifications" :key="cert">{{ cert }}</li>
                  </ul>
                </div>
                <div v-if="doctor.workingHours" class="dd-info">
                  <h4 class="dd-info-title">{{ t('Doctor_Detail_WorkingHours') }}</h4>
                  <p class="dd-working">{{ doctor.workingHours }}</p>
                </div>
              </div>

              <div class="dd-actions">
                <v-btn color="primary" size="large" rounded="pill" elevation="0" to="/consultations">
                  <v-icon start>mdi-calendar-check-outline</v-icon>
                  {{ t('Doctor_Detail_Book_CTA') }}
                </v-btn>
                <v-btn variant="tonal" color="primary" size="large" rounded="pill" elevation="0" to="/assistant">
                  <v-icon start>mdi-lamp</v-icon>
                  {{ t('Doctor_Detail_Assistant_CTA') }}
                </v-btn>
              </div>
            </div>
          </div>

          <div class="dd-reviews">
            <div class="dd-reviews-head">
              <h3 class="dd-reviews-title">{{ t('Reviews_Section_Title') }}</h3>
              <span class="dd-reviews-count">{{ t('Reviews_Count', { count: reviews.length }) }}</span>
            </div>

            <v-progress-linear
              v-if="loadingReviews"
              indeterminate
              color="turquoise"
              class="dd-loader-sm"
            />
            <v-empty-state
              v-else-if="reviews.length === 0"
              :title="t('Reviews_Empty')"
              icon="mdi-star-outline"
              class="dd-reviews-empty"
            />

            <div v-else class="dd-reviews-list">
              <article v-for="review in reviews" :key="review.id" class="dd-review">
                <div class="dd-review-top">
                  <span class="dd-review-name">{{ review.authorName }}</span>
                  <span class="dd-review-stars" :aria-label="t('Reviews_Section_Title')">
                    <v-icon
                      v-for="n in 5"
                      :key="n"
                      :size="16"
                      :color="n <= review.rating ? 'gold' : 'rgba(0,0,0,0.16)'"
                    >
                      {{ n <= review.rating ? 'mdi-star' : 'mdi-star-outline' }}
                    </v-icon>
                  </span>
                  <time v-if="review.createdAt" class="dd-review-date">{{ review.createdAt }}</time>
                </div>
                <h4 v-if="review.title" class="dd-review-title">{{ review.title }}</h4>
                <p v-if="review.comment" class="dd-review-comment">{{ review.comment }}</p>
              </article>
            </div>

            <div class="dd-submit">
              <h3 class="dd-submit-title">{{ t('Reviews_Submit_Title') }}</h3>
              <v-alert v-if="submitSuccess" type="success" variant="tonal" density="comfortable" class="dd-alert">
                {{ t('Reviews_Submit_Success') }}
              </v-alert>
              <v-alert v-else-if="submitConflict" type="warning" variant="tonal" density="comfortable" class="dd-alert">
                {{ t('Reviews_Submit_Conflict') }}
              </v-alert>
              <v-alert v-else-if="submitError" type="error" variant="tonal" density="comfortable" class="dd-alert">
                {{ t('Reviews_Submit_Error') }}
              </v-alert>

              <v-form ref="formRef" class="dd-form" @submit.prevent="submitReview">
                <div class="dd-form-row">
                  <v-text-field
                    v-model="form.authorName"
                    :label="t('Reviews_Label_AuthorName')"
                    :placeholder="t('Reviews_Placeholder_AuthorName')"
                    density="comfortable"
                    variant="outlined"
                    :rules="[requiredRule]"
                    autocomplete="name"
                  />
                  <v-text-field
                    v-model="form.authorEmail"
                    :label="t('Reviews_Label_AuthorEmail')"
                    type="email"
                    density="comfortable"
                    variant="outlined"
                    :rules="[emailRule]"
                    autocomplete="email"
                  />
                </div>
                <v-select
                  v-model="form.rating"
                  :label="t('Reviews_Label_Rating')"
                  :items="[5, 4, 3, 2, 1]"
                  density="comfortable"
                  variant="outlined"
                  class="dd-form-rating"
                />
                <v-text-field
                  v-model="form.title"
                  :label="t('Reviews_Label_Title')"
                  :placeholder="t('Reviews_Placeholder_Title')"
                  density="comfortable"
                  variant="outlined"
                  counter="120"
                  :maxlength="120"
                />
                <v-textarea
                  v-model="form.comment"
                  :label="t('Reviews_Label_Comment')"
                  :placeholder="t('Reviews_Placeholder_Comment')"
                  density="comfortable"
                  variant="outlined"
                  :rules="[requiredRule]"
                  counter="2000"
                  :maxlength="2000"
                  rows="3"
                />
                <p class="dd-form-note">{{ t('Reviews_Note') }}</p>
                <v-btn
                  type="submit"
                  color="primary"
                  rounded="pill"
                  elevation="0"
                  :loading="submitting"
                  :disabled="submitting"
                >
                  {{ t('Reviews_Submit') }}
                </v-btn>
              </v-form>
            </div>
          </div>

          <div class="dd-note">
            <Disclaimer variant="notice">
              {{ t('Doctor_Detail_Note') }}
            </Disclaimer>
          </div>
        </div>
      </section>
    </template>

    <v-container v-else-if="loading" class="dd-state">
      <v-progress-linear indeterminate color="turquoise" class="dd-loader" />
    </v-container>

    <v-container v-else class="dd-state">
      <v-empty-state
        :title="t('Doctor_NotFound')"
        icon="mdi-stethoscope-off"
      >
        <v-btn color="primary" rounded="pill" to="/doctors">
          {{ t('Doctors_Back_Link') }}
        </v-btn>
      </v-empty-state>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PageHero from '@/components/layout/PageHero.vue';
import Disclaimer from '@/components/layout/Disclaimer.vue';
import DoctorService, { type Doctor, type Review } from '@/services/DoctorService';

const { t } = useI18n();
const route = useRoute();

const requestedId = Number(route.params.id);

const doctor = ref<Doctor | null>(null);
const loading = ref(true);
const notFound = ref(false);

const reviews = ref<Review[]>([]);
const loadingReviews = ref(false);

const found = computed(() => !!doctor.value && !notFound.value);

const fullName = computed(() => {
  if (!doctor.value) return '—';
  const parts = [doctor.value.firstName, doctor.value.lastName].filter(Boolean);
  return parts.length ? (parts as string[]).join(' ') : '—';
});

const initials = computed(() => {
  if (fullName.value === '—') return '?';
  return fullName.value
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

const ratingAverage = computed(() => {
  if (!doctor.value) return 0;
  return Number(doctor.value.ratingAvg) || 0;
});

const certifications = computed(() => {
  if (!doctor.value?.certifications) return [];
  return doctor.value.certifications
    .split(/[,\n]+/)
    .map((c: string) => c.trim())
    .filter(Boolean);
});

async function loadDoctor() {
  loading.value = true;
  notFound.value = false;
  try {
    doctor.value = await DoctorService.getDoctor(requestedId);
    if (!doctor.value) notFound.value = true;
  } catch (e) {
    notFound.value = true;
    console.warn('[DoctorDetailPage] load error', e);
  } finally {
    loading.value = false;
  }
  if (doctor.value) await loadReviews();
}

async function loadReviews() {
  loadingReviews.value = true;
  try {
    reviews.value = await DoctorService.getReviews('doctor', requestedId);
  } catch (e) {
    reviews.value = [];
    console.warn('[DoctorDetailPage] reviews error', e);
  } finally {
    loadingReviews.value = false;
  }
}

onMounted(loadDoctor);

// ---- review submission ----
const formRef = ref();
const submitting = ref(false);
const submitSuccess = ref(false);
const submitConflict = ref(false);
const submitError = ref(false);

const form = ref({
  authorName: '',
  authorEmail: '',
  rating: 5,
  title: '',
  comment: '',
});

const requiredRule = (v: string) => !!v?.trim() || t('Validation_Required');
const emailRule = (v: string) => {
  if (!v?.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || t('Validation_Email');
};

async function submitReview() {
  const valid = await formRef.value?.validate();
  if (!valid?.valid) return;

  submitting.value = true;
  submitSuccess.value = false;
  submitConflict.value = false;
  submitError.value = false;
  try {
    await DoctorService.submitReview({
      targetType: 'doctor',
      targetId: doctor.value!.id,
      rating: Number(form.value.rating),
      title: form.value.title.trim(),
      comment: form.value.comment.trim(),
      authorName: form.value.authorName.trim(),
      authorEmail: form.value.authorEmail.trim() || undefined,
    });
    form.value = { authorName: '', authorEmail: '', rating: 5, title: '', comment: '' };
    formRef.value?.reset();
    submitSuccess.value = true;
    await loadReviews();
  } catch (e: any) {
    if (e?.response?.status === 409) {
      submitConflict.value = true;
    } else {
      submitError.value = true;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.dd-section {
  padding-block: clamp(56px, 8vw, 96px);
  background: #0B0718;
  color: #F3EFFC;
}

.dd-inner {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dd-card {
  display: flex;
  gap: 28px;
  align-items: flex-start;
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 32px;
}

.dd-avatar {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 2.2rem;
  font-weight: 700;
  color: #f1d27a;
  background: linear-gradient(135deg, #2a1450, #6d28d9);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.42);
}

.dd-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dd-body {
  flex: 1;
  min-width: 0;
}

.dd-name {
  font-size: 1.7rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 10px;
}

html[dir="ltr"] .dd-name {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.dd-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 14px;
}

.dd-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(212, 175, 55, 0.1);
  color: #E9C766;
  border: 1px solid rgba(212, 175, 55, 0.28);
  border-radius: 2px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.dd-pill--green {
  background: rgba(35, 177, 77, 0.1);
  color: #1c7a3d;
  border-color: rgba(35, 177, 77, 0.28);
}

.dd-pill--muted {
  background: #0B0718;
  color: rgba(240, 236, 250, 0.55);
  border-color: rgba(240, 236, 250, 0.12);
}

.dd-rating {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.dd-stars {
  display: inline-flex;
  gap: 2px;
}

.dd-rating-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(240, 236, 250, 0.6);
}

.dd-desc {
  font-size: 0.98rem;
  line-height: 1.75;
  color: rgba(240, 236, 250, 0.6);
  margin: 0 0 24px;
  max-width: 720px;
  white-space: pre-line;
}

.dd-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin: 0 0 26px;
}

.dd-info-title {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #D4AF37;
  margin: 0 0 8px;
}

.dd-list {
  margin: 0;
  padding-inline-start: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.92rem;
  color: rgba(240, 236, 250, 0.6);
}

.dd-working {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgba(240, 236, 250, 0.6);
  white-space: pre-line;
}

.dd-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.dd-actions .v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}

.dd-reviews {
  background: #160D2B;
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 28px 32px;
}

.dd-reviews-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
}

.dd-reviews-title {
  font-size: 1.35rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0;
}

html[dir="ltr"] .dd-reviews-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.dd-reviews-count {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(240, 236, 250, 0.55);
}

.dd-loader-sm {
  max-width: 260px;
  margin-inline: auto;
  border-radius: 3px;
}

.dd-reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dd-review {
  border: 1px solid rgba(240, 236, 250, 0.1);
  border-radius: 3px;
  padding: 16px 18px;
}

.dd-review-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 6px;
}

.dd-review-name {
  font-weight: 700;
  color: #F3EFFC;
}

.dd-review-stars {
  display: inline-flex;
  gap: 1px;
}

.dd-review-date {
  margin-inline-start: auto;
  font-size: 0.78rem;
  color: rgba(240, 236, 250, 0.5);
}

.dd-review-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: #F3EFFC;
}

.dd-review-comment {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.65;
  color: rgba(240, 236, 250, 0.6);
}

.dd-submit {
  margin-top: 28px;
  border-top: 1px dashed rgba(212, 175, 55, 0.34);
  padding-top: 24px;
}

.dd-submit-title {
  font-size: 1.2rem;
  font-weight: 500;
  color: #F3EFFC;
  margin: 0 0 16px;
}

html[dir="ltr"] .dd-submit-title {
  font-family: var(--font-family-display);
  font-optical-sizing: auto;
}

.dd-alert {
  margin-bottom: 16px;
}

.dd-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 720px;
}

.dd-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.dd-form-rating {
  max-width: 200px;
}

.dd-form-note {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(240, 236, 250, 0.55);
}

.dd-note {
  max-width: 860px;
}

.dd-state {
  padding-block: 72px;
}

.dd-loader {
  max-width: 420px;
  margin-inline: auto;
  border-radius: 3px;
}

@media (max-width: 640px) {
  .dd-card {
    flex-direction: column;
  }

  .dd-avatar {
    width: 96px;
    height: 96px;
    font-size: 1.8rem;
  }

  .dd-form-row {
    grid-template-columns: 1fr;
  }
}
</style>