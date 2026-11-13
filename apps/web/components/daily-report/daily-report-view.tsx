import Link from 'next/link'
import type { DailyReport, DailyStory } from '../../../../shared/daily-report'
import type { DailyArchive, DailyArchiveEntry } from '../../lib/daily-reports'
import { getTransitLine } from '../../lib/transit-lines'
import { cn } from '../../lib/utils'

const sectionNames = {
  ai: 'AI',
  technology: '科技',
  news: '新闻',
  social: '社交',
  finance: '财经',
  games: '游戏'
}
const linkClass =
  'min-h-10 inline-flex items-center text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring'

function IssueLink({ issue, label }: { issue?: DailyArchiveEntry; label: string }) {
  return issue ? (
    <Link href={`/daily/${issue.report_date}`} className={linkClass}>
      {label}
    </Link>
  ) : (
    <span className="inline-flex min-h-10 items-center text-muted-foreground/45">{label}</span>
  )
}

function Archive({ archive, date }: { archive: DailyArchive; date: string }) {
  return (
    <nav aria-label="日报往期" className="min-w-0">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <h2 className="text-xs font-semibold text-foreground">往期</h2>
        <Link href="/daily" className="font-mono text-xs text-primary hover:underline">
          最新
        </Link>
      </div>
      <div className="flex items-center justify-between gap-2 py-2.5 text-xs">
        <IssueLink issue={archive.previousMonth} label="← 上月" />
        <span className="font-mono tabular-nums text-foreground">{date.slice(0, 7)}</span>
        <IssueLink issue={archive.nextMonth} label="下月 →" />
      </div>
      <ol className="divide-y divide-border/70 border-y border-border">
        {archive.entries.map((issue) => (
          <li key={issue.report_date}>
            <Link
              href={`/daily/${issue.report_date}`}
              aria-current={issue.report_date === date ? 'page' : undefined}
              title={issue.title}
              className={cn(
                'group flex min-h-14 min-w-0 items-start gap-2.5 px-2 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                issue.report_date === date
                  ? 'bg-accent font-medium text-primary'
                  : 'hover:bg-row-highlight'
              )}
            >
              <span className="shrink-0 font-mono text-base font-bold tabular-nums leading-5">
                {issue.report_date.slice(8)}
              </span>
              <span className="line-clamp-2 min-w-0 text-xs leading-5 text-foreground">
                {issue.title}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="pt-3 font-mono text-[11px] tabular-nums text-muted-foreground">
        本月 {archive.entries.length} 期
      </p>
    </nav>
  )
}

function Calendar({ archive, date }: { archive: DailyArchive; date: string }) {
  const first = new Date(`${date.slice(0, 7)}-01T00:00:00Z`)
  const offset = (first.getUTCDay() + 6) % 7
  const days = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getDate()
  const published = new Set(archive.entries.map((issue) => issue.report_date))
  return (
    <details className="relative mt-1 text-xs">
      <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-sm border border-border bg-background px-2.5 font-mono text-muted-foreground hover:border-primary/60 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
        日期切换 ▾
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-[320px] max-w-[calc(100vw-2.5rem)] rounded-sm border border-strong bg-popover p-3 text-popover-foreground shadow-xl">
        <p className="mb-2.5 font-mono text-xs text-muted-foreground">{date.slice(0, 7)}</p>
        <div className="grid grid-cols-7 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
            <span key={day} className="py-1.5 text-muted-foreground">
              {day}
            </span>
          ))}
          {['一', '二', '三', '四', '五', '六'].slice(0, offset).map((day) => (
            <span key={`space-${day}`} />
          ))}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1
            const value = `${date.slice(0, 7)}-${String(day).padStart(2, '0')}`
            return published.has(value) ? (
              <Link
                key={value}
                href={`/daily/${value}`}
                aria-label={`阅读 ${value} 日报`}
                aria-current={value === date ? 'date' : undefined}
                className={cn(
                  'flex min-h-10 items-center justify-center rounded-sm font-mono tabular-nums hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
                  value === date && 'bg-primary font-bold text-primary-foreground'
                )}
              >
                {day}
              </Link>
            ) : (
              <span
                key={value}
                className="flex min-h-10 items-center justify-center font-mono tabular-nums text-muted-foreground/40"
              >
                {day}
              </span>
            )
          })}
        </div>
      </div>
    </details>
  )
}

function Highlights({ stories }: { stories: DailyStory[] }) {
  return (
    <nav aria-label="目录">
      <h2 className="mb-3 font-mono text-xs font-semibold text-primary">目录</h2>
      <ol className="divide-y divide-border/70">
        {stories.slice(0, 5).map((story, index) => (
          <li key={story.id}>
            <a
              href={`#${story.id}`}
              className="flex min-h-10 gap-2.5 py-2.5 text-xs leading-5 text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="font-mono font-bold tabular-nums text-primary">0{index + 1}</span>
              <span className="min-w-0 line-clamp-2">{story.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function DailyReportView({
  report,
  archive,
  articleLinks
}: {
  report: DailyReport
  archive: DailyArchive
  articleLinks: Record<string, string>
}) {
  const sources = new Map(report.sources.map((source) => [source.id, source]))
  const headline = report.content.stories[0]
  if (!headline) throw new Error('Empty daily report')
  const date = new Date(`${report.reportDate}T00:00:00+08:00`)
  const weekday = date.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', weekday: 'long' })
  const published = new Date(report.publishedAt).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false
  })

  function citations(story: { sourceIds: string[] }) {
    return (
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="来源">
        {story.sourceIds.map((id) => {
          const source = sources.get(id)
          if (!source) throw new Error('Unknown daily citation')
          const pillClass =
            'inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring'
          return (
            <li key={id} className="min-w-0">
              {articleLinks[id] ? (
                <Link href={articleLinks[id]} className={pillClass}>
                  <span className="font-medium text-foreground">{source.sourceName}</span>
                  <span className="truncate">{source.title}</span>
                </Link>
              ) : (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener external"
                  data-outbound
                  className={pillClass}
                >
                  <span className="font-medium text-foreground">{source.sourceName}</span>
                  <span className="truncate">{source.title}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  function storyBody(story: DailyStory, index: number, lead = false) {
    const line = getTransitLine(story.section)
    return (
      <article key={story.id} id={story.id} className="scroll-mt-20 py-6">
        <div className="mb-2.5 flex items-center gap-2 font-mono text-xs tabular-nums">
          <span className="font-bold text-primary">{String(index + 1).padStart(2, '0')}</span>
          {line && (
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: line.cssVar }}
            />
          )}
          <span className="text-foreground">{sectionNames[story.section]}</span>
          {lead && (
            <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
              头条
            </span>
          )}
        </div>
        <h2
          className={cn(
            'headline-display break-words text-balance text-foreground',
            lead ? 'text-2xl leading-snug sm:text-3xl' : 'text-lg leading-snug sm:text-xl'
          )}
        >
          {story.title}
        </h2>
        <p className="mt-3.5 whitespace-pre-line break-words text-[0.9375rem] leading-7 text-foreground/85">
          {story.summary}
        </p>
        {citations(story)}
      </article>
    )
  }

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[192px_minmax(0,1fr)]">
      <aside className="hidden min-w-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2 slim-scrollbar">
          <Archive archive={archive} date={report.reportDate} />
        </div>
      </aside>
      <div className="min-w-0">
        <details className="mb-5 rounded-sm border border-border bg-card p-3 lg:hidden">
          <summary className="cursor-pointer font-mono text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            往期 · {report.reportDate} ▾
          </summary>
          <div className="mt-3">
            <Archive archive={archive} date={report.reportDate} />
          </div>
        </details>

        <header className="rounded-sm border border-border bg-card p-5 sm:p-6">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">
                {report.reportDate} · {weekday}
              </p>
              <h1 className="headline-display mt-2 text-3xl text-foreground sm:text-4xl">
                今日日报
              </h1>
            </div>
            <div className="shrink-0 border-l border-border pl-4 text-right sm:pl-6">
              <p className="font-mono text-4xl font-bold tabular-nums leading-none text-primary sm:text-5xl">
                {report.reportDate.slice(8)}
              </p>
              <div className="mt-2">
                <Calendar archive={archive} date={report.reportDate} />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 font-mono text-xs tabular-nums text-muted-foreground">
            <p>
              <strong className="text-foreground">{report.storyCount}</strong> 条事件 ·{' '}
              <strong className="text-foreground">{report.sourceCount}</strong> 篇来源
            </p>
            <p>
              覆盖{' '}
              {new Date(report.windowStart).toLocaleDateString('sv-SE', {
                timeZone: 'Asia/Shanghai'
              })}
            </p>
          </div>
        </header>

        <div className="mt-6 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0">
            <section className="rounded-sm border border-border bg-card p-5" aria-label="总览">
              <h2 className="mb-2 font-mono text-xs font-semibold text-primary">今日概览</h2>
              <p className="text-sm leading-7 text-foreground/90">{report.content.overview.text}</p>
              {citations(report.content.overview)}
            </section>

            <div className="mt-5 rounded-sm border border-border bg-card p-4 xl:hidden">
              <Highlights stories={report.content.stories} />
            </div>

            <div className="mt-5 divide-y divide-border rounded-sm border border-border bg-card px-5 sm:px-6">
              {storyBody(headline, 0, true)}
              {report.content.stories.slice(1).map((story, idx) => storyBody(story, idx + 1))}
            </div>

            <p className="pt-5 font-mono text-xs text-muted-foreground tabular-nums">
              依据站内收录自动整理，请以原文为准 ·{' '}
              <time dateTime={report.publishedAt}>{published}</time>
            </p>

            <nav
              aria-label="相邻期次"
              className="mt-4 flex flex-wrap justify-between gap-4 border-t border-border py-3 text-xs"
            >
              <IssueLink issue={archive.previous} label="← 上一期" />
              <Link href="/daily" className={linkClass}>
                最新
              </Link>
              <IssueLink issue={archive.next} label="下一期 →" />
            </nav>
          </div>

          <aside className="hidden min-w-0 xl:block">
            <div className="sticky top-20 rounded-sm border border-border bg-card p-4">
              <Highlights stories={report.content.stories} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
