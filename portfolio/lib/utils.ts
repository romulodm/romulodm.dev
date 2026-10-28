import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getIntlLocaleCode } from './locales'

const JUST_NOW: Record<string, string> = {
  pt: 'agora mesmo',
  en: 'just now',
  es: 'ahora mismo',
}

export function formatDistanceToNow(date: Date, locale: string = 'en'): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const localeCode = getIntlLocaleCode(locale)
  const formatter = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' })

  if (diffMins < 1) return JUST_NOW[locale] ?? JUST_NOW.en
  if (diffMins < 60) return formatter.format(-diffMins, 'minute')
  if (diffHours < 24) return formatter.format(-diffHours, 'hour')
  if (diffDays < 30) return formatter.format(-diffDays, 'day')

  return new Date(date).toLocaleDateString(localeCode)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
