import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import pl from './locales/pl.json'
import ru from './locales/ru.json'

export const SUPPORTED_LOCALES = ['en', 'pl', 'ru']
const STORAGE_KEY = 'nastolka-locale'

function detectLocale() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (SUPPORTED_LOCALES.includes(stored)) return stored

  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of candidates) {
    const base = lang?.split('-')[0]
    if (SUPPORTED_LOCALES.includes(base)) return base
  }
  return 'en'
}

// Russian and Polish both use the Slavic one/few/many cardinal plural
// categories (rather than English's singular/plural), so vue-i18n's generic
// default plural rule — which only handles 2-form and simple 3-form counts —
// doesn't pick the right message index for numbers like 21 or 25.
function slavicPluralRule(choice) {
  const n = Math.abs(choice)
  if (n === 1) return 0
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 1
  return 2
}

const SHORT_DATE = { year: 'numeric', month: 'short', day: 'numeric' }
const SHORT_DATE_TIME = { ...SHORT_DATE, hour: '2-digit', minute: '2-digit' }

const datetimeFormats = {
  en: { short: SHORT_DATE, shortDateTime: SHORT_DATE_TIME },
  pl: { short: SHORT_DATE, shortDateTime: SHORT_DATE_TIME },
  ru: { short: SHORT_DATE, shortDateTime: SHORT_DATE_TIME },
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { en, pl, ru },
  datetimeFormats,
  pluralRules: {
    ru: slavicPluralRule,
    pl: slavicPluralRule,
  },
})

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}

// For plain .js files (composables, stores) that aren't Vue components and
// therefore can't call useI18n().
export const t = i18n.global.t
