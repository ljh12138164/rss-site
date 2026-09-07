import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { ArticleSearch } from './article-search'
import { ThemeToggle } from './theme-toggle'

export function SiteShell({
  children,
  mainClassName
}: {
  children: ReactNode
  mainClassName?: string
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 sm:px-7">
      <header className="sticky top-0 z-20 flex min-h-[4.25rem] flex-wrap items-center justify-between border-b border-border bg-background/95 py-2 backdrop-blur-sm sm:h-[4.25rem] sm:flex-nowrap sm:py-0">
        <Link
          className="font-mono text-sm font-semibold tracking-[-0.02em] transition-colors hover:text-primary"
          href="/"
        >
          AI 热榜
        </Link>
        <div className="order-3 mt-2 flex w-full items-center border-t border-border sm:order-none sm:mt-0 sm:w-auto sm:border-t-0">
          <nav
            aria-label="主导航"
            className="flex w-full items-center justify-between overflow-x-auto whitespace-nowrap sm:w-auto"
          >
            <Link
              className="flex min-h-11 shrink-0 items-center px-1.5 text-xs text-muted-foreground hover:text-foreground sm:px-2 sm:text-sm"
              href="/ai/events"
            >
              AI 时间轴
            </Link>
            <Link
              className="flex min-h-11 items-center px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:px-2 sm:text-sm"
              href="/ai"
            >
              AI
            </Link>
            <Link
              className="flex min-h-11 items-center px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:px-2 sm:text-sm"
              href="/technology"
            >
              科技
            </Link>
            <Link
              className="flex min-h-11 items-center px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:px-2 sm:text-sm"
              href="/news"
            >
              新闻
            </Link>
            <Link
              className="flex min-h-11 items-center px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:px-2 sm:text-sm"
              href="/social"
            >
              社交
            </Link>
            <Link
              className="flex min-h-11 items-center px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:px-2 sm:text-sm"
              href="/finance"
            >
              财经
            </Link>
            <Link
              className="flex min-h-11 items-center px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:px-2 sm:text-sm"
              href="/games"
            >
              游戏
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <ArticleSearch />
          <ThemeToggle />
        </div>
      </header>
      <main className={cn('flex-1 py-12 sm:py-16', mainClassName)}>{children}</main>
      <div aria-hidden="true" className="border-t border-border" />
      <footer className="flex min-h-20 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-xs text-muted-foreground">
        <p>内容来自公开网页，点击标题查看原文。</p>
        <nav aria-label="站点信息" className="flex items-center gap-5">
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
