import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { AiTimelineItem } from '../lib/hot-feed'
import { getAiSource } from '../lib/technology-sources'

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai'
const dateKeyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: SHANGHAI_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})
const dateLabelFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: SHANGHAI_TIME_ZONE,
  month: '2-digit',
  day: '2-digit'
})
const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: SHANGHAI_TIME_ZONE,
  weekday: 'short'
})

interface TimelineGroup {
  key: string
  label: string
  weekday: string | null
  items: AiTimelineItem[]
}

function getDateKey(date: Date) {
  return Object.fromEntries(
    dateKeyFormatter.formatToParts(date).map((part) => [part.type, part.value])
  )
}

export function groupAiTimelineItems(items: AiTimelineItem[]): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>()

  for (const item of items) {
    const publishedAt = item.publishedAt
    const hasDate = publishedAt !== null && Number.isFinite(publishedAt.getTime())
    const dateParts = hasDate ? getDateKey(publishedAt) : null
    const key = dateParts ? `${dateParts.year}-${dateParts.month}-${dateParts.day}` : 'unknown'
    const group = groups.get(key) ?? {
      key,
      label: hasDate ? dateLabelFormatter.format(publishedAt) : '日期未知',
      weekday: hasDate ? weekdayFormatter.format(publishedAt) : null,
      items: []
    }

    group.items.push(item)
    groups.set(key, group)
  }

  return [...groups.values()]
}

export function AiTimeline({ items }: { items: AiTimelineItem[] }) {
  return (
    <ol aria-label="AI 平台事件时间线" className="space-y-12 sm:space-y-16">
      {groupAiTimelineItems(items).map((group) => (
        <li className="grid gap-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-8" key={group.key}>
          <h2 className="font-mono text-sm font-semibold tabular-nums tracking-[0.08em] text-foreground sm:pt-0.5 sm:text-right">
            {group.key === 'unknown' ? (
              <span>{group.label}</span>
            ) : (
              <time dateTime={group.key}>{group.label}</time>
            )}
            {group.weekday ? (
              <span className="ml-2 text-xs font-normal tracking-normal text-muted-foreground sm:mt-1 sm:ml-0 sm:block">
                {group.weekday}
              </span>
            ) : null}
          </h2>

          <ol className="min-w-0 border-l-2 border-primary/40 pl-5 sm:pl-8">
            {group.items.map((item) => {
              const source = getAiSource(item.source)

              return (
                <li
                  className="relative border-t border-border py-6 first:border-t-2 first:border-foreground first:pt-7 last:border-b sm:py-7 sm:first:pt-8"
                  key={`${item.source}-${item.sourceKey}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[1.5625rem] top-[1.8rem] size-2 rounded-full border-2 border-background bg-primary ring-1 ring-primary sm:-left-[2.3125rem] sm:top-[2.05rem]"
                  />
                  <article className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em]">
                      <Link
                        className="font-semibold text-primary transition-colors hover:text-foreground"
                        href={`/ai/${source.id}`}
                      >
                        {source.code}
                      </Link>
                      <span aria-hidden="true" className="text-border">
                        /
                      </span>
                      <span className="normal-case tracking-normal text-muted-foreground">
                        {source.name}
                      </span>
                    </p>
                    <a
                      className="group mt-3 inline-flex max-w-full items-start gap-2 text-lg font-semibold leading-7 tracking-[-0.025em] text-foreground transition-colors hover:text-primary sm:text-xl sm:leading-8"
                      href={`/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent('/ai')}`}
                    >
                      <span className="min-w-0 break-words">{item.title}</span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                      />
                    </a>
                  </article>
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}
