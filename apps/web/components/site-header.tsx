'use client'

import {
  Bookmark,
  Boxes,
  Clock,
  Cpu,
  Flame,
  Gamepad2,
  GitBranch,
  Laptop,
  Layers,
  Menu,
  MessagesSquare,
  Newspaper,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { useReadingList } from '../lib/reading-list'
import { TRANSIT_LINES } from '../lib/transit-lines'
import { cn } from '../lib/utils'
import { ActionButton } from './action-button'
import { ArticleSearch } from './article-search'
import { HoverPrefetchLink } from './hover-prefetch-link'
import { LanguageMenu } from './language-menu'
import { RssSubscription } from './rss-subscription'
import { ThemeToggle } from './theme-toggle'
import { TransitMark } from './transit-mark'

const PRIMARY_NAV = [
  { href: '/', labelKey: 'allStories', icon: Flame },
  { href: '/daily', labelKey: 'dailyBriefing', icon: Newspaper },
  { href: '/following', labelKey: 'following', icon: Layers },
  { href: '/reading-list', labelKey: 'readLater', icon: Bookmark }
] as const

const SPECIALTY_NAV = [
  { href: '/ai/events', labelKey: 'aiTimeline', icon: Clock },
  { href: '/github', labelKey: 'openSource', icon: GitBranch },
  { href: '/leaderboard', labelKey: 'modelBenchmarks', icon: Cpu },
  { href: '/skills', labelKey: 'trendingSkills', icon: Boxes }
] as const

const CHANNEL_ICONS = {
  ai: Sparkles,
  technology: Laptop,
  news: Newspaper,
  social: MessagesSquare,
  finance: TrendingUp,
  games: Gamepad2
} as const

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
  const tNav = useTranslations('nav')
  const tSections = useTranslations('sections')
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-4 slim-scrollbar">
        <div className="space-y-6">
          <div>
            <p className="px-2.5 pb-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
              {tNav('viewGroup')}
            </p>
            <ul className="space-y-0.5">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon
                const active = isRouteActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <HoverPrefetchLink
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
                      <span className="min-w-0 flex-1 truncate">{tNav(item.labelKey)}</span>
                      {item.href === '/reading-list' && savedCount > 0 && (
                        <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-primary">
                          {savedCount}
                        </span>
                      )}
                    </HoverPrefetchLink>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <p className="px-2.5 pb-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
              {tNav('channelsGroup')}
            </p>
            <ul className="space-y-0.5">
              {TRANSIT_LINES.map((line) => {
                const Icon = CHANNEL_ICONS[line.id]
                const active = isRouteActive(pathname, line.path)
                return (
                  <li key={line.id}>
                    <HoverPrefetchLink
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
                      <Icon
                        aria-hidden="true"
                        className="size-4 shrink-0"
                        style={{ color: line.cssVar }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {tSections(`${line.id}.shortTitle`)}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {line.sourceCount}
                      </span>
                    </HoverPrefetchLink>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <p className="px-2.5 pb-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
              {tNav('exploreGroup')}
            </p>
            <ul className="space-y-0.5">
              {SPECIALTY_NAV.map((item) => {
                const Icon = item.icon
                const active = isRouteActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <HoverPrefetchLink
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
                      <span className="min-w-0 flex-1 truncate">{tNav(item.labelKey)}</span>
                    </HoverPrefetchLink>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-3">
        <nav
          aria-label={tNav('siteInfo')}
          className="flex items-center justify-between text-xs text-muted-foreground"
        >
          <HoverPrefetchLink
            href="/mcp"
            onClick={onNavigate}
            className="min-h-8 inline-flex items-center hover:text-primary"
          >
            MCP
          </HoverPrefetchLink>
          <HoverPrefetchLink
            href="/about"
            onClick={onNavigate}
            className="min-h-8 inline-flex items-center hover:text-primary"
          >
            {tNav('about')}
          </HoverPrefetchLink>
          <HoverPrefetchLink
            href="/privacy"
            onClick={onNavigate}
            className="min-h-8 inline-flex items-center hover:text-primary"
          >
            {tNav('privacy')}
          </HoverPrefetchLink>
          <a
            href="/feeds/daily.xml"
            className="min-h-8 inline-flex items-center font-mono hover:text-primary"
          >
            {tNav('rssFeed')}
          </a>
        </nav>
        <nav
          aria-label={tNav('ecosystemLinks')}
          className="mt-1.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground"
        >
          <a
            href="https://blog.ljhboard.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-7 inline-flex items-center truncate hover:text-primary"
          >
            {tNav('blog')}
          </a>
          <a
            href="https://software.ljhboard.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-7 inline-flex items-center truncate hover:text-primary"
          >
            {tNav('openPick')}
          </a>
          <a
            href="https://token.ljhboard.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-7 inline-flex items-center truncate hover:text-primary"
          >
            {tNav('tokenPaper')}
          </a>
        </nav>
      </footer>
    </div>
  )
}

export function TransitSidebar() {
  const tCommon = useTranslations('common')
  const pathname = usePathname()
  const { savedCount } = useReadingList()

  return (
    <aside className="sticky top-0 hidden h-dvh w-[216px] shrink-0 flex-col border-r border-border bg-rail lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <HoverPrefetchLink
          href="/"
          aria-label={tCommon('siteHome')}
          className="flex min-w-0 items-center gap-2.5 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <TransitMark className="size-6" />
          <span className="truncate text-base font-bold tracking-tight">{tCommon('siteName')}</span>
        </HoverPrefetchLink>
      </div>
      <RailContent pathname={pathname} savedCount={savedCount} />
    </aside>
  )
}

export function SiteHeader() {
  const tCommon = useTranslations('common')
  const tNav = useTranslations('nav')
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
              aria-label={tNav('openChannelMenu')}
              className="size-9 rounded-sm border border-border bg-card text-foreground"
              onPress={() => setDrawerOpen(true)}
            >
              <Menu className="size-4" aria-hidden="true" />
            </ActionButton>
            <HoverPrefetchLink
              href="/"
              aria-label={tCommon('siteHome')}
              className="flex min-w-0 items-center gap-2 text-foreground"
            >
              <TransitMark className="size-6" />
              <span className="truncate text-base font-bold tracking-tight">
                {tCommon('siteName')}
              </span>
            </HoverPrefetchLink>
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
            <HoverPrefetchLink
              href="/reading-list"
              aria-label={
                savedCount ? tNav('readLaterCount', { count: savedCount }) : tNav('readLater')
              }
              className="hidden h-9 items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary sm:inline-flex"
            >
              <Bookmark className="size-3.5 text-primary" aria-hidden="true" />
              <span>{tNav('readLater')}</span>
              {savedCount > 0 && (
                <span className="rounded-sm bg-primary/15 px-1 font-mono text-[11px] font-semibold tabular-nums text-primary">
                  {savedCount}
                </span>
              )}
            </HoverPrefetchLink>
            <RssSubscription triggerVariant="topbar" defaultMode="custom" />
            <LanguageMenu />
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
                    <span>{tCommon('siteName')}</span>
                  </Heading>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    aria-label={tNav('closeMenu')}
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
        aria-label={tNav('mobileNav')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-rail/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4">
          <HoverPrefetchLink
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
            <span>{tNav('mobileStories')}</span>
          </HoverPrefetchLink>
          <HoverPrefetchLink
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
            <span>{tNav('mobileBriefing')}</span>
          </HoverPrefetchLink>
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
            <span>{tNav('mobileChannels')}</span>
          </button>
          <HoverPrefetchLink
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
            <span>{tNav('mobileFollow')}</span>
          </HoverPrefetchLink>
        </div>
      </nav>
    </>
  )
}
