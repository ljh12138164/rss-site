import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { SiteShell } from '../components/site-shell'
import { createNewsArticlePath } from '../lib/article-route'
import {
  type AiFeeds,
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
    { id: 'ai', title: 'AI', sources: aiSources, feeds: aiFeeds },
    { id: 'technology', title: '科技', sources: technologySources, feeds: technologyFeeds },
    { id: 'news', title: '国内新闻', sources: newsSources, feeds: newsFeeds },
    { id: 'social', title: '社交热点', sources: socialSources, feeds: socialFeeds },
    { id: 'finance', title: '财经', sources: financeSources, feeds: financeFeeds },
    { id: 'games', title: '游戏', sources: gameSources, feeds: gameFeeds }
  ] as const

  return (
    <SiteShell mainClassName="mx-auto w-full max-w-4xl py-6 sm:py-8">
      <header className="mb-4">
        <h1 className="text-balance text-2xl font-semibold sm:text-3xl">今日热点</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          从 AI 动态到每日热点，直接读你关心的内容。
        </p>
        <nav
          aria-label="首页分区"
          className="mt-3 flex gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`#${section.id}`}
              className="flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              {section.title}
            </Link>
          ))}
        </nav>
      </header>
      <div className="space-y-10">
        {sections.map((section) => (
          <HomeSection
            key={section.id}
            id={section.id}
            title={section.title}
            sources={section.sources}
            feeds={section.feeds}
          />
        ))}
      </div>
    </SiteShell>
  )
}

function HomeSection({
  id,
  title,
  sources,
  feeds
}: {
  id: string
  title: string
  sources: readonly SignalSource[]
  feeds: Partial<Record<SignalSource['id'], FeedResult>>
}) {
  const entries = sources.flatMap((source) => {
    const feed = feeds[source.id]
    return feed?.state === 'ready' ? feed.items.map((item) => ({ item, source })) : []
  })
  const hasError = sources.some((source) => feeds[source.id]?.state === 'error')
  const basePath = `/${id}` as OutboundReturnPath

  return (
    <section aria-labelledby={`${id}-heading`} id={id} className="scroll-mt-36 sm:scroll-mt-24">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <h2 id={`${id}-heading`} className="text-balance text-lg font-semibold">
          {title}
        </h2>
        <Link
          href={basePath}
          className="flex min-h-11 shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          查看全部
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
      <ul>
        {entries.map(({ item, source }) => {
          const href =
            id === 'news' && item.articleId
              ? createNewsArticlePath(source.id, item.title, item.articleId)
              : `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(basePath)}`
          const summary = item.summary?.trim()
          return (
            <li
              key={`${source.id}:${item.sourceKey}`}
              className="rounded-lg border-b border-border px-3 py-5 hover:bg-muted/60 focus-within:bg-muted/60 sm:px-4"
            >
              <article>
                <Link
                  href={href}
                  className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <h3 className="text-pretty text-lg font-semibold leading-7 text-foreground group-hover:text-primary sm:text-xl sm:leading-8">
                    {item.title}
                  </h3>
                  {summary && (
                    <p className="mt-2 line-clamp-2 text-pretty text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                      {summary.length > 240 ? `${summary.slice(0, 240)}…` : summary}
                    </p>
                  )}
                </Link>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                  {item.publishedAt && (
                    <time
                      className="font-mono tabular-nums"
                      dateTime={item.publishedAt.toISOString()}
                    >
                      {dateFormatter.format(item.publishedAt)}
                    </time>
                  )}
                  <Link
                    href={`${basePath}/${source.id}`}
                    className="inline-flex min-h-11 items-center rounded-full bg-muted px-3 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary sm:min-h-8"
                    aria-label={`浏览${source.name}`}
                  >
                    {source.shortName}
                  </Link>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
      {hasError ? (
        <p role="alert" className="py-5 text-pretty text-sm text-muted-foreground">
          {entries.length
            ? '部分来源暂时无法加载，可进入分区稍后查看。'
            : '暂时无法加载，请稍后再试。'}
        </p>
      ) : (
        !entries.length && <p className="py-5 text-sm text-muted-foreground">暂无内容。</p>
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
