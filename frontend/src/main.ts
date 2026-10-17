import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./plugins/i18n";
import pinia from "./plugins/pinia";
import vuetify from "./plugins/vuetify";
import head from "./plugins/head";
import reveal from "./plugins/reveal";
import router from "./router";
import { createManager } from '@vue-youtube/core';

// Import global styles (design tokens, themes, global rules, flag sprites).
// Must come after Vuetify's own stylesheet so our custom properties win.
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import "./styles/index.scss";

// Orkod ships a single immersive dark identity (black / deep-purple / gold).
// The attribute drives the CSS custom-property theme in styles/_themes.scss.
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", "dark");
}

// Centralized global error handling

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error(
    "[GLOBAL ERROR] Unhandled Promise Rejection:",
    event.reason
  );
  // Log to external service in production (e.g., Sentry)
  if (import.meta.env.PROD) {
    // TODO: Add external logging service integration
  }
  // Prevent default to avoid console spam in production
  event.preventDefault();
});

// Handle uncaught errors
window.addEventListener("error", (event) => {
  console.error("[GLOBAL ERROR] Uncaught Error:", event.error);
  // Log to external service in production
  if (import.meta.env.PROD) {
    // TODO: Add external logging service integration
  }
});

const app = createApp(App);

// Configure Vue error handler for component errors
app.config.errorHandler = (err, instance, info) => {
  console.error("[VUE ERROR]", err, "Component:", instance, "Info:", info);
  // Log to external service in production
  if (import.meta.env.PROD) {
    // TODO: Add external logging service integration
  }
};

// Global warning handler
app.config.warnHandler = (msg, instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn("[VUE WARNING]", msg, "Trace:", trace);
  }
};

app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(i18n);
app.use(head);
app.use(reveal);
app.use(createManager());

app.mount("#app");
