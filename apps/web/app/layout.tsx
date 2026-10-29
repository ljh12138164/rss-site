import type { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
import type { ReactNode } from 'react'
import { GoogleScripts } from '../components/google-scripts'
import { MonetagScript } from '../components/monetag-script'
import { QueryProvider } from '../components/query-provider'
import { ReactAriaProvider } from '../components/react-aria-provider'
import { ServiceWorker } from '../components/service-worker'
import { ThemeProvider } from '../components/theme-provider'
import { SITE_AUTHOR_NAME, SITE_AUTHOR_URL, SITE_DESCRIPTION, SITE_NAME } from '../lib/seo'
import { optionalCanonical } from '../lib/site-url'
import './globals.css'

const homepage = optionalCanonical('/')

export const metadata: Metadata = {
  ...(homepage ? { metadataBase: new URL(homepage) } : {}),
  applicationName: SITE_NAME,
  title: {
    default: '今日热点 - AI、科技、新闻、财经与游戏热榜',
    template: '%s · 今日热点'
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_AUTHOR_NAME, url: SITE_AUTHOR_URL }],
  creator: SITE_AUTHOR_NAME,
  publisher: SITE_NAME,
  category: 'news',
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
        <NextTopLoader
          color="var(--primary)"
          height={2}
          showSpinner={false}
          showForHashAnchor={false}
          shadow={false}
          zIndex={50}
        />
        <GoogleScripts />
        <MonetagScript />
        <ServiceWorker />
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
