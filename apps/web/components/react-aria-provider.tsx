'use client'

import type { ReactNode } from 'react'
import { I18nProvider } from 'react-aria-components'

export function ReactAriaProvider({ children }: { children: ReactNode }) {
  return <I18nProvider locale="zh-CN">{children}</I18nProvider>
}
