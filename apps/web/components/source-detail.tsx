import Link from 'next/link'
import type { FeedResult } from '../lib/hot-feed'
import type { SignalSource } from '../lib/technology-sources'
import { FeedResultView } from './feed-result'
import { FeedStatus } from './feed-status'
import { SiteShell } from './site-shell'
import { SourceSidebar } from './source-sidebar'

export function SourceDetailView({
  source,
  feed,
  sources,
  basePath,
  sectionName,
  description
}: {
  source: SignalSource
  feed: FeedResult
  sources: readonly SignalSource[]
  basePath: '/technology' | '/news' | '/ai' | '/social' | '/finance' | '/games'
  sectionName: string
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

      <div className="mt-10 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <SourceSidebar
          active={source.id}
          ariaLabel={`${sectionName}平台`}
          basePath={basePath}
          sources={sources}
        />
        <div className="mt-8 min-w-0 lg:mt-0">
          <header className="border-b border-border pb-8 sm:pb-10">
            <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {source.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            {feed.state === 'ready' ? (
              <div className="mt-4">
                <FeedStatus {...feed.status} />
              </div>
            ) : null}
          </header>

          <div className="mt-8">
            <FeedResultView feed={feed} returnTo={basePath} />
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
