// lib/locales.ts
export const SUPPORTED_LOCALES = [
  { code: 'pt', label: 'Português (Brasil)', flag: '🇧🇷', shortLabel: 'PT' },
  { code: 'en', label: 'English (US)', flag: '🇺🇸', shortLabel: 'EN' },
  { code: 'es', label: 'Español', flag: '🇪🇸', shortLabel: 'ES' },
] as const

const LOCALE_FORMAT_MAP = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
} as const

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code']

export function getLocale(code: string) {
  return SUPPORTED_LOCALES.find((l) => l.code === code)
}

export function getOtherLocales(code: string) {
  return SUPPORTED_LOCALES.filter((l) => l.code !== code)
}

export function getIntlLocaleCode(code: string) {
  return LOCALE_FORMAT_MAP[code as keyof typeof LOCALE_FORMAT_MAP] ?? 'en-US'
}
