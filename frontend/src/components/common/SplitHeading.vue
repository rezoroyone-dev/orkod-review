<template>
  <component :is="tag" ref="root" class="sh" :class="{ 'sh-ready': ready }">
    <template v-for="(word, i) in words" :key="i">
      <span class="sh-word"><span class="sh-word-in" :style="{ '--w': i }">{{ word }}</span></span>{{ i < words.length - 1 ? ' ' : '' }}
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// Renders a heading whose words rise out of clipped masks, staggered, the first
// time the title scrolls into view. The word markup + keyframes live in
// styles/_global.scss (the `directions` motion layer); this only drives timing.
const props = withDefaults(defineProps<{ text: string; tag?: string }>(), { tag: 'h2' });

const words = computed(() => (props.text || '').split(/\s+/).filter(Boolean));

const root = ref<HTMLElement | null>(null);
const ready = ref(false);
let observer: IntersectionObserver | null = null;
let safety = 0;

onMounted(() => {
  // Environments without IntersectionObserver (jsdom) reveal immediately so the
  // content is never withheld. The rise is a short one-shot reveal and runs for
  // everyone — including reduced-motion users — because it is the signature
  // motion of the public surfaces.
  if (typeof IntersectionObserver === 'undefined') {
    ready.value = true;
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          ready.value = true;
          observer?.disconnect();
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
  );
  if (root.value) observer.observe(root.value);

  // Safety net: never leave a heading masked if the observer never fires (e.g.
  // the element mounted inside a hidden/duplicated branch).
  safety = window.setTimeout(() => {
    ready.value = true;
    observer?.disconnect();
  }, 2600);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (safety) window.clearTimeout(safety);
});
</script>

<style scoped>
.sh {
  display: block;
}
</style>
