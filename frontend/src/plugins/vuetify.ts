import '@mdi/font/css/materialdesignicons.css'
import { createVuetify, ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import * as labsComponents from 'vuetify/labs/components'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'

const orkodLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary: '#6D28D9',
    secondary: '#D4AF37',
    accent: '#8B5CF6',
    error: '#DC2626',
    info: '#6D28D9',
    success: '#16A34A',
    warning: '#F59E0B',
    background: '#F7F4FC',
    surface: '#FFFFFF',
  }
}

const orkodDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#8B5CF6',
    secondary: '#D4AF37',
    accent: '#C4B5FD',
    error: '#F87171',
    info: '#8B5CF6',
    success: '#22C55E',
    warning: '#F1D27A',
    background: '#020204',
    surface: '#0B0718',
  }
}

export default createVuetify({
  components: {
    ...components,
    ...labsComponents,
  },
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: orkodLightTheme,
      dark: orkodDarkTheme,
    },
  },
  defaults: {
    VBtn: { class: 'orkod-btn' },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
});
