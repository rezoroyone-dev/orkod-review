import { computed, onMounted, ref } from 'vue';
import AvailabilityService from '@/services/AvailabilityService';

export interface PublicHealer {
  id: number;
  firstName?: string;
  lastName?: string;
  city?: string;
  level?: number;
}

/**
 * The live public endpoint currently returns healer contact fields that should
 * not be exposed on a public page. We strip every sensitive field before the
 * data leaves this composable.
 */
function sanitizeHealer(raw: any): PublicHealer {
  return {
    id: Number(raw?.id),
    firstName: raw?.firstName,
    lastName: raw?.lastName,
    city: raw?.city,
    level: raw?.level,
  };
}

/**
 * Loads the real, publicly-available healers once and shares them across the
 * home page. Never fabricates data: if the backend is unreachable the exposed
 * arrays stay empty and consumers render honest empty states.
 */
export function usePublicHealers() {
  const healers = ref<PublicHealer[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let started = false;

  const availableHealers = computed(() => healers.value);

  async function loadHealers() {
    if (started) return;
    started = true;
    loading.value = true;
    error.value = null;
    try {
      const data = await AvailabilityService.getAvailableHealers();
      healers.value = Array.isArray(data) ? data.map(sanitizeHealer) : [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load healers';
      console.warn('[usePublicHealers]', error.value);
      healers.value = [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    loadHealers();
  });

  return { healers: availableHealers, loading, error, loadHealers };
}