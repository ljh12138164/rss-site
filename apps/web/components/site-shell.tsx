import Link from 'next/link'
import type { ReactNode } from 'react'
import { ThemeToggle } from './theme-toggle'

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 sm:px-7">
      <header className="sticky top-0 z-20 flex min-h-[4.25rem] flex-wrap items-center justify-between border-b border-border bg-background/95 py-2 backdrop-blur-sm sm:h-[4.25rem] sm:flex-nowrap sm:py-0">
        <Link
          className="font-mono text-sm font-semibold tracking-[-0.02em] transition-colors hover:text-primary"
          href="/"
        >
          热点更新<span className="text-primary">.</span>
        </Link>
        <div className="order-3 mt-2 flex w-full items-center border-t border-border sm:order-none sm:mt-0 sm:w-auto sm:border-t-0">
          <nav aria-label="主导航" className="flex w-full items-center justify-between sm:w-auto">
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
        <ThemeToggle />
      </header>
      <main className="flex-1 py-12 sm:py-16">{children}</main>
      <div aria-hidden="true" className="border-t border-border" />
      <footer className="flex min-h-20 items-center justify-between gap-4 py-5 text-xs text-muted-foreground">
        <p>
          数据经{' '}
          <a
            className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            href="https://docs.rsshub.app/zh/routes"
            rel="noreferrer noopener"
            target="_blank"
          >
            RSSHub
          </a>{' '}
          与官方 RSS 整理
        </p>
        <p className="font-mono">AI · 2H / AUX · 6H</p>
      </footer>
    </div>
  )
}
