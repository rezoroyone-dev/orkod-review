<template>
  <v-container class="pa-0 pa-sm-4">
    <v-row justify="center" no-gutters>
      <v-col cols="12" md="10" lg="8">
        <v-card class="elevation-12 rounded-lg overflow-hidden">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="text-h6 text-sm-h5">{{ t('Book_a_Healing_Session') }}</v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pa-0">
            <v-stepper v-model="step" class="elevation-0">
              <v-stepper-header class="elevation-0">
                <v-stepper-item :title="t('Select_Time')" :value="1"></v-stepper-item>
                <v-divider></v-divider>
                <v-stepper-item :title="t('Your_Details')" :value="2"></v-stepper-item>
                <v-divider></v-divider>
                <v-stepper-item :title="t('Booking_Summary')" :value="3"></v-stepper-item>
              </v-stepper-header>

              <v-stepper-window>
                <!-- Step 1: Select Time -->
                <v-stepper-window-item :value="1" class="pa-4 pa-sm-6">
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="text-subtitle-1 mb-2 font-weight-bold">{{ t('Choose_a_Date') }}</div>
                      <v-date-picker
                        v-model="selectedDate"
                        @update:model-value="onDateChange"
                        color="primary"
                        elevation="2"
                        class="mx-auto"
                        full-width
                        :min="minDate"
                      ></v-date-picker>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="text-subtitle-1 mb-2 font-weight-bold">{{ t('Available_Slots') }}</div>
                      <v-progress-circular v-if="loadingSlots" indeterminate color="primary" class="d-block mx-auto my-10"></v-progress-circular>
                      <template v-else>
                        <v-chip-group v-model="selectedSlot" column v-if="availableSlots.length > 0">
                          <v-chip
                            v-for="(slot, index) in availableSlots"
                            :key="index"
                            :value="slot"
                            filter
                            color="primary"
                            variant="outlined"
                            class="ma-1"
                          >
                            {{ slot.startTime }} - {{ slot.endTime }}
                          </v-chip>
                        </v-chip-group>
                        <v-alert v-else type="info" variant="tonal" class="mt-4">
                          {{ t('No_slots_available_for_this_date') }}
                        </v-alert>
                      </template>
                    </v-col>
                  </v-row>
                  <div class="d-flex justify-end mt-6">
                    <v-btn color="primary" size="large" @click="step = 2" :disabled="!selectedSlot">
                      {{ t('Next') }}
                    </v-btn>
                  </div>
                </v-stepper-window-item>

                <!-- Step 2: Your Details -->
                <v-stepper-window-item :value="2" class="pa-4 pa-sm-6">
                  <v-form ref="bookingForm" v-model="isFormValid">
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field v-model="bookingInfo.firstName" :label="t('First_Name')" required :rules="[v => !!v || t('Field_Required')]"></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field v-model="bookingInfo.lastName" :label="t('Last_Name')" required :rules="[v => !!v || t('Field_Required')]"></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field v-model="bookingInfo.email" :label="t('Email')" type="email" required :rules="[v => !!v || t('Field_Required'), v => /.+@.+\..+/.test(v) || t('Email_must_be_valid')]"></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field v-model="bookingInfo.phone" :label="t('Phone')" required :rules="[v => !!v || t('Field_Required')]"></v-text-field>
                      </v-col>
                    </v-row>
                  </v-form>
                  <div class="d-flex justify-space-between mt-6">
                    <v-btn variant="text" @click="step = 1">{{ t('Back') }}</v-btn>
                    <v-btn color="success" size="large" @click="confirmBooking" :disabled="!isFormValid || bookingLoading" :loading="bookingLoading">
                      {{ t('Confirm_Booking') }}
                    </v-btn>
                  </div>
                </v-stepper-window-item>

                <!-- Step 3: Booking Confirmed -->
                <v-stepper-window-item :value="3" class="pa-4 pa-sm-6">
                  <div class="text-center mb-6">
                    <v-avatar color="success" size="80" class="mb-4">
                      <v-icon size="48" color="white">mdi-check-circle</v-icon>
                    </v-avatar>
                    <h2 class="text-h5 font-weight-bold text-success mb-2">{{ t('Booking_Confirmed') }}</h2>
                    <p class="text-body-2 text-medium-emphasis">{{ t('Booking_confirmed_successfully') }}</p>
                  </div>

                  <!-- Summary Card -->
                  <v-card variant="outlined" rounded="lg" class="mb-6">
                    <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
                      <v-icon class="mr-2" color="primary">mdi-clipboard-text-outline</v-icon>
                      {{ t('Booking_Summary') }}
                    </v-card-title>
                    <v-divider />
                    <v-list density="compact" class="pa-2">
                      <v-list-item>
                        <template #prepend>
                          <v-icon color="primary" class="mr-3">mdi-calendar</v-icon>
                        </template>
                        <v-list-item-title class="text-caption text-medium-emphasis">{{ t('Booking_Date') }}</v-list-item-title>
                        <v-list-item-subtitle class="font-weight-medium text-body-2">{{ bookingSummary.date }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-divider inset />
                      <v-list-item>
                        <template #prepend>
                          <v-icon color="primary" class="mr-3">mdi-clock-outline</v-icon>
                        </template>
                        <v-list-item-title class="text-caption text-medium-emphasis">{{ t('Booking_Time') }}</v-list-item-title>
                        <v-list-item-subtitle class="font-weight-medium text-body-2">{{ bookingSummary.time }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-divider inset />
                      <v-list-item>
                        <template #prepend>
                          <v-icon color="primary" class="mr-3">mdi-account</v-icon>
                        </template>
                        <v-list-item-title class="text-caption text-medium-emphasis">{{ t('Booking_Name') }}</v-list-item-title>
                        <v-list-item-subtitle class="font-weight-medium text-body-2">{{ bookingSummary.name }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-divider inset />
                      <v-list-item>
                        <template #prepend>
                          <v-icon color="primary" class="mr-3">mdi-email-outline</v-icon>
                        </template>
                        <v-list-item-title class="text-caption text-medium-emphasis">{{ t('Booking_Email') }}</v-list-item-title>
                        <v-list-item-subtitle class="font-weight-medium text-body-2">{{ bookingSummary.email }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-divider inset />
                      <v-list-item>
                        <template #prepend>
                          <v-icon color="primary" class="mr-3">mdi-phone-outline</v-icon>
                        </template>
                        <v-list-item-title class="text-caption text-medium-emphasis">{{ t('Booking_Phone') }}</v-list-item-title>
                        <v-list-item-subtitle class="font-weight-medium text-body-2">{{ bookingSummary.phone }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card>

                  <v-alert type="info" variant="tonal" class="mb-4" density="compact">
                    {{ t('Booking_confirmation_note') }}
                  </v-alert>

                  <div class="d-flex justify-center">
                    <v-btn color="primary" size="large" @click="startNewBooking" prepend-icon="mdi-calendar-plus">
                      {{ t('New_Booking') }}
                    </v-btn>
                  </div>
                </v-stepper-window-item>
              </v-stepper-window>
            </v-stepper>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <ProgressBar :loading="loading || bookingLoading" />
    <MessageBoxDialog :msgBox="msgBox" :close="closeMsgBox" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AvailabilityService from '@/services/AvailabilityService';
import { useMessageBox } from '@/composables/useMessageBox';
import ProgressBar from '@/dialogs/ProgressBar.vue';
import MessageBoxDialog from '@/dialogs/MessageBoxDialog.vue';
import { format } from 'date-fns';

const { t } = useI18n();
const { msgBox, showMsgBox, closeMsgBox } = useMessageBox();

const step = ref(1);
const loading = ref(false);
const loadingSlots = ref(false);
const bookingLoading = ref(false);
const healers = ref<any[]>([]);
const selectedDate = ref(new Date());
const minDate = new Date().toISOString().split('T')[0];
const availableSlots = ref<any[]>([]);
const selectedSlot = ref<any>(null);
const isFormValid = ref(false);
const bookingForm = ref<any>(null);

const bookingInfo = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
});

// Booking summary shown on step 3
const bookingSummary = ref({
  date: '',
  time: '',
  name: '',
  email: '',
  phone: '',
});

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  try {
    healers.value = await AvailabilityService.getAvailableHealers();
    await loadAvailableSlots();
  } catch (e) {
    showMsgBox(t("Error"), `${t("Failed_to_load_data")}: ${e}`);
  } finally {
    loading.value = false;
  }
}

async function onDateChange() {
  await loadAvailableSlots();
}

async function loadAvailableSlots() {
  loadingSlots.value = true;
  try {
    // Generate fixed time slots from 9:00 AM to 10:00 PM for all days
    const slots = generateTimeSlots('09:00', '22:00', 30);
    
    // Get the first available healer (or any healer) to use their ID
    const healerId = healers.value.length > 0 ? healers.value[0].id : null;
    const healerName = healers.value.length > 0 ? `${healers.value[0].firstName} ${healers.value[0].lastName}` : '';
    
    // Filter slots based on current time if selected date is today
    const filteredSlots = filterSlotsByTime(slots);
    
    availableSlots.value = filteredSlots.map(slot => ({
      startTime: slot.start,
      endTime: slot.end,
      healerId: healerId,
      healerName: healerName
    }));
    
    selectedSlot.value = null;
  } catch (e) {
    showMsgBox(t("Error"), `${t("Failed_to_load_slots")}: ${e}`);
  } finally {
    loadingSlots.value = false;
  }
}

function filterSlotsByTime(slots: any[]) {
  const today = new Date();
  const selectedDateObj = new Date(selectedDate.value);
  
  // Check if selected date is today
  const isToday = selectedDateObj.toDateString() === today.toDateString();
  
  if (!isToday) {
    // If not today, return all slots
    return slots;
  }
  
  // If today, filter slots that are at least 1 hour from now
  const oneHourFromNow = new Date(today.getTime() + 60 * 60 * 1000);
  const oneHourFromNowStr = oneHourFromNow.toTimeString().substring(0, 5);
  
  return slots.filter(slot => {
    // Compare slot start time with one hour from now
    return slot.start >= oneHourFromNowStr;
  });
}

function generateTimeSlots(start: string, end: string, durationMinutes: number) {
  const slots = [];
  let current = new Date(`2000-01-01T${start}:00`);
  const endTime = new Date(`2000-01-01T${end}:00`);

  while (current < endTime) {
    const slotStart = current.toTimeString().substring(0, 5);
    const nextTime = new Date(current.getTime() + durationMinutes * 60000);
    if (nextTime > endTime) break;

    const slotEnd = nextTime.toTimeString().substring(0, 5);
    slots.push({ start: slotStart, end: slotEnd });
    current = nextTime;
  }
  return slots;
}

async function confirmBooking() {
  if (!selectedSlot.value) return;

  bookingLoading.value = true;
  try {
    const dateStr = selectedDate.value.toISOString().split('T')[0];
    const start = new Date(`${dateStr}T${selectedSlot.value.startTime}:00`);
    const end = new Date(`${dateStr}T${selectedSlot.value.endTime}:00`);

    const bookingData = {
      healers: [{ id: selectedSlot.value.healerId }],
      start: start,
      end: end,
      title: t('external_booking'),
      attendees: [{
        firstName: bookingInfo.value.firstName,
        lastName: bookingInfo.value.lastName,
        email: bookingInfo.value.email,
        phone: bookingInfo.value.phone,
        isStaff: false,
        isActive: true
      }],
      busy: true,
      category: 'time',
      isLocal: true
    };

    await AvailabilityService.bookSession(bookingData);

    // Populate summary before moving to step 3
    bookingSummary.value = {
      date: format(selectedDate.value, 'EEEE, MMMM d, yyyy'),
      time: `${selectedSlot.value.startTime} – ${selectedSlot.value.endTime}`,
      name: `${bookingInfo.value.firstName} ${bookingInfo.value.lastName}`,
      email: bookingInfo.value.email,
      phone: bookingInfo.value.phone,
    };

    step.value = 3;
  } catch (e: any) {
    const errorMsg = e.response?.data?.error || String(e);
    if (errorMsg === "Already_has_upcoming_booking") {
      showMsgBox(t("Warning"), t('Already_has_upcoming_booking'));
    } else {
      showMsgBox(t("Error"), `${t("Failed_to_book_session")}: ${e}`);
    }
  } finally {
    bookingLoading.value = false;
  }
}

function startNewBooking() {
  step.value = 1;
  selectedSlot.value = null;
  bookingInfo.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };
  bookingSummary.value = { date: '', time: '', name: '', email: '', phone: '' };
  if (bookingForm.value) bookingForm.value.reset();
}
</script>

<style scoped>
.v-stepper-header {
  box-shadow: none !important;
}
@media (max-width: 600px) {
  .v-stepper-item {
    padding: 12px 8px !important;
  }
}
</style>
