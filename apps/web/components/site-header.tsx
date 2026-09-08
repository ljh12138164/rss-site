'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../lib/utils'
import { ArticleSearch } from './article-search'
import { ThemeToggle } from './theme-toggle'

const sections = [
  ['/', '全部'],
  ['/ai', 'AI'],
  ['/technology', '科技'],
  ['/news', '新闻'],
  ['/social', '社交'],
  ['/finance', '财经'],
  ['/games', '游戏'],
  ['/ai/events', 'AI 时间轴']
] as const

export function SiteHeader() {
  const pathname = usePathname()
  const timeline = pathname?.startsWith('/ai/events')

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-6 border-b border-border bg-background/95 pt-3 backdrop-blur-sm lg:flex-nowrap lg:py-3">
      <Link
        href="/"
        className="flex min-h-11 shrink-0 items-center gap-2.5 text-xl font-bold tracking-tight text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Image src="/icon.svg" alt="" width={28} height={28} className="shrink-0" unoptimized />
        今日热点
      </Link>
      <nav
        aria-label="主导航"
        className="order-3 flex w-full min-w-0 items-center gap-1 overflow-x-auto lg:order-none lg:w-auto"
      >
        {sections.map(([href, label]) => {
          const active =
            href === '/'
              ? pathname === '/'
              : href === '/ai/events'
                ? timeline
                : !(href === '/ai' && timeline) &&
                  (pathname === href || pathname?.startsWith(`${href}/`))

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-2 text-sm transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary',
                href === '/ai/events' && 'ml-3',
                active
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent text-muted-foreground'
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <ArticleSearch />
        <ThemeToggle />
      </div>
    </header>
  )
}
