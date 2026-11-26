export type SiteLocale = 'zh-CN' | 'en'

export const DEFAULT_LOCALE: SiteLocale = 'zh-CN'

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
