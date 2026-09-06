import type { FeedResult } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { SiteShell } from './site-shell'
import { SourceBand } from './source-band'
import { SourceNavigation } from './source-navigation'

export function SectionOverview({
  basePath,
  description,
  feeds,
  sources,
  title,
  internalArticles = false,
  showSummaries = false
}: {
  basePath: OutboundReturnPath
  description: string
  feeds: Record<string, FeedResult>
  sources: readonly SignalSource[]
  title: string
  internalArticles?: boolean
  showSummaries?: boolean
}) {
  return (
    <SiteShell>
      <header className="pb-8 sm:pb-10">
        <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </header>

      <SourceNavigation ariaLabel="内容来源" basePath={basePath} sources={sources} />

      <div className="mt-10 min-w-0 space-y-14">
        {sources.map((source) => (
          <SourceBand
            basePath={basePath}
            feed={feeds[source.id]}
            internalArticles={internalArticles}
            key={source.id}
            showSummaries={showSummaries}
            source={source}
          />
        ))}
      </div>
    </SiteShell>
  )
}
