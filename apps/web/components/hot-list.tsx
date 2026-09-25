import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { createArticlePath } from '../lib/article-route'
import type { HotItem } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { GitHubRepositoryRow } from './github-repository-row'
import { SourceIcon } from './source-icon'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Shanghai'
})

export function HotList({
  items,
  returnTo = '/technology',
  source
}: {
  items: (HotItem & { platform?: SignalSource; section?: OutboundReturnPath })[]
  returnTo?: OutboundReturnPath
  source?: string
}) {
  return (
    <ol className="border-y border-strong/60">
      {items.map((item) => {
        const sourceId = item.platform?.id ?? source
        if (sourceId === 'github') {
          return (
            <GitHubRepositoryRow
              item={item}
              key={`${sourceId}:${item.sourceKey}`}
              returnTo={returnTo}
            />
          )
        }
        const internalHref =
          sourceId && item.articleId
            ? createArticlePath(sourceId, item.title, item.articleId)
            : null
        const href =
          internalHref ??
          `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(returnTo)}`

        return (
          <li
            className="-mx-2 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-md border-b border-border/80 px-2.5 py-5 transition-colors duration-150 last:border-b-0 hover:bg-row-highlight sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5 sm:py-6"
            key={`${sourceId ?? ''}:${item.sourceKey}`}
          >
            <span aria-hidden="true" className="rank-numeral pt-1" data-rank={item.position}>
              {String(item.position).padStart(2, '0')}
            </span>
            <article className="min-w-0">
              <Link className="group block max-w-full text-foreground" href={href}>
                <span className="block min-w-0">
                  <span className="inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-7 tracking-[-0.01em] transition-colors group-hover:text-primary sm:text-[1.0625rem]">
                    <span className="min-w-0 wrap-anywhere">{item.title}</span>
                    {internalHref ? (
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-1 group-hover:text-primary"
                      />
                    ) : (
                      <ArrowUpRight
                        aria-hidden="true"
                        className="mt-1.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                      />
                    )}
                  </span>
                  {item.summary ? (
                    <span className="mt-2 line-clamp-2 text-sm font-normal leading-6 text-muted-foreground">
                      {item.summary}
                    </span>
                  ) : null}
                  {item.author || item.publishedAt ? (
                    <span className="mt-3 flex flex-wrap items-center gap-x-2 font-mono text-[0.6875rem] font-normal tracking-[0.06em] text-muted-foreground">
                      {item.author ? <span>{item.author}</span> : null}
                      {item.author && item.publishedAt ? <span aria-hidden="true">·</span> : null}
                      {item.publishedAt ? (
                        <time dateTime={item.publishedAt.toISOString()}>
                          {dateFormatter.format(item.publishedAt)}
                        </time>
                      ) : null}
                    </span>
                  ) : null}
                </span>
              </Link>
              {item.platform && (
                <Link
                  href={`${item.section ?? returnTo}/${item.platform.id}`}
                  aria-label={`浏览${item.platform.name}`}
                  className="mt-2 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary sm:min-h-7"
                >
                  <SourceIcon className="size-3.5 shrink-0" source={item.platform} />
                  <span className="truncate">{item.platform.shortName}</span>
                </Link>
              )}
            </article>
          </li>
        )
      })}
    </ol>
  )
}
