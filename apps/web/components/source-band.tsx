import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { createNewsArticlePath } from '../lib/article-route'
import type { FeedResult } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { FeedStatus } from './feed-status'

function BandState({ feed }: { feed: Exclude<FeedResult, { state: 'ready' }> }) {
  if (feed.state === 'error') {
    return (
      <div className="border-y border-border py-8 text-sm text-muted-foreground" role="alert">
        暂时无法加载，请稍后再试。
      </div>
    )
  }

  return <div className="border-y border-border py-8 text-sm text-muted-foreground">暂无内容。</div>
}

export function SourceBand({
  source,
  feed,
  basePath = '/technology',
  internalArticles = false,
  showSummaries = false
}: {
  source: SignalSource
  feed: FeedResult
  basePath?: OutboundReturnPath
  internalArticles?: boolean
  showSummaries?: boolean
}) {
  return (
    <section
      aria-labelledby={`${source.id}-title`}
      className="min-w-0 scroll-mt-24 border-t border-border pt-6"
    >
      <div className="flex items-start justify-between gap-4 pb-5">
        <div className="min-w-0">
          <h2
            className="truncate text-xl font-semibold tracking-[-0.025em]"
            id={`${source.id}-title`}
          >
            {source.name}
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.description}</p>
        </div>
        <Link
          className="flex min-h-11 shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          href={`${basePath}/${source.id}`}
        >
          查看全部
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {feed.state === 'ready' ? (
        <>
          <div className="mb-3">
            <FeedStatus {...feed.status} />
          </div>
          <ol className="divide-y divide-border border-y border-border">
            {feed.items.map((item) => {
              const internalHref =
                internalArticles && item.articleId
                  ? createNewsArticlePath(source.id, item.title, item.articleId)
                  : null
              const href =
                internalHref ??
                `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(basePath)}`

              return (
                <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 py-4" key={item.sourceKey}>
                  <span className="pt-0.5 font-mono text-xs font-semibold text-primary">
                    {String(item.position).padStart(2, '0')}
                  </span>
                  <Link
                    className="group block min-w-0 text-sm font-medium leading-6 transition-colors hover:text-primary"
                    href={href}
                  >
                    <span className="flex min-w-0 items-start gap-1.5">
                      <span className="line-clamp-2">{item.title}</span>
                      {internalHref ? (
                        <ArrowRight
                          aria-hidden="true"
                          className="mt-1 size-3 shrink-0 text-muted-foreground group-hover:text-primary"
                        />
                      ) : (
                        <ArrowUpRight
                          aria-hidden="true"
                          className="mt-1 size-3 shrink-0 text-muted-foreground group-hover:text-primary"
                        />
                      )}
                    </span>
                    {showSummaries && item.summary ? (
                      <span className="mt-1.5 line-clamp-2 text-sm font-normal leading-6 text-muted-foreground">
                        {item.summary}
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ol>
        </>
      ) : (
        <BandState feed={feed} />
      )}
    </section>
  )
}
