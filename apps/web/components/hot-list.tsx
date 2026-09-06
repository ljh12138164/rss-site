import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { createNewsArticlePath } from '../lib/article-route'
import type { HotItem } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

export function HotList({
  items,
  returnTo = '/technology',
  internalArticles = false,
  source
}: {
  items: HotItem[]
  returnTo?: OutboundReturnPath
  internalArticles?: boolean
  source?: string
}) {
  return (
    <ol className="divide-y divide-border border-y border-border">
      {items.map((item) => {
        const internalHref =
          internalArticles && source && item.articleId
            ? createNewsArticlePath(source, item.title, item.articleId)
            : null
        const href =
          internalHref ??
          `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(returnTo)}`

        return (
          <li
            className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-5"
            key={item.sourceKey}
          >
            <span className="pt-0.5 font-mono text-sm font-semibold tabular-nums text-primary">
              {String(item.position).padStart(2, '0')}
            </span>
            <article className="min-w-0">
              <Link className="group block max-w-full text-foreground" href={href}>
                <span className="block min-w-0">
                  <span className="inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-7 tracking-[-0.01em] transition-colors group-hover:text-primary sm:text-lg">
                    <span>{item.title}</span>
                    {internalHref ? (
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                      />
                    ) : (
                      <ArrowUpRight
                        aria-hidden="true"
                        className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                      />
                    )}
                  </span>
                  {item.summary ? (
                    <span className="mt-2 line-clamp-3 text-sm font-normal leading-6 text-muted-foreground">
                      {item.summary}
                    </span>
                  ) : null}
                  {item.author || item.publishedAt ? (
                    <span className="mt-3 flex flex-wrap items-center gap-x-2 font-mono text-[0.6875rem] font-normal uppercase tracking-[0.08em] text-muted-foreground">
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
            </article>
          </li>
        )
      })}
    </ol>
  )
}
