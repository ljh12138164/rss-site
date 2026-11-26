'use client'

import type { ReactNode } from 'react'
import { I18nProvider } from 'react-aria-components'
import { SiteLanguageProvider, useSiteLocale } from './site-language'

export function ReactAriaProvider({ children }: { children: ReactNode }) {
  return (
    <SiteLanguageProvider>
      <AriaLocale>{children}</AriaLocale>
    </SiteLanguageProvider>
  )
}

function AriaLocale({ children }: { children: ReactNode }) {
  const locale = useSiteLocale()
  return <I18nProvider locale={locale}>{children}</I18nProvider>
}
