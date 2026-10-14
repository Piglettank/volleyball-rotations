import { ref, watch } from 'vue'

import { en, type MessageKey } from './en'
import { sv } from './sv'

export type { MessageKey }

export type Locale = 'en' | 'sv'

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, sv }
const STORAGE_KEY = 'volleyball-rotations-locale'

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'sv'
}

function initialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) {
      return stored
    }
  } catch {
    // Storage unavailable — fall back to browser language.
  }
  return navigator.language.toLowerCase().startsWith('sv') ? 'sv' : 'en'
}

export const locale = ref<Locale>(initialLocale())

watch(
  locale,
  (value) => {
    document.documentElement.lang = value
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Ignore — the choice just won't persist.
    }
  },
  { immediate: true },
)

export function toggleLocale() {
  locale.value = locale.value === 'en' ? 'sv' : 'en'
}

/** Translate a UI string, replacing `{param}` placeholders. Reactive when called during render. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const message = MESSAGES[locale.value][key]
  if (!params) {
    return message
  }
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}
