import { ArrowRight, ArrowUpRight, Cpu, GitBranch, Newspaper } from 'lucide-react'
import Link from 'next/link'
import type { DailyReport } from '../../../shared/daily-report'
import { createArticlePath } from '../lib/article-route'
import type { HomeDigest } from '../lib/home-articles'
import type { ModelLeaderboardItem } from '../lib/leaderboard'
import { getTransitLine } from '../lib/transit-lines'
import { HomeHotRanking } from './home-hot-ranking'

const compactTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Shanghai'
})

export { HomeDigestView as HomeDigest }
export function HomeDigestView({
  digest,
  dailyReport,
  topModels
}: {
  digest: HomeDigest
  dailyReport?: DailyReport | null
  topModels?: ModelLeaderboardItem[]
}) {
  return (
    <div className="space-y-8">
      {/* Compact station heading + mobile-ready 6-line pills */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="headline-display text-2xl text-foreground sm:text-3xl">全部热点</h1>
          <Link
            href="/daily"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-primary hover:underline xl:hidden"
          >
            今日日报
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <nav
          aria-label="频道快速切换"
          className="-mx-4 overflow-x-auto overflow-y-hidden px-4 slim-scrollbar sm:mx-0 sm:px-0"
        >
          <ul className="flex min-w-max items-center gap-2 sm:flex-wrap">
            {digest.sections.map((section) => {
              const line = getTransitLine(section.path)
              return (
                <li key={section.path}>
                  <Link
                    href={section.path}
                    className="inline-flex min-h-9 items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-strong hover:bg-accent"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: line?.cssVar ?? 'var(--primary)' }}
                    />
                    <span>{line?.name ?? section.name}</span>
                    {line && (
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {line.sourceCount}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <HomeHotRanking ranking={digest.ranking} />

          {/* Six Transit Channel Boards */}
          <section aria-labelledby="section-directory">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2
                id="section-directory"
                className="headline-display text-lg text-foreground sm:text-xl"
              >
                各频道最新
              </h2>
              <Link
                href="/following"
                className="text-xs font-medium text-muted-foreground hover:text-primary"
              >
                定制我的关注 →
              </Link>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              {digest.sections.map((section) => {
                const line = getTransitLine(section.path)
                return (
                  <section
                    key={section.path}
                    aria-labelledby={`digest-${section.path}`}
                    className="flex min-w-0 flex-col rounded-sm border border-border bg-card p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/70 pb-2.5">
                      <h3
                        id={`digest-${section.path}`}
                        className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: line?.cssVar ?? 'var(--primary)' }}
                        />
                        <span className="truncate">{section.name}</span>
                      </h3>
                      <Link
                        href={section.path}
                        className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                      >
                        进入
                        <ArrowRight className="size-3" aria-hidden="true" />
                      </Link>
                    </div>

                    {section.items.length ? (
                      <ol className="divide-y divide-border/60">
                        {section.items.map((item) => {
                          const isGithub = item.platform.id === 'github'
                          const href = isGithub
                            ? item.url
                            : createArticlePath(item.platform.id, item.title, item.articleId)
                          const timeLabel = item.publishedAt
                            ? compactTimeFormatter.format(new Date(item.publishedAt))
                            : null

                          return (
                            <li key={item.articleId} className="py-2.5 first:pt-0 last:pb-0">
                              {isGithub ? (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer noopener external"
                                  data-outbound
                                  className="group block focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                  <span className="line-clamp-2 text-sm font-medium leading-6 text-foreground group-hover:text-primary">
                                    {item.title}
                                    <ArrowUpRight
                                      className="ml-1 inline size-3 text-muted-foreground"
                                      aria-hidden="true"
                                    />
                                  </span>
                                  <span className="mt-1 flex items-center gap-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                                    <span>{item.platform.shortName}</span>
                                    {timeLabel && <span>· {timeLabel}</span>}
                                  </span>
                                </a>
                              ) : (
                                <Link
                                  href={href}
                                  className="group block focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                  <span className="line-clamp-2 text-sm font-medium leading-6 text-foreground group-hover:text-primary">
                                    {item.title}
                                  </span>
                                  <span className="mt-1 flex items-center gap-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                                    <span>{item.platform.shortName}</span>
                                    {timeLabel && <span>· {timeLabel}</span>}
                                  </span>
                                </Link>
                              )}
                            </li>
                          )
                        })}
                      </ol>
                    ) : (
                      <p className="py-4 text-xs text-muted-foreground">暂无更新</p>
                    )}
                  </section>
                )
              })}
            </div>
          </section>
        </div>

        {/* Slim Secondary Column: Daily Report & Leaderboard */}
        <aside className="min-w-0 space-y-5">
          <section
            className="rounded-sm border border-border bg-card p-4"
            aria-labelledby="aside-daily"
          >
            <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2.5">
              <h2
                id="aside-daily"
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <Newspaper className="size-4 text-primary" aria-hidden="true" />
                今日日报
              </h2>
              {dailyReport ? (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {dailyReport.reportDate}
                </span>
              ) : null}
            </div>
            {dailyReport ? (
              <>
                <p className="line-clamp-3 text-xs leading-6 text-muted-foreground">
                  {dailyReport.content.overview.text}
                </p>
                <ol className="mt-3 divide-y divide-border/60 border-t border-border/70">
                  {dailyReport.content.stories.slice(0, 4).map((story, idx) => (
                    <li key={story.id} className="py-2">
                      <Link
                        href={`/daily#${story.id}`}
                        className="flex items-baseline gap-2 text-xs leading-5 text-foreground hover:text-primary"
                      >
                        <span className="font-mono font-semibold tabular-nums text-primary">
                          0{idx + 1}
                        </span>
                        <span className="line-clamp-2 min-w-0">{story.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-xs leading-6 text-muted-foreground">
                查看今日要闻摘要与往期归档。
              </p>
            )}
            <Link
              href="/daily"
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-border bg-background py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              进入日报
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </section>

          <section
            className="rounded-sm border border-border bg-card p-4"
            aria-labelledby="aside-models"
          >
            <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2.5">
              <h2
                id="aside-models"
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <Cpu className="size-4 text-primary" aria-hidden="true" />
                模型评测
              </h2>
              <Link
                href="/leaderboard"
                className="font-mono text-xs text-muted-foreground hover:text-primary"
              >
                全榜 →
              </Link>
            </div>
            {topModels && topModels.length > 0 ? (
              <ol className="divide-y divide-border/60">
                {topModels.slice(0, 5).map((model) => (
                  <li key={model.slug} className="py-2 first:pt-0 last:pb-0">
                    <Link
                      href={model.url}
                      className="flex items-center justify-between gap-2 text-xs hover:text-primary"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="font-mono font-semibold tabular-nums text-primary">
                          {String(model.rank).padStart(2, '0')}
                        </span>
                        <span className="truncate font-medium text-foreground">{model.name}</span>
                      </span>
                      <span className="shrink-0 font-mono font-semibold tabular-nums text-muted-foreground">
                        {model.overallScore}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs leading-6 text-muted-foreground">主流大模型基准实测排名。</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
              <Link
                href="/github"
                className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-border bg-background py-2 text-xs font-medium text-foreground hover:border-primary/60 hover:text-primary"
              >
                <GitBranch className="size-3.5" aria-hidden="true" />
                开源排行
              </Link>
              <Link
                href="/skills"
                className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-border bg-background py-2 text-xs font-medium text-foreground hover:border-primary/60 hover:text-primary"
              >
                热门 Skills
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
