'use client'

import { Bookmark } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useReadingList } from '../lib/reading-list'
import { cn } from '../lib/utils'
import { ArticleSearch } from './article-search'
import { ThemeToggle } from './theme-toggle'

const sections = [
  ['/', '全部'],
  ['/following', '我的关注'],
  ['/ai', 'AI'],
  ['/technology', '科技'],
  ['/news', '新闻'],
  ['/social', '社交'],
  ['/finance', '财经'],
  ['/games', '游戏'],
  ['/ai/events', 'AI 时间轴'],
  ['/github', '开源排行'],
  ['/skills', '热门 Skills'],
  ['/mcp', 'MCP']
] as const

export function SiteHeader() {
  const pathname = usePathname()
  const { savedCount } = useReadingList()
  const timeline = pathname?.startsWith('/ai/events')
  const githubRanking = pathname?.startsWith('/github')
  const skillRanking = pathname?.startsWith('/skills')

  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-background/90 backdrop-blur-md transition-colors">
      <div className="flex items-center justify-between gap-x-6 py-2.5">
        <Link
          href="/"
          className="headline-display group flex min-h-11 shrink-0 items-center gap-2.5 text-[1.375rem] leading-none text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={26}
            height={26}
            className="shrink-0 transition-transform duration-200 group-hover:scale-105"
            unoptimized
          />
          今日热点
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/reading-list"
            className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={savedCount > 0 ? `稍后读与足迹 (${savedCount})` : '稍后读与足迹'}
            title="稍后读与足迹"
          >
            <Bookmark className="size-4" aria-hidden="true" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground leading-none">
                {savedCount > 99 ? '99+' : savedCount}
              </span>
            )}
          </Link>
          <ArticleSearch />
          <ThemeToggle />
        </div>
      </div>
      <nav aria-label="主导航" className="-mx-5 overflow-x-auto px-5 sm:-mx-7 sm:px-7">
        <div className="flex min-w-max items-center border-t border-border lg:min-w-0">
          {sections.map(([href, label], index) => {
            const active =
              href === '/'
                ? pathname === '/'
                : href === '/ai/events'
                  ? timeline
                  : href === '/github'
                    ? githubRanking
                    : href === '/skills'
                      ? skillRanking
                      : !(href === '/ai' && timeline) &&
                        (pathname === href || pathname?.startsWith(`${href}/`))

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 shrink-0 items-center whitespace-nowrap px-2.5 text-[0.8125rem] tracking-wide transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary',
                  index === 0 && 'pl-0',
                  active
                    ? 'font-semibold text-primary underline decoration-2 underline-offset-[0.55rem]'
                    : 'text-muted-foreground'
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
