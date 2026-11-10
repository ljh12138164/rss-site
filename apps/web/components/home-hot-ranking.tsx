import { findSignalSource } from '@rss-site/signals'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { HotRanking, HotReference } from '../../../shared/hot-ranking'
import { articleSource, createArticlePath } from '../lib/article-route'
import { CoverImage } from './cover-image'

function ReferenceLink({
  reference,
  children,
  className,
  title
}: {
  reference: HotReference
  children: ReactNode
  className: string
  title?: string
}) {
  return reference.available !== false && articleSource(reference.source) ? (
    <Link
      href={createArticlePath(reference.source, reference.title, reference.id)}
      className={className}
      title={title}
    >
      {children}
    </Link>
  ) : (
    <a
      href={reference.url}
      target="_blank"
      rel="noreferrer noopener external"
      data-outbound=""
      className={className}
      title={title}
    >
      {children}
    </a>
  )
}
export function HomeHotRanking({ ranking }: { ranking: HotRanking }) {
  return (
    <section aria-labelledby="hot-ranking" className="mt-10 sm:mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="hot-ranking" className="eyebrow">
          热点排行
        </h2>
        <p className="text-xs text-muted-foreground">近 48 小时 · 本站来源热度</p>
      </div>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        同一机构只计一次，越新的报道贡献越高。
      </p>
      {ranking.state === 'unavailable' ? (
        <div className="mt-4 border-y border-border py-8">
          <p className="text-sm text-muted-foreground">
            热点排行暂不可用，完成统计后会在这里显示。
          </p>
          <Link
            href="/ai"
            className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
          >
            浏览 AI 动态 →
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            <time dateTime={ranking.computedAt}>
              更新于{' '}
              {new Date(ranking.computedAt).toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                hour12: false
              })}
              （北京时间）
            </time>
            {ranking.delayed && <span className="ml-2">更新延迟，当前展示上次完成的统计</span>}
            {!!ranking.laggingSources && <span className="ml-2">部分来源采集延迟</span>}
          </p>
          {ranking.entries.length === 0 ? (
            <p className="mt-4 border-y border-border py-8 text-sm text-muted-foreground">
              近 48 小时暂未发现符合条件的热点。
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-border/60 border-y border-border">
              {ranking.entries.map((entry, index) => {
                const representative = entry.references[0]
                if (!representative) return null
                return (
                  <li
                    key={entry.eventId}
                    className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3 py-6 sm:grid-cols-[2.5rem_9rem_minmax(0,1fr)] sm:gap-4"
                  >
                    <span className="font-mono text-2xl font-semibold tabular-nums text-primary">
                      <span className="sr-only">第 </span>
                      {String(index + 1).padStart(2, '0')}
                      <span className="sr-only"> 名</span>
                    </span>
                    <div className="hidden sm:block">
                      <CoverImage
                        src={entry.imageUrl}
                        previewLabel={entry.title}
                        className="w-36"
                      />
                    </div>
                    <div className="min-w-0">
                      <ReferenceLink
                        reference={representative}
                        className="block min-h-11 font-serif text-lg font-semibold leading-7 text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary sm:text-xl"
                      >
                        <span className="wrap-anywhere text-balance">{entry.title}</span>
                      </ReferenceLink>
                      <p className="mt-2 wrap-anywhere text-pretty text-sm leading-7 text-foreground/85">
                        {entry.summary}
                      </p>
                      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          热度{' '}
                          <strong className="font-mono font-semibold tabular-nums text-foreground">
                            {entry.heat.toFixed(1)}
                          </strong>
                        </span>
                        <span>
                          <strong className="font-mono font-semibold tabular-nums">
                            {entry.participants}
                          </strong>{' '}
                          个参与来源
                        </span>
                      </p>
                      <ul
                        aria-label="报道来源"
                        className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground"
                      >
                        {entry.references.map((ref) => (
                          <li key={ref.id}>
                            <ReferenceLink
                              reference={ref}
                              title={ref.title}
                              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                            >
                              {findSignalSource(ref.source)?.name ?? ref.source} →
                            </ReferenceLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}
    </section>
  )
}
