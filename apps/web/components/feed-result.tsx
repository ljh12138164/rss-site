import type { FeedResult } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import { EmptyFeed, FeedError } from './feed-state'
import { HotList } from './hot-list'

export function FeedResultView({
  feed,
  returnTo = '/technology',
  internalArticles = false,
  source
}: {
  feed: FeedResult
  returnTo?: OutboundReturnPath
  internalArticles?: boolean
  source?: string
}) {
  if (feed.state === 'empty') {
    return <EmptyFeed />
  }

  if (feed.state === 'error') {
    return <FeedError />
  }

  return (
    <HotList
      internalArticles={internalArticles}
      items={
        source === 'github'
          ? feed.items.map((item) => ({ ...item, publishedAt: null, author: null }))
          : feed.items
      }
      returnTo={returnTo}
      source={source}
    />
  )
}
