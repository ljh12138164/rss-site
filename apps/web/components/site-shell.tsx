import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { SiteHeader } from './site-header'

export function SiteShell({
  children,
  mainClassName
}: {
  children: ReactNode
  mainClassName?: string
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 sm:px-7">
      <SiteHeader />
      <main className={cn('flex-1 py-12 sm:py-16', mainClassName)}>{children}</main>
      <div aria-hidden="true" className="border-t border-border" />
      <footer className="flex min-h-20 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-xs text-muted-foreground">
        <p>点击标题在站内阅读，完整内容以来源原文为准。</p>
        <nav aria-label="站点信息" className="flex items-center gap-5">
          <Link className="flex min-h-11 items-center hover:text-foreground" href="/mcp">
            MCP 服务
          </Link>
          <Link className="flex min-h-11 items-center hover:text-foreground" href="/about">
            关于本站
          </Link>
          <Link className="flex min-h-11 items-center hover:text-foreground" href="/privacy">
            隐私说明
          </Link>
        </nav>
      </footer>
    </div>
  )
}
