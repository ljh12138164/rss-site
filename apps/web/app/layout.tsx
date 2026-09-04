import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ThemeProvider } from '../components/theme-provider'
import { TooltipProvider } from '../components/ui/tooltip'
import './globals.css'

export const metadata: Metadata = {
  title: { default: '热点更新', template: '%s · 热点更新' },
  description: '定时整理开发者社区正在讨论的热点内容。'
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
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
