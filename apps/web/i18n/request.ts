import { getRequestConfig } from 'next-intl/server'
import { DEFAULT_LOCALE, DEFAULT_TIME_ZONE } from '../lib/site-locale'
import zhCN from '../messages/zh-CN.json'

export default getRequestConfig(() => ({
  locale: DEFAULT_LOCALE,
  messages: zhCN,
  timeZone: DEFAULT_TIME_ZONE
}))
