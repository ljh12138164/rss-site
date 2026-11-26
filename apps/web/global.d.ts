import type { SiteLocale } from './lib/site-locale'
import type zhCN from './messages/zh-CN.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: SiteLocale
    Messages: typeof zhCN
  }
}
