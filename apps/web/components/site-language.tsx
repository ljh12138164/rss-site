'use client'

import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore
} from 'react'
import {
  DEFAULT_LOCALE,
  isSiteLocale,
  preferredSiteLocale,
  type SiteLocale
} from '../lib/site-locale'
import { englishMessages } from '../lib/site-messages'

type LanguagePreference = SiteLocale | 'auto'

const preferenceKey = 'rss-site-language'
const preferenceEvent = 'rss-site-language-change'
const LanguageContext = createContext<{
  locale: SiteLocale
  preference: LanguagePreference
  setPreference: (preference: LanguagePreference) => void
}>({ locale: DEFAULT_LOCALE, preference: 'auto', setPreference: () => {} })
const dateFormatters = new Map<string, Intl.DateTimeFormat>()

function subscribe(listener: () => void) {
  window.addEventListener('languagechange', listener)
  return () => window.removeEventListener('languagechange', listener)
}

function subscribeToStorage(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener(preferenceEvent, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(preferenceEvent, listener)
  }
}

function readPreference(): LanguagePreference {
  try {
    const stored = window.localStorage.getItem(preferenceKey)
    return isSiteLocale(stored) ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

export function SiteLanguageProvider({ children }: { children: ReactNode }) {
  const browserLocale = useSyncExternalStore(
    subscribe,
    () =>
      preferredSiteLocale(navigator.languages?.length ? navigator.languages : [navigator.language]),
    () => DEFAULT_LOCALE
  )
  const savedPreference = useSyncExternalStore<LanguagePreference>(
    subscribeToStorage,
    readPreference,
    () => 'auto'
  )
  const [sessionPreference, setSessionPreference] = useState<LanguagePreference | null>(null)
  const preference = sessionPreference ?? savedPreference
  const locale = preference === 'auto' ? browserLocale : preference

  function setPreference(next: LanguagePreference) {
    try {
      if (next === 'auto') window.localStorage.removeItem(preferenceKey)
      else window.localStorage.setItem(preferenceKey, next)
      window.dispatchEvent(new Event(preferenceEvent))
      setSessionPreference(null)
    } catch {
      setSessionPreference(next)
    }
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return (
    <LanguageContext.Provider value={{ locale, preference, setPreference }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useSiteLocale() {
  return useContext(LanguageContext).locale
}

export function useLanguagePreference() {
  return useContext(LanguageContext)
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
