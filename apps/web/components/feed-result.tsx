import type { FeedResult } from '../lib/hot-feed'
import { EmptyFeed, FeedError } from './feed-state'
import { HotList } from './hot-list'

export function FeedResultView({
  feed,
  returnTo = '/technology'
}: {
  feed: FeedResult
  returnTo?: '/technology' | '/news'
}) {
  if (feed.state === 'empty') {
    return <EmptyFeed />
  }

  if (feed.state === 'error') {
    return <FeedError />
  }

  return <HotList items={feed.items} returnTo={returnTo} />
}
