import '@fortawesome/fontawesome-free/css/all.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { aliases, fa } from 'vuetify/iconsets/fa'

import { APP_THEME_COLORS } from '@/styles/theme'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: APP_THEME_COLORS.primary,
          'on-primary': APP_THEME_COLORS.onPrimary,
          accent: APP_THEME_COLORS.primaryContainer,
          'on-accent': APP_THEME_COLORS.onPrimaryContainer,
          secondary: APP_THEME_COLORS.textMuted,
          surface: APP_THEME_COLORS.surface,
          background: APP_THEME_COLORS.background,
          'surface-variant': APP_THEME_COLORS.surfaceVariant,
          'on-surface': APP_THEME_COLORS.text,
          home: APP_THEME_COLORS.home,
          'on-home': APP_THEME_COLORS.onHome,
          away: APP_THEME_COLORS.away,
          'on-away': APP_THEME_COLORS.onAway,
        },
      },
    },
  },
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: { fa },
  },
})
