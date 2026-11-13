import { ArrowRight, ArrowUpRight, Flame, GitMerge } from 'lucide-react'
import Link from 'next/link'
import type { HotRanking, HotReference } from '../../../shared/hot-ranking'
import { createArticlePath } from '../lib/article-route'
import { findSignalSource } from '../lib/technology-sources'
import { getTransitLine, getTransitLineColor } from '../lib/transit-lines'
import { CoverImage } from './cover-image'
import { SourceIcon } from './source-icon'

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Shanghai'
})

function referenceHref(ref: HotReference) {
  if (ref.available !== false) {
    return {
      internal: true as const,
      href: createArticlePath(ref.source, ref.title, ref.id)
    }
  }
  return { internal: false as const, href: ref.url }
}

function ReferenceLink({ reference }: { reference: HotReference }) {
  const source = findSignalSource(reference.source)
  const label = source?.shortName ?? reference.source
  const target = referenceHref(reference)
  const className =
    'inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-background/80 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring'

  if (target.internal) {
    return (
      <Link href={target.href} title={reference.title} className={className}>
        {source && <SourceIcon source={source} className="size-3.5 shrink-0" />}
        <span className="truncate font-medium text-foreground">{label}</span>
        <span className="hidden truncate sm:inline">{reference.title}</span>
      </Link>
    )
  }

  return (
    <a
      href={target.href}
      target="_blank"
      rel="noreferrer noopener external"
      data-outbound
      title={reference.title}
      className={className}
    >
      {source && <SourceIcon source={source} className="size-3.5 shrink-0" />}
      <span className="truncate font-medium text-foreground">{label}</span>
      <span className="hidden truncate sm:inline">{reference.title}</span>
      <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
    </a>
  )
}

export function HomeHotRanking({ ranking }: { ranking: HotRanking }) {
  return (
    <section aria-labelledby="hot-ranking">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-primary" />
          <h2 id="hot-ranking" className="headline-display text-lg text-foreground sm:text-xl">
            热门交汇
          </h2>
          {ranking.state === 'ready' && ranking.delayed && (
            <span className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-600 dark:text-amber-300">
              更新延迟
            </span>
          )}
        </div>
        {ranking.state === 'ready' && (
          <time
            dateTime={ranking.computedAt}
            className="font-mono text-xs tabular-nums text-muted-foreground"
          >
            {timeFormatter.format(new Date(ranking.computedAt))} · {ranking.articleCount} 篇聚合
          </time>
        )}
      </div>

      {ranking.state === 'unavailable' ? (
        <div className="rounded-sm border border-border bg-card px-5 py-10 text-center">
          <p className="text-sm font-medium text-foreground">热点排行暂不可用</p>
          <p className="mt-1.5 text-xs text-muted-foreground">请稍后刷新</p>
        </div>
      ) : !ranking.entries.length ? (
        <div className="rounded-sm border border-border bg-card px-5 py-10 text-center">
          <p className="text-sm font-medium text-foreground">暂未发现符合条件的热点</p>
        </div>
      ) : (
        <ol className="relative space-y-4">
          {ranking.entries.map((entry, index) => {
            const rank = index + 1
            const leadRef = entry.references[0]
            const line = getTransitLine(leadRef?.section)
            const lineColor = getTransitLineColor(leadRef?.section)
            const leadTarget = leadRef ? referenceHref(leadRef) : null
            const hasImage = Boolean(entry.imageUrl?.trim())

            return (
              <li key={entry.eventId} className="relative pl-8 sm:pl-10">
                {/* Continuous vertical transit spine */}
                <span
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 left-[9px] w-[2px] sm:left-[11px]"
                  style={{
                    backgroundColor: lineColor,
                    opacity: 0.45,
                    top: index === 0 ? '18px' : 0,
                    bottom: index === ranking.entries.length - 1 ? 'calc(100% - 22px)' : '-16px'
                  }}
                />
                {/* Circular station / interchange node */}
                <span
                  aria-hidden="true"
                  className="absolute top-[14px] left-[2px] flex size-4 items-center justify-center rounded-full border-2 bg-background sm:left-[4px]"
                  style={{ borderColor: lineColor }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: rank === 1 ? lineColor : 'transparent' }}
                  />
                </span>

                <article className="rounded-sm border border-border bg-card p-4 transition-colors hover:border-strong hover:bg-row-highlight sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
                    <span className="font-bold text-foreground">
                      {String(rank).padStart(2, '0')}
                    </span>
                    {line && (
                      <span
                        className="inline-flex items-center gap-1 font-sans text-xs font-medium"
                        style={{ color: line.cssVar }}
                      >
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: line.cssVar }}
                        />
                        {line.name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background/70 px-1.5 py-0.5 text-[11px] text-foreground">
                      <GitMerge className="size-3 text-primary" aria-hidden="true" />
                      {entry.participants} 源交汇
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 text-primary">
                      <Flame className="size-3.5" aria-hidden="true" />
                      <span className="font-semibold">{entry.heat.toFixed(1)}</span>
                    </span>
                  </div>

                  <div
                    className={
                      hasImage
                        ? 'grid min-w-0 grid-cols-[minmax(0,1fr)_88px] gap-4 sm:grid-cols-[minmax(0,1fr)_116px]'
                        : 'min-w-0'
                    }
                  >
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold leading-snug text-foreground sm:text-[1.0625rem]">
                        {leadTarget ? (
                          leadTarget.internal ? (
                            <Link
                              href={leadTarget.href}
                              className="group inline-flex items-start gap-1.5 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                            >
                              <span className="min-w-0 wrap-anywhere">{entry.title}</span>
                              <ArrowRight
                                aria-hidden="true"
                                className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                              />
                            </Link>
                          ) : (
                            <a
                              href={leadTarget.href}
                              target="_blank"
                              rel="noreferrer noopener external"
                              data-outbound
                              className="group inline-flex items-start gap-1.5 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                            >
                              <span className="min-w-0 wrap-anywhere">{entry.title}</span>
                              <ArrowUpRight
                                aria-hidden="true"
                                className="mt-1 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                              />
                            </a>
                          )
                        ) : (
                          entry.title
                        )}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-pretty text-sm leading-6 text-muted-foreground">
                        {entry.summary}
                      </p>
                    </div>

                    {hasImage && (
                      <CoverImage
                        src={entry.imageUrl}
                        previewLabel={entry.title}
                        width={160}
                        height={100}
                        className="w-[88px] rounded-sm sm:w-[116px]"
                      />
                    )}
                  </div>

                  {entry.references.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2 border-t border-border/70 pt-3">
                      {entry.references.map((ref) => (
                        <ReferenceLink key={ref.id} reference={ref} />
                      ))}
                    </div>
                  )}
                </article>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
