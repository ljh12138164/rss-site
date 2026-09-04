import Link from 'next/link'
import type { ReactNode } from 'react'
import { ThemeToggle } from './theme-toggle'
import { Separator } from './ui/separator'

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[45rem] flex-col px-5 sm:px-7">
      <header className="flex h-20 items-center justify-between">
        <Link
          className="font-mono text-sm font-semibold tracking-[-0.02em] transition-colors hover:text-primary"
          href="/"
        >
          热点更新<span className="text-primary">.</span>
        </Link>
        <div className="flex items-center gap-1">
          <nav aria-label="主导航">
            <Link
              className="px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              href="/#technology"
            >
              科技
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <Separator />
      <main className="flex-1 py-12 sm:py-16">{children}</main>
      <Separator />
      <footer className="flex min-h-20 items-center justify-between gap-4 py-5 text-xs text-muted-foreground">
        <p>为阅读留一块安静的地方。</p>
        <p className="font-mono">RSS · 5H</p>
      </footer>
    </div>
  )
}
