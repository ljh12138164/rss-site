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
      <footer className="rule-stack flex min-h-20 flex-wrap items-center justify-end gap-x-6 gap-y-2 py-5 text-xs text-muted-foreground">
        <nav aria-label="站点信息" className="flex flex-wrap items-center gap-5">
          <Link className="flex min-h-11 items-center hover:text-foreground" href="/mcp">
            MCP 服务
          </Link>
          <Link className="flex min-h-11 items-center hover:text-foreground" href="/about">
            关于本站
          </Link>
          <Link className="flex min-h-11 items-center hover:text-foreground" href="/privacy">
            隐私说明
          </Link>
          <a
            className="flex min-h-11 items-center hover:text-foreground"
            href="https://blog.ljhboard.cn/"
            rel="noreferrer"
            target="_blank"
          >
            ljh.notes
          </a>
          <a
            className="flex min-h-11 items-center hover:text-foreground"
            href="https://token.ljhboard.cn/"
            rel="noreferrer"
            target="_blank"
          >
            Token Paper
          </a>
          <a
            className="flex min-h-11 items-center hover:text-foreground"
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
