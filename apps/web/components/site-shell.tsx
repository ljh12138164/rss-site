import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { OutboundDialog } from './outbound-dialog'
import { SiteHeader, TransitSidebar } from './site-header'

export function SiteShell({
  children,
  mainClassName
}: {
  children: ReactNode
  mainClassName?: string
}) {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground lg:flex">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        href="#main-content"
      >
        跳到正文
      </a>
      <TransitSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main
          className={cn(
            'mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6 pb-20 sm:px-7 sm:py-8 lg:pb-12',
            mainClassName
          )}
          id="main-content"
        >
          {children}
        </main>
        <OutboundDialog />
      </div>
    </div>
  )
}
