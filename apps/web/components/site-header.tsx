'use client'

import {
  Bookmark,
  Boxes,
  Clock,
  Cpu,
  Flame,
  GitBranch,
  Layers,
  Menu,
  Newspaper,
  X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { useReadingList } from '../lib/reading-list'
import { TRANSIT_LINES } from '../lib/transit-lines'
import { cn } from '../lib/utils'
import { ActionButton } from './action-button'
import { ArticleSearch } from './article-search'
import { RssSubscription } from './rss-subscription'
import { ThemeToggle } from './theme-toggle'
import { TransitMark } from './transit-mark'

const PRIMARY_NAV = [
  { href: '/', label: '全部热点', icon: Flame },
  { href: '/daily', label: '今日日报', icon: Newspaper },
  { href: '/following', label: '我的关注', icon: Layers },
  { href: '/reading-list', label: '稍后读', icon: Bookmark }
] as const

const SPECIALTY_NAV = [
  { href: '/ai/events', label: 'AI 时间轴', icon: Clock },
  { href: '/github', label: '开源排行', icon: GitBranch },
  { href: '/leaderboard', label: '模型评测', icon: Cpu },
  { href: '/skills', label: '热门 Skills', icon: Boxes }
] as const

function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/' || pathname === '/latest'
  if (href === '/ai')
    return pathname === '/ai' || (pathname.startsWith('/ai/') && !pathname.startsWith('/ai/events'))
  return pathname === href || pathname.startsWith(`${href}/`)
}

function RailContent({
  pathname,
  savedCount,
  onNavigate
}: {
  pathname: string
  savedCount: number
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-4 slim-scrollbar">
        <div className="space-y-6">
          <div>
            <p className="px-2.5 pb-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
              视图
            </p>
            <ul className="space-y-0.5">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon
                const active = isRouteActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 text-sm transition-colors',
                        active
                          ? 'bg-accent font-semibold text-foreground'
                          : 'text-muted-foreground hover:bg-card hover:text-foreground'
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary"
                        />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={cn('size-4 shrink-0', active && 'text-primary')}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.href === '/reading-list' && savedCount > 0 && (
                        <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-primary">
                          {savedCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <p className="px-2.5 pb-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
              频道
            </p>
            <ul className="space-y-0.5">
              {TRANSIT_LINES.map((line) => {
                const active = isRouteActive(pathname, line.path)
                return (
                  <li key={line.id}>
                    <Link
                      href={line.path}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 text-sm transition-colors',
                        active
                          ? 'bg-accent font-semibold text-foreground'
                          : 'text-muted-foreground hover:bg-card hover:text-foreground'
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full"
                          style={{ backgroundColor: line.cssVar }}
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'size-2.5 shrink-0 rounded-full transition-transform',
                          active
                            ? 'scale-110 ring-2 ring-offset-2 ring-offset-rail'
                            : 'ring-1 ring-inset'
                        )}
                        style={{
                          backgroundColor: active ? line.cssVar : 'transparent',
                          borderColor: line.cssVar,
                          borderWidth: active ? '0px' : '2px',
                          boxShadow: active ? `0 0 0 1px ${line.cssVar}` : undefined
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate">{line.name}</span>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {line.sourceCount}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <p className="px-2.5 pb-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
              专题
            </p>
            <ul className="space-y-0.5">
              {SPECIALTY_NAV.map((item) => {
                const Icon = item.icon
                const active = isRouteActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 text-sm transition-colors',
                        active
                          ? 'bg-accent font-semibold text-foreground'
                          : 'text-muted-foreground hover:bg-card hover:text-foreground'
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary"
                        />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={cn('size-4 shrink-0', active && 'text-primary')}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-3">
        <nav
          aria-label="站点信息"
          className="flex items-center justify-between text-xs text-muted-foreground"
        >
          <Link
            href="/mcp"
            onClick={onNavigate}
            className="min-h-8 inline-flex items-center hover:text-primary"
          >
            MCP
          </Link>
          <Link
            href="/about"
            onClick={onNavigate}
            className="min-h-8 inline-flex items-center hover:text-primary"
          >
            关于
          </Link>
          <Link
            href="/privacy"
            onClick={onNavigate}
            className="min-h-8 inline-flex items-center hover:text-primary"
          >
            隐私
          </Link>
        </nav>
      </footer>
    </div>
  )
}

export function TransitSidebar() {
  const pathname = usePathname()
  const { savedCount } = useReadingList()

  return (
    <aside className="sticky top-0 hidden h-dvh w-[216px] shrink-0 flex-col border-r border-border bg-rail lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link
          href="/"
          aria-label="今日热点首页"
          className="flex min-w-0 items-center gap-2.5 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <TransitMark className="size-6" />
          <span className="truncate text-base font-bold tracking-tight">今日热点</span>
        </Link>
      </div>
      <RailContent pathname={pathname} savedCount={savedCount} />
    </aside>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { savedCount } = useReadingList()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setDrawerOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-border bg-background/92 backdrop-blur-md">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-3 px-4 sm:px-7">
          {/* Mobile menu trigger + compact brand */}
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <ActionButton
              variant="ghost"
              size="icon"
              aria-label="打开频道目录"
              className="size-9 rounded-sm border border-border bg-card text-foreground"
              onPress={() => setDrawerOpen(true)}
            >
              <Menu className="size-4" aria-hidden="true" />
            </ActionButton>
            <Link
              href="/"
              aria-label="今日热点首页"
              className="flex min-w-0 items-center gap-2 text-foreground"
            >
              <TransitMark className="size-6" />
              <span className="truncate text-base font-bold tracking-tight">今日热点</span>
            </Link>
          </div>

          {/* Desktop command search trigger */}
          <div className="hidden flex-1 items-center lg:flex">
            <ArticleSearch variant="topbar" />
          </div>

          {/* Right controls (zero avatar/login chrome) */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="lg:hidden">
              <ArticleSearch variant="icon" />
            </span>
            <Link
              href="/reading-list"
              aria-label={`稍后读${savedCount > 0 ? `（${savedCount} 篇）` : ''}`}
              className="hidden h-9 items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary sm:inline-flex"
            >
              <Bookmark className="size-3.5 text-primary" aria-hidden="true" />
              <span>稍后读</span>
              {savedCount > 0 && (
                <span className="rounded-sm bg-primary/15 px-1 font-mono text-[11px] font-semibold tabular-nums text-primary">
                  {savedCount}
                </span>
              )}
            </Link>
            <RssSubscription triggerVariant="topbar" defaultMode="custom" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile slide-over rail drawer */}
      <ModalOverlay
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        isDismissable
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
      >
        <Modal className="h-dvh w-72 max-w-[85vw] border-r border-strong bg-rail text-foreground shadow-2xl">
          <Dialog className="flex h-full flex-col outline-none">
            {({ close }) => (
              <>
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                  <Heading slot="title" className="flex items-center gap-2 text-base font-bold">
                    <TransitMark className="size-6" />
                    <span>今日热点</span>
                  </Heading>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    aria-label="关闭目录"
                    onPress={close}
                    className="size-9"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </ActionButton>
                </div>
                <RailContent pathname={pathname} savedCount={savedCount} onNavigate={close} />
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>

      {/* Mobile bottom 4-tab transit bar */}
      <nav
        aria-label="移动端导航"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-rail/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4">
          <Link
            href="/"
            aria-current={isRouteActive(pathname, '/') ? 'page' : undefined}
            className={cn(
              'relative flex h-14 flex-col items-center justify-center gap-1 text-[11px]',
              isRouteActive(pathname, '/')
                ? 'font-semibold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isRouteActive(pathname, '/') && (
              <span aria-hidden="true" className="absolute inset-x-4 top-0 h-[3px] bg-primary" />
            )}
            <Flame className="size-4" aria-hidden="true" />
            <span>热点</span>
          </Link>
          <Link
            href="/daily"
            aria-current={isRouteActive(pathname, '/daily') ? 'page' : undefined}
            className={cn(
              'relative flex h-14 flex-col items-center justify-center gap-1 text-[11px]',
              isRouteActive(pathname, '/daily')
                ? 'font-semibold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isRouteActive(pathname, '/daily') && (
              <span aria-hidden="true" className="absolute inset-x-4 top-0 h-[3px] bg-primary" />
            )}
            <Newspaper className="size-4" aria-hidden="true" />
            <span>日报</span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            className={cn(
              'relative flex h-14 cursor-pointer flex-col items-center justify-center gap-1 text-[11px]',
              TRANSIT_LINES.some((l) => isRouteActive(pathname, l.path))
                ? 'font-semibold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {TRANSIT_LINES.some((l) => isRouteActive(pathname, l.path)) && (
              <span aria-hidden="true" className="absolute inset-x-4 top-0 h-[3px] bg-primary" />
            )}
            <Menu className="size-4" aria-hidden="true" />
            <span>频道</span>
          </button>
          <Link
            href="/following"
            aria-current={isRouteActive(pathname, '/following') ? 'page' : undefined}
            className={cn(
              'relative flex h-14 flex-col items-center justify-center gap-1 text-[11px]',
              isRouteActive(pathname, '/following')
                ? 'font-semibold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isRouteActive(pathname, '/following') && (
              <span aria-hidden="true" className="absolute inset-x-4 top-0 h-[3px] bg-primary" />
            )}
            <Layers className="size-4" aria-hidden="true" />
            <span>关注</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
