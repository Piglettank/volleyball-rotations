import '@fortawesome/fontawesome-free/css/all.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { aliases, fa } from 'vuetify/iconsets/fa'

import { COURT_COLORS } from '@/components/court/courtGeometry'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1a2a3a',
          secondary: COURT_COLORS.outside,
          accent: COURT_COLORS.court,
          surface: '#ffffff',
          background: '#f4f6f8',
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
