import Link from 'next/link'
import { type DailyReport, type DailyStory, dailySections } from '../../../../shared/daily-report'
import type { DailyArchive, DailyArchiveEntry } from '../../lib/daily-reports'
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
  'min-h-11 inline-flex items-center text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary'

function IssueLink({ issue, label }: { issue?: DailyArchiveEntry; label: string }) {
  return issue ? (
    <Link href={`/daily/${issue.report_date}`} className={linkClass}>
      {label}
    </Link>
  ) : (
    <span className="inline-flex min-h-11 items-center text-muted-foreground/50">{label}</span>
  )
}

function Archive({ archive, date }: { archive: DailyArchive; date: string }) {
  return (
    <nav aria-label="日报往期" className="min-w-0">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-sm font-semibold">往期</h2>
        <Link href="/daily" className={linkClass}>
          最新一期
        </Link>
      </div>
      <div className="flex items-center justify-between gap-2 py-3 text-xs">
        <IssueLink issue={archive.previousMonth} label="← 上月" />
        <span className="font-mono tabular-nums">{date.slice(0, 7)}</span>
        <IssueLink issue={archive.nextMonth} label="下月 →" />
      </div>
      <ol className="divide-y divide-border/60">
        {archive.entries.map((issue) => (
          <li key={issue.report_date}>
            <Link
              href={`/daily/${issue.report_date}`}
              aria-current={issue.report_date === date ? 'page' : undefined}
              title={issue.title}
              className={cn(
                'group flex min-h-16 min-w-0 items-start gap-3 rounded-sm px-2 py-3 focus-visible:outline-2 focus-visible:outline-primary',
                issue.report_date === date ? 'bg-primary/8 text-primary' : 'hover:bg-muted/60'
              )}
            >
              <span className="shrink-0 font-mono text-xl font-semibold tabular-nums leading-6">
                {issue.report_date.slice(8)}
              </span>
              <span className="line-clamp-2 min-w-0 text-xs leading-5">{issue.title}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="pt-4 text-xs text-muted-foreground">本月已发布 {archive.entries.length} 期</p>
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
      <summary className="min-h-11 cursor-pointer list-none py-3 text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
        日期导航 ▾
      </summary>
      <div className="absolute right-0 z-10 w-[336px] max-w-[calc(100vw-2.5rem)] border border-border bg-background p-3 shadow-lg">
        <p className="mb-3 font-mono">{date.slice(0, 7)} · 已发布日可选</p>
        <div className="grid grid-cols-7 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
            <span key={day} className="py-2 text-muted-foreground">
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
                  'flex min-h-11 items-center justify-center font-mono tabular-nums hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary',
                  value === date && 'bg-primary text-primary-foreground'
                )}
              >
                {day}
              </Link>
            ) : (
              <span
                key={value}
                className="flex min-h-11 items-center justify-center font-mono tabular-nums text-muted-foreground/50"
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
    <nav aria-label="今日重点">
      <h2 className="eyebrow mb-3 text-primary">本期重点</h2>
      <ol className="divide-y divide-border">
        {stories.slice(0, 5).map((story, index) => (
          <li key={story.id}>
            <a
              href={`#${story.id}`}
              className="flex min-h-11 gap-3 py-4 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="font-mono text-2xl font-semibold tabular-nums text-primary">
                {index + 1}
              </span>
              <span className="min-w-0 text-sm font-medium leading-6 hover:text-primary">
                {story.title}
              </span>
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
      <ul
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        aria-label="报道来源"
      >
        {story.sourceIds.map((id) => {
          const source = sources.get(id)
          if (!source) throw new Error('Unknown daily citation')
          return (
            <li key={id} className="min-w-0">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                title={source.title}
                className={cn(linkClass, 'break-words')}
              >
                {source.sourceName} ↗
              </a>
              {articleLinks[id] && (
                <Link
                  href={articleLinks[id]}
                  className={cn(linkClass, 'ml-2 underline underline-offset-4')}
                >
                  站内阅读
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    )
  }
  function storyBody(story: DailyStory, lead = false) {
    const Heading = lead ? 'h2' : 'h3'
    return (
      <article key={story.id} id={story.id} className="scroll-mt-36 py-7">
        {lead && <p className="eyebrow mb-4 text-primary">头条 · {sectionNames[story.section]}</p>}
        <Heading
          className={cn(
            'headline-display break-words text-balance',
            lead ? 'text-3xl leading-tight sm:text-4xl' : 'text-xl leading-snug sm:text-2xl'
          )}
        >
          {story.title}
        </Heading>
        <p className="mt-5 whitespace-pre-line break-words text-[0.9375rem] leading-8 text-foreground/85">
          {story.summary}
        </p>
        {citations(story)}
      </article>
    )
  }
  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)]">
      <aside className="hidden min-w-0 lg:block">
        <div className="sticky top-36 max-h-[calc(100dvh-10rem)] overflow-y-auto pr-2 slim-scrollbar">
          <Archive archive={archive} date={report.reportDate} />
        </div>
      </aside>
      <div className="min-w-0">
        <details className="mb-6 border-b border-border pb-3 lg:hidden">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">
            往期日报 · {report.reportDate} ▾
          </summary>
          <Archive archive={archive} date={report.reportDate} />
        </details>
        <header className="border-b border-border pb-6">
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-4 font-mono text-[0.6875rem] text-muted-foreground">
            <p>每日要闻 · {weekday}</p>
            <p>每天 08:00 开始编刊</p>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-4 py-8 sm:py-10">
            <div className="min-w-0">
              <p className="eyebrow mb-3 text-muted-foreground">今日热点 · 编辑精选</p>
              <h1 className="headline-display text-4xl leading-none tracking-tight sm:text-6xl">
                <span className="text-primary">今日</span>日报
              </h1>
            </div>
            <div className="shrink-0 border-l border-border pl-4 text-right sm:pl-6">
              <p className="font-mono text-xs text-muted-foreground">
                {report.reportDate.slice(0, 7)}
              </p>
              <p className="font-mono text-5xl font-semibold tabular-nums leading-tight sm:text-6xl">
                {report.reportDate.slice(8)}
              </p>
              <Calendar archive={archive} date={report.reportDate} />
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <p>
              <strong className="font-mono text-lg tabular-nums text-foreground">
                {report.storyCount}
              </strong>{' '}
              条重点 <span className="mx-2">·</span>
              <strong className="font-mono text-lg tabular-nums text-foreground">
                {report.sourceCount}
              </strong>{' '}
              个来源
            </p>
            <p>
              覆盖{' '}
              {new Date(report.windowStart).toLocaleDateString('sv-SE', {
                timeZone: 'Asia/Shanghai'
              })}{' '}
              全天
            </p>
          </div>
        </header>
        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_200px]">
          <div className="min-w-0">
            <section className="border-b border-border py-7" aria-label="导读">
              <p className="eyebrow mb-3 text-primary">导读</p>
              <p className="text-base leading-8">{report.content.overview.text}</p>
              {citations(report.content.overview)}
            </section>
            <div className="border-b border-border py-6 xl:hidden">
              <Highlights stories={report.content.stories} />
            </div>
            {storyBody(headline, true)}
            <nav
              aria-label="分区目录"
              className="flex flex-wrap gap-x-5 border-y border-border py-2 text-xs"
            >
              {dailySections.map((section) => (
                <a key={section} href={`#daily-${section}`} className={linkClass}>
                  {sectionNames[section]}
                </a>
              ))}
            </nav>
            {dailySections.map((section) => {
              const stories = report.content.stories.filter(
                (story) => story.section === section && story.id !== headline.id
              )
              return (
                <section
                  key={section}
                  id={`daily-${section}`}
                  className="scroll-mt-36 border-b border-border py-6"
                >
                  <h2 className="eyebrow text-primary">{sectionNames[section]}</h2>
                  {stories.length ? (
                    <div className="divide-y divide-border/60">
                      {stories.map((story) => storyBody(story))}
                    </div>
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">
                      {headline.section === section ? '本期重点见头条' : '本期未收录'}
                    </p>
                  )}
                </section>
              )
            })}
            <p className="pt-6 text-xs leading-6 text-muted-foreground">
              依据已收录报道整理，摘要由 AI 生成，请以原文为准
              <br />
              <time dateTime={report.publishedAt}>发布于 {published}（北京时间）</time>
            </p>
            <nav
              aria-label="相邻日报"
              className="mt-6 flex flex-wrap justify-between gap-4 border-t border-border py-3 text-sm"
            >
              <IssueLink issue={archive.previous} label="← 上一期" />
              <Link href="/daily" className={linkClass}>
                最新日报
              </Link>
              <IssueLink issue={archive.next} label="下一期 →" />
            </nav>
          </div>
          <aside className="hidden min-w-0 border-l border-border pt-7 pl-6 xl:block">
            <div className="sticky top-36">
              <Highlights stories={report.content.stories} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
