import { create } from 'zustand'
import { languageOptions } from '../data/i18n'

const STORAGE_KEY = 'pf_locale'
const supportedLocales = new Set(languageOptions.map((entry) => entry.code))

function getInitialLocale() {
  if (typeof window === 'undefined') return 'en'

  try {
    const storedLocale = window.localStorage.getItem(STORAGE_KEY)
    if (storedLocale && supportedLocales.has(storedLocale)) {
      return storedLocale
    }
  } catch {}

  return 'en'
}

export const useLanguageStore = create((set) => ({
  locale: getInitialLocale(),
  actions: {
    setLocale(locale) {
      if (!supportedLocales.has(locale)) return

      try {
        window.localStorage.setItem(STORAGE_KEY, locale)
      } catch {}

      set({ locale })
    },
  },
}))
