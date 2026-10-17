/**
 * @deprecated Use `useUserStore` directly instead.
 * This store is kept for backward compatibility only.
 * It delegates all state and actions to `useUserStore`.
 */
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useUserStore } from './user';

export const useSuperUserStore = defineStore('superUser', () => {
  const userStore = useUserStore();

  // Delegate to userStore
  const superUser = computed(() => userStore.superUser);

  const getSuperUser = computed(() => userStore.superUser);

  const setSuperUser = (newValue: Parameters<typeof userStore.setUser>[0]) => {
    userStore.setUser(newValue);
  };

  const clearSuperUser = () => {
    userStore.clearUser();
  };

  return {
    superUser,
    getSuperUser,
    setSuperUser,
    clearSuperUser,
  };
});
