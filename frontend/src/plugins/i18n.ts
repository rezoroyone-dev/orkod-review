import { createI18n } from 'vue-i18n'

// Dynamically load locales
const messages = Object.fromEntries(
  Object.entries(
    import.meta.glob<{ default: any }>('../locales/*.json', { eager: true })
  ).map(([key, value]) => {
    const locale = key.match(/([A-Za-z0-9-_]+)\.json$/i)?.[1] ?? 'en'
    return [locale, value.default]
  })
)

export default createI18n({
  legacy: false, // use composition api
  // Vite only exposes VITE_-prefixed vars on import.meta.env. The old
  // VUE_APP_-prefixed reads never resolved, so the configured default locale
  // was silently ignored. Read the VITE_-prefixed names the .env files declare.
  locale: import.meta.env.VITE_I18N_LOCALE || 'en',
  fallbackLocale: import.meta.env.VITE_I18N_FALLBACK_LOCALE || 'en',
  messages,
  silentTranslationWarn: import.meta.env.PROD,
})