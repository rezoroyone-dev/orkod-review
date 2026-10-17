import { computed } from 'vue';
import { usePreferredReducedMotion } from '@vueuse/core';

/**
 * `true` when the visitor has asked their OS for reduced motion.
 *
 * Views use it to skip decorative, disorienting motion (large travel, scroll
 * parallax) for those visitors while keeping the product's signature look for
 * everyone else — the same intent as the CSS policy in `_global.scss`, which
 * only drops the directions layer (`scroll-*`, `pointer-glow`).
 */
export function useReducedMotion() {
  const preference = usePreferredReducedMotion();
  return computed(() => preference.value === 'reduce');
}
