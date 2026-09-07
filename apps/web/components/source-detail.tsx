import type { FeedResult } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { FeedResultView } from './feed-result'
import { FeedStatus } from './feed-status'

export function SourceDetailView({
  source,
  feed,
  basePath
}: {
  source: SignalSource
  feed: FeedResult
  basePath: OutboundReturnPath
}) {
  return (
    <>
      {feed.state === 'ready' && (
        <div className="mb-4">
          <FeedStatus {...feed.status} />
        </div>
      )}
      <FeedResultView feed={feed} returnTo={basePath} source={source.id} />
    </>
  )
}
