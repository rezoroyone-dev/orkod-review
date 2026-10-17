import type { App, DirectiveBinding } from 'vue';

declare global {
  interface HTMLElement {
    __revealObserver?: IntersectionObserver;
  }
}

const VARIANT_CLASSES = ['fade', 'up', 'down', 'left', 'right', 'zoom'];

// Displays the element immediately and cancels the reveal lifecycle.
function revealNow(el: HTMLElement) {
  el.classList.add('reveal-in');
  el.classList.remove('reveal-init');
}

function readReducedMotion(): boolean {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    if (binding.value?.disabled) return;

    for (const mod of Object.keys(binding.modifiers)) {
      if (VARIANT_CLASSES.includes(mod)) el.classList.add('rv-' + mod);
    }

    // Apply explicit transition delay when provided via the binding value.
    if (binding.value?.delay != null) {
      el.style.setProperty('--reveal-delay', `${binding.value.delay}ms`);
    }

    // No IntersectionObserver (jsdom, legacy browsers) or reduced-motion users
    // get content immediately — never hide it from them.
    if (readReducedMotion() || typeof IntersectionObserver === 'undefined') {
      revealNow(el);
      return;
    }

    el.classList.add('reveal-init');
    el.classList.remove('reveal-in');

    const thresholds = Array.isArray(binding.value?.threshold)
      ? binding.value.threshold
      : [binding.value?.threshold ?? 0.12];
    const margin = binding.value?.rootMargin ?? '0px 0px -8% 0px';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            const target = entry.target as HTMLElement;
            target.classList.add('reveal-in');
            target.classList.remove('reveal-init');
          }
        }
      },
      { threshold: thresholds, rootMargin: margin }
    );
    observer.observe(el);

    // Keep a reference for cleanup on unmount.
    el.__revealObserver = observer;
  },

  unmounted(el: HTMLElement) {
    if (el.__revealObserver) {
      el.__revealObserver.disconnect();
      el.__revealObserver = undefined;
    }
  },
};

export default {
  install(app: App) {
    app.directive('reveal', directive);
  },
};