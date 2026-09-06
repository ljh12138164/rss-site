import {
  ArrowRight,
  Cpu,
  Gamepad2,
  Laptop,
  type LucideIcon,
  MessagesSquare,
  Newspaper,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { SiteShell } from '../components/site-shell'
import { SourceIcon } from '../components/source-icon'
import { createNewsArticlePath } from '../lib/article-route'
import {
  type AiFeeds,
  compareHotItemsByPublishedAt,
  type FeedResult,
  type FinanceFeeds,
  type GameFeeds,
  getAiFeeds,
  getFinanceFeeds,
  getGameFeeds,
  getNewsFeeds,
  getSocialFeeds,
  getTechnologyFeeds,
  type NewsFeeds,
  type SocialFeeds,
  type TechnologyFeeds
} from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  type SignalSource,
  socialSources,
  technologySources
} from '../lib/technology-sources'

export const dynamic = 'force-dynamic'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Shanghai'
})

export function HomeView({
  aiFeeds,
  technologyFeeds,
  newsFeeds,
  socialFeeds,
  financeFeeds,
  gameFeeds
}: {
  aiFeeds: AiFeeds
  technologyFeeds: TechnologyFeeds
  newsFeeds: NewsFeeds
  socialFeeds: SocialFeeds
  financeFeeds: FinanceFeeds
  gameFeeds: GameFeeds
}) {
  const sections = [
    { id: 'ai', title: 'AI', icon: Cpu, sources: aiSources, feeds: aiFeeds },
    {
      id: 'technology',
      title: '科技',
      icon: Laptop,
      sources: technologySources,
      feeds: technologyFeeds
    },
    { id: 'news', title: '国内新闻', icon: Newspaper, sources: newsSources, feeds: newsFeeds },
    {
      id: 'social',
      title: '社交热点',
      icon: MessagesSquare,
      sources: socialSources,
      feeds: socialFeeds
    },
    {
      id: 'finance',
      title: '财经',
      icon: TrendingUp,
      sources: financeSources,
      feeds: financeFeeds
    },
    { id: 'games', title: '游戏', icon: Gamepad2, sources: gameSources, feeds: gameFeeds }
  ] as const

  return (
    <SiteShell mainClassName="mx-auto w-full py-6 sm:py-8">
      <header className="mb-6 border-l-4 border-primary pl-4 sm:mb-8">
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">今日热点</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          从 AI 动态到每日热点，直接读你关心的内容。
        </p>
      </header>
      <div className="grid items-start gap-5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-8">
        <nav
          aria-label="首页分区"
          className="flex gap-1 overflow-x-auto whitespace-nowrap rounded-xl border border-border bg-card p-1.5 lg:sticky lg:top-24 lg:flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`#${section.id}`}
              className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <section.icon aria-hidden="true" className="size-4 text-primary" />
              {section.title}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 space-y-7">
          {sections.map((section) => (
            <HomeSection
              key={section.id}
              id={section.id}
              title={section.title}
              icon={section.icon}
              sources={section.sources}
              feeds={section.feeds}
            />
          ))}
        </div>
      </div>
    </SiteShell>
  )
}

function HomeSection({
  id,
  title,
  icon: Icon,
  sources,
  feeds
}: {
  id: string
  title: string
  icon: LucideIcon
  sources: readonly SignalSource[]
  feeds: Partial<Record<SignalSource['id'], FeedResult>>
}) {
  const entries = sources.flatMap((source) => {
    const feed = feeds[source.id]
    return feed?.state === 'ready' ? feed.items.map((item) => ({ item, source })) : []
  })
  entries.sort((left, right) => compareHotItemsByPublishedAt(left.item, right.item))
  const hasError = sources.some((source) => feeds[source.id]?.state === 'error')
  const basePath = `/${id}` as OutboundReturnPath

  return (
    <section
      aria-labelledby={`${id}-heading`}
      id={id}
      className="scroll-mt-36 rounded-xl border border-border bg-card sm:scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-4 rounded-t-xl border-b border-border bg-muted/50 px-4 py-3 sm:px-6">
        <h2
          id={`${id}-heading`}
          className="flex items-center gap-3 text-balance text-lg font-semibold"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          {title}
        </h2>
        <Link
          href={basePath}
          className="flex min-h-11 shrink-0 items-center gap-1 text-sm text-primary hover:underline"
        >
          查看全部
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
      <ul className="divide-y divide-border px-4 sm:px-6">
        {entries.map(({ item, source }) => {
          const href =
            id === 'news' && item.articleId
              ? createNewsArticlePath(source.id, item.title, item.articleId)
              : `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(basePath)}`
          const summary = item.summary?.trim()
          return (
            <li key={`${source.id}:${item.sourceKey}`} className="py-4 sm:py-5">
              <article>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 text-xs text-muted-foreground">
                  <Link
                    href={`${basePath}/${source.id}`}
                    className="inline-flex min-h-11 items-center gap-2 font-medium hover:text-primary focus-visible:outline-2 focus-visible:outline-primary sm:min-h-8"
                    aria-label={`浏览${source.name}`}
                  >
                    <SourceIcon className="size-5" source={source} />
                    {source.shortName}
                  </Link>
                  {item.publishedAt && (
                    <time
                      className="font-mono text-[11px] tabular-nums"
                      dateTime={item.publishedAt.toISOString()}
                    >
                      {dateFormatter.format(item.publishedAt)}
                    </time>
                  )}
                </div>
                <Link
                  href={href}
                  className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <h3 className="text-pretty text-lg font-semibold leading-7 text-foreground group-hover:text-primary sm:text-xl sm:leading-8">
                    {item.title}
                  </h3>
                  {summary && (
                    <p className="mt-2 line-clamp-2 text-pretty text-sm leading-6 text-muted-foreground">
                      {summary.length > 240 ? `${summary.slice(0, 240)}…` : summary}
                    </p>
                  )}
                </Link>
              </article>
            </li>
          )
        })}
      </ul>
      {hasError ? (
        <p role="alert" className="px-4 py-5 text-pretty text-sm text-muted-foreground sm:px-6">
          {entries.length
            ? '部分来源暂时无法加载，可进入分区稍后查看。'
            : '暂时无法加载，请稍后再试。'}
        </p>
      ) : (
        !entries.length && (
          <p className="px-4 py-5 text-sm text-muted-foreground sm:px-6">暂无内容。</p>
        )
      )}
    </section>
  )
}

export default async function HomePage() {
  const [aiFeeds, technologyFeeds, newsFeeds, socialFeeds, financeFeeds, gameFeeds] =
    await Promise.all([
      getAiFeeds(1),
      getTechnologyFeeds(1),
      getNewsFeeds(1),
      getSocialFeeds(1),
      getFinanceFeeds(1),
      getGameFeeds(1)
    ])
  return (
    <HomeView
      aiFeeds={aiFeeds}
      technologyFeeds={technologyFeeds}
      newsFeeds={newsFeeds}
      socialFeeds={socialFeeds}
      financeFeeds={financeFeeds}
      gameFeeds={gameFeeds}
    />
  )
}
