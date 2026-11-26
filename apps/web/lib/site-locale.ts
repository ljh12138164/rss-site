export const SITE_LOCALES = ['zh-CN', 'en'] as const

export type SiteLocale = (typeof SITE_LOCALES)[number]

export const DEFAULT_LOCALE: SiteLocale = 'zh-CN'
export const DEFAULT_TIME_ZONE = 'Asia/Shanghai'

export function preferredSiteLocale(languages: readonly string[]): SiteLocale {
  for (const language of languages) {
    const primary = language.split('-')[0]?.toLowerCase()
    if (primary === 'en') return 'en'
    if (primary === 'zh') return 'zh-CN'
  }
  return DEFAULT_LOCALE
}

export function isSiteLocale(value: unknown): value is SiteLocale {
  return value === 'zh-CN' || value === 'en'
}
