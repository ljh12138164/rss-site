import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { GoogleScripts } from '../components/google-scripts'
import { QueryProvider } from '../components/query-provider'
import { ReactAriaProvider } from '../components/react-aria-provider'
import { ThemeProvider } from '../components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: { default: '今日热点', template: '%s · 今日热点' },
  description: 'AI 平台动态，以及科技、新闻、社交、财经和游戏热点。',
  icons: { icon: '/icon.svg' },
  verification: {
    other: {
      'msvalidate.01': '1D97E9469470F8C3242E298438BF37AD',
      'baidu-site-verification': 'codeva-DbvPspLmOE'
    }
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <GoogleScripts />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <QueryProvider>
            <ReactAriaProvider>{children}</ReactAriaProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
