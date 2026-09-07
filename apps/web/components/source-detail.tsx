import type { FeedResult } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { FeedResultView } from './feed-result'
import { FeedStatus } from './feed-status'

export function SourceDetailView({
  source,
  feed,
  basePath,
  internalArticles = false
}: {
  source: SignalSource
  feed: FeedResult
  basePath: OutboundReturnPath
  internalArticles?: boolean
}) {
  return (
    <>
      {feed.state === 'ready' && (
        <div className="mb-4">
          <FeedStatus {...feed.status} />
        </div>
      )}
      <FeedResultView
        feed={feed}
        internalArticles={internalArticles}
        returnTo={basePath}
        source={source.id}
      />
    </>
  )
}
