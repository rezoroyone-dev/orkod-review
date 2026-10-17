<template>
  <div ref="glow" class="pointer-glow" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

// Signature interaction: a soft light that trails the pointer with a little
// inertia. Purely additive — the native cursor is never hidden. Disabled on
// touch/coarse pointers and for reduced-motion users, where it would be noise.
const glow = ref<HTMLElement | null>(null);

let raf = 0;
let targetX = 0;
let targetY = 0;
let x = 0;
let y = 0;
let active = false;

function frame() {
  // Critically-damped-ish lerp toward the pointer for a weighted follow.
  x += (targetX - x) * 0.12;
  y += (targetY - y) * 0.12;
  if (glow.value) {
    glow.value.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;
  }
  raf = window.requestAnimationFrame(frame);
}

function onMove(e: PointerEvent) {
  targetX = e.clientX;
  targetY = e.clientY;
  if (!active) {
    x = targetX;
    y = targetY;
    active = true;
    glow.value?.classList.add('is-on');
  }
}

function onLeave() {
  active = false;
  glow.value?.classList.remove('is-on');
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduced || coarse) return;

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  raf = window.requestAnimationFrame(frame);
});

onBeforeUnmount(() => {
  window.cancelAnimationFrame(raf);
  window.removeEventListener('pointermove', onMove);
  document.removeEventListener('pointerleave', onLeave);
});
</script>
