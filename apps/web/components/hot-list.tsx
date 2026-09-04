import { ArrowUpRight } from 'lucide-react'
import type { HotItem } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

export function HotList({
  items,
  returnTo = '/technology'
}: {
  items: HotItem[]
  returnTo?: OutboundReturnPath
}) {
  return (
    <ol className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <li
          className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-5"
          key={item.sourceKey}
        >
          <span className="pt-0.5 font-mono text-sm font-semibold tabular-nums text-primary">
            {String(item.position).padStart(2, '0')}
          </span>
          <article className="min-w-0">
            <a
              className="group inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-7 tracking-[-0.01em] text-foreground transition-colors hover:text-primary sm:text-lg"
              href={`/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(returnTo)}`}
            >
              <span>{item.title}</span>
              <ArrowUpRight
                aria-hidden="true"
                className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
              />
            </a>
            {item.summary ? (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {item.summary}
              </p>
            ) : null}
            {item.author || item.publishedAt ? (
              <p className="mt-3 flex flex-wrap items-center gap-x-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
                {item.author ? <span>{item.author}</span> : null}
                {item.author && item.publishedAt ? <span aria-hidden="true">·</span> : null}
                {item.publishedAt ? (
                  <time dateTime={item.publishedAt.toISOString()}>
                    {dateFormatter.format(item.publishedAt)}
                  </time>
                ) : null}
              </p>
            ) : null}
          </article>
        </li>
      ))}
    </ol>
  )
}
