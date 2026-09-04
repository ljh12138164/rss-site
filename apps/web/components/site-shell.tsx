import Link from 'next/link'
import type { ReactNode } from 'react'
import { ThemeToggle } from './theme-toggle'

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 sm:px-7">
      <header className="sticky top-0 z-20 flex h-[4.25rem] items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm">
        <Link
          className="font-mono text-sm font-semibold tracking-[-0.02em] transition-colors hover:text-primary"
          href="/"
        >
          热点更新<span className="text-primary">.</span>
        </Link>
        <div className="flex items-center gap-1">
          <nav aria-label="主导航" className="flex items-center">
            <Link
              className="flex min-h-11 items-center px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              href="/"
            >
              首页
            </Link>
            <Link
              className="flex min-h-11 items-center px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              href="/technology"
            >
              科技
            </Link>
            <Link
              className="flex min-h-11 items-center px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              href="/news"
            >
              新闻
            </Link>
          </nav>
          <ThemeToggle />
        </div>
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
          整理
        </p>
        <p className="font-mono">RSS · 5H</p>
      </footer>
    </div>
  )
}
