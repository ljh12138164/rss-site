import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { FeedResult } from '../lib/hot-feed'
import type { SignalSource } from '../lib/technology-sources'
import { FeedStatus } from './feed-status'

function BandState({ feed }: { feed: Exclude<FeedResult, { state: 'ready' }> }) {
  if (feed.state === 'error') {
    return (
      <div className="border-y border-border py-8 text-sm text-muted-foreground" role="alert">
        这一路信号暂时不可读，其他来源不受影响。
      </div>
    )
  }

  return (
    <div className="border-y border-border py-8 text-sm text-muted-foreground">
      正在等待第一轮采集。
    </div>
  )
}

export function SourceBand({
  source,
  feed,
  basePath = '/technology'
}: {
  source: SignalSource
  feed: FeedResult
  basePath?: '/technology' | '/news' | '/ai'
}) {
  return (
    <section
      aria-labelledby={`${source.id}-title`}
      className="min-w-0 border-t-2 border-foreground pt-5"
    >
      <div className="flex min-h-24 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold tracking-[0.14em] text-primary">
            {source.code} / 5H
          </p>
          <h2
            className="mt-2 truncate text-xl font-semibold tracking-[-0.025em]"
            id={`${source.id}-title`}
          >
            {source.name}
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.description}</p>
        </div>
        <Link
          aria-label={`查看${source.name}完整榜单`}
          className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
          href={`${basePath}/${source.id}`}
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {feed.state === 'ready' ? (
        <>
          <div className="mb-4">
            <FeedStatus {...feed.status} />
          </div>
          <ol className="divide-y divide-border border-y border-border">
            {feed.items.map((item) => (
              <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 py-4" key={item.sourceKey}>
                <span className="pt-0.5 font-mono text-xs font-semibold text-primary">
                  {String(item.position).padStart(2, '0')}
                </span>
                <a
                  className="group flex min-w-0 items-start gap-1.5 text-sm font-medium leading-6 transition-colors hover:text-primary"
                  href={`/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(basePath)}`}
                >
                  <span className="line-clamp-2">{item.title}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="mt-1 size-3 shrink-0 text-muted-foreground group-hover:text-primary"
                  />
                </a>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <BandState feed={feed} />
      )}
    </section>
  )
}
