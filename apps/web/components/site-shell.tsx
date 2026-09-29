import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { OutboundDialog } from './outbound-dialog'
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
      <OutboundDialog />
      <SiteHeader />
      <main className={cn('flex-1 py-10 sm:py-14', mainClassName)}>{children}</main>
      <footer className="mt-auto flex min-h-20 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border py-6 text-xs text-muted-foreground">
        <p className="font-mono text-[0.6875rem] uppercase tracking-wider">Editorial RSS Digest</p>
        <nav aria-label="站点信息" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            className="flex min-h-11 items-center transition-colors hover:text-foreground"
            href="/reading-list"
          >
            稍后读与足迹
          </Link>
          <Link
            className="flex min-h-11 items-center transition-colors hover:text-foreground"
            href="/mcp"
          >
            MCP 服务
          </Link>
          <Link
            className="flex min-h-11 items-center transition-colors hover:text-foreground"
            href="/about"
          >
            关于本站
          </Link>
          <Link
            className="flex min-h-11 items-center transition-colors hover:text-foreground"
            href="/privacy"
          >
            隐私说明
          </Link>
          <a
            className="flex min-h-11 items-center transition-colors hover:text-foreground"
            href="https://blog.ljhboard.cn/"
            rel="noreferrer"
            target="_blank"
          >
            ljh.notes
          </a>
          <a
            className="flex min-h-11 items-center transition-colors hover:text-foreground"
            href="https://token.ljhboard.cn/"
            rel="noreferrer"
            target="_blank"
          >
            Token Paper
          </a>
          <a
            className="flex min-h-11 items-center transition-colors hover:text-foreground"
            href="https://tools.ljhboard.cn/"
            rel="noreferrer"
            target="_blank"
          >
            LJH Tools
          </a>
        </nav>
      </footer>
    </div>
  )
}
