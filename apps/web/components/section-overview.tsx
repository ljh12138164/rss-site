import type { FeedResult } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { SourceBand } from './source-band'

export function SectionOverview({
  basePath,
  feeds,
  sources,
  internalArticles = false,
  showSummaries = false
}: {
  basePath: OutboundReturnPath
  feeds: Record<string, FeedResult>
  sources: readonly SignalSource[]
  internalArticles?: boolean
  showSummaries?: boolean
}) {
  return (
    <div className="min-w-0 space-y-14">
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
  )
}
