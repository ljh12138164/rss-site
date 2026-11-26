'use client'

import {
  type DateTimeFormatOptions,
  NextIntlClientProvider,
  useFormatter,
  useLocale,
  useTranslations
} from 'next-intl'
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore
} from 'react'
import {
  DEFAULT_LOCALE,
  DEFAULT_TIME_ZONE,
  isSiteLocale,
  preferredSiteLocale,
  type SiteLocale
} from '../lib/site-locale'
import enMessages from '../messages/en.json'
import zhCNMessages from '../messages/zh-CN.json'

type LanguagePreference = SiteLocale | 'auto'

const MESSAGES = {
  'zh-CN': zhCNMessages,
  en: enMessages
} as const

type LeafKey<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? LeafKey<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
    : Prefix extends ''
      ? K
      : `${Prefix}.${K}`
}[keyof T & string]

export type SiteMessageKey = LeafKey<typeof zhCNMessages>

const preferenceKey = 'rss-site-language'
const preferenceEvent = 'rss-site-language-change'

const LanguagePreferenceContext = createContext<{
  locale: SiteLocale
  preference: LanguagePreference
  setPreference: (preference: LanguagePreference) => void
}>({ locale: DEFAULT_LOCALE, preference: 'auto', setPreference: () => {} })

function subscribeToBrowserLanguage(listener: () => void) {
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
    subscribeToBrowserLanguage,
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
    <LanguagePreferenceContext.Provider value={{ locale, preference, setPreference }}>
      <NextIntlClientProvider
        locale={locale}
        messages={MESSAGES[locale]}
        timeZone={DEFAULT_TIME_ZONE}
      >
        {children}
      </NextIntlClientProvider>
    </LanguagePreferenceContext.Provider>
  )
}

export function useSiteLocale(): SiteLocale {
  const locale = useLocale()
  return isSiteLocale(locale) ? locale : DEFAULT_LOCALE
}

export function useLanguagePreference() {
  return useContext(LanguagePreferenceContext)
}

export function TranslatedText({
  id,
  values
}: {
  id: SiteMessageKey
  values?: Record<string, string | number>
}) {
  const t = useTranslations()
  return t(id, values)
}

export function TranslatedRegion({
  as: Tag,
  labelId,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as: 'nav' | 'section' | 'div' | 'aside' | 'ol' | 'ul'
  labelId: SiteMessageKey
}) {
  const t = useTranslations()
  return <Tag aria-label={t(labelId)} {...props} />
}

export function FormattedDate({
  date,
  options
}: {
  date: string | number | Date
  options: DateTimeFormatOptions
}) {
  const format = useFormatter()
  const timestamp =
    typeof date === 'number' ? date : typeof date === 'string' ? Date.parse(date) : date.getTime()
  if (!Number.isFinite(timestamp)) return null
  return format.dateTime(new Date(timestamp), options)
}
