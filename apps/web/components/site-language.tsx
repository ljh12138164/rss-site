'use client'

import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore
} from 'react'
import { DEFAULT_LOCALE, preferredSiteLocale, type SiteLocale } from '../lib/site-locale'
import { englishMessages } from '../lib/site-messages'

const LocaleContext = createContext<SiteLocale>(DEFAULT_LOCALE)
const dateFormatters = new Map<string, Intl.DateTimeFormat>()

function subscribe(listener: () => void) {
  window.addEventListener('languagechange', listener)
  return () => window.removeEventListener('languagechange', listener)
}

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    () =>
      preferredSiteLocale(navigator.languages?.length ? navigator.languages : [navigator.language]),
    () => DEFAULT_LOCALE
  )
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useSiteLocale() {
  return useContext(LocaleContext)
}

export function useSiteText() {
  const locale = useSiteLocale()
  return useCallback(
    (message: string, values?: Record<string, string | number>) => {
      const text = locale === 'en' ? (englishMessages.get(message) ?? message) : message
      return values
        ? text.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match))
        : text
    },
    [locale]
  )
}

export function UiText({
  children,
  values
}: {
  children: string
  values?: Record<string, string | number>
}) {
  return useSiteText()(children, values)
}

export function UiRegion({
  as: Tag,
  'aria-label': label,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as: 'nav' | 'section' | 'div' | 'aside' | 'ol' | 'ul'
  'aria-label': string
}) {
  const t = useSiteText()
  return <Tag aria-label={t(label)} {...props} />
}

export function UiDate({
  date,
  options
}: {
  date: string | number | Date
  options: Intl.DateTimeFormatOptions
}) {
  const locale = useSiteLocale()
  const timestamp =
    typeof date === 'number' ? date : typeof date === 'string' ? Date.parse(date) : date.getTime()
  if (!Number.isFinite(timestamp)) return null
  const key = JSON.stringify([locale, options])
  let formatter = dateFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options)
    dateFormatters.set(key, formatter)
  }
  return formatter.format(timestamp)
}
