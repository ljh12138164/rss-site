import Link from 'next/link'
import type { FeedResult } from '../lib/hot-feed'
import type { SignalSource } from '../lib/technology-sources'
import { FeedResultView } from './feed-result'
import { FeedStatus } from './feed-status'
import { SiteShell } from './site-shell'
import { SourceFrequencyStrip } from './source-frequency-strip'

export function SourceDetailView({
  source,
  feed,
  sources,
  basePath,
  sectionName,
  eyebrow,
  titleSuffix,
  description
}: {
  source: SignalSource
  feed: FeedResult
  sources: readonly SignalSource[]
  basePath: '/technology' | '/news'
  sectionName: string
  eyebrow: string
  titleSuffix: string
  description: string
}) {
  return (
    <SiteShell>
      <nav aria-label="面包屑">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          <li>
            <Link className="min-h-11 py-3 transition-colors hover:text-primary" href="/">
              首页
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="min-h-11 py-3 transition-colors hover:text-primary" href={basePath}>
              {sectionName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {source.shortName}
          </li>
        </ol>
      </nav>

      <header className="pb-10 pt-10 sm:pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
          {eyebrow} / {source.code}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em]">
              {source.name}
              {titleSuffix ? ` ${titleSuffix}` : ''}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {feed.state === 'ready' ? <FeedStatus {...feed.status} /> : null}
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip
            active={source.id}
            ariaLabel={`${sectionName}来源频段`}
            basePath={basePath}
            sources={sources}
          />
        </div>
      </header>

      <FeedResultView feed={feed} returnTo={basePath} />
    </SiteShell>
  )
}
