import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ReactAriaProvider } from '../components/react-aria-provider'
import { ThemeProvider } from '../components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'AI 热榜', template: '%s · AI 热榜' },
  description: 'AI 平台动态，以及科技、新闻、社交、财经和游戏热点。'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <ReactAriaProvider>{children}</ReactAriaProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
