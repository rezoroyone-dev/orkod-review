import { computed, onMounted, ref } from 'vue';
import DoctorService, { type Doctor } from '@/services/DoctorService';

export type { Doctor };

/**
 * Loads the doctors directory once. Honest by design: when the backend has no
 * directory yet, `doctors` stays empty and consumers render empty states.
 */
export function useDoctors() {
  const doctors = ref<Doctor[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let started = false;

  const availableDoctors = computed(() => doctors.value);

  async function loadDoctors() {
    if (started) return;
    started = true;
    loading.value = true;
    error.value = null;
    try {
      doctors.value = await DoctorService.getDoctors();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load doctors';
      console.warn('[useDoctors]', error.value);
      doctors.value = [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    loadDoctors();
  });

  return { doctors: availableDoctors, loading, error, loadDoctors };
}