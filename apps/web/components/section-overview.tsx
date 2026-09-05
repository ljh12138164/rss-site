import type { FeedResult } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { SiteShell } from './site-shell'
import { SourceBand } from './source-band'
import { SourceSidebar } from './source-sidebar'

export function SectionOverview({
  basePath,
  description,
  feeds,
  sources,
  title
}: {
  basePath: OutboundReturnPath
  description: string
  feeds: Record<string, FeedResult>
  sources: readonly SignalSource[]
  title: string
}) {
  return (
    <SiteShell>
      <header className="border-b border-border pb-8 sm:pb-10">
        <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </header>

      <div className="mt-8 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <SourceSidebar ariaLabel={`${title}平台`} basePath={basePath} sources={sources} />
        <div className="mt-8 min-w-0 space-y-14 lg:mt-0">
          {sources.map((source) => (
            <SourceBand
              basePath={basePath}
              feed={feeds[source.id]}
              key={source.id}
              source={source}
            />
          ))}
        </div>
      </div>
    </SiteShell>
  )
}
