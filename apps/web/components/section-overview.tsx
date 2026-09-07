import { compareHotItemsByPublishedAt, type FeedResult } from '../lib/hot-feed'
import type { OutboundReturnPath } from '../lib/outbound-link'
import type { SignalSource } from '../lib/technology-sources'
import { HotList } from './hot-list'

export function SectionOverview({
  basePath,
  feeds,
  sources,
  internalArticles = false
}: {
  basePath: OutboundReturnPath
  feeds: Record<string, FeedResult>
  sources: readonly SignalSource[]
  internalArticles?: boolean
}) {
  const items = sources
    .flatMap((platform) => {
      const feed = feeds[platform.id]
      return feed?.state === 'ready' ? feed.items.map((item) => ({ ...item, platform })) : []
    })
    .sort(compareHotItemsByPublishedAt)
    .map((item, index) => ({
      ...item,
      author: null,
      position: index + 1,
      summary: item.summary?.trim().slice(0, 240) || null
    }))
  const hasError = sources.some((source) => feeds[source.id]?.state === 'error')

  return (
    <div className="min-w-0">
      <HotList items={items} returnTo={basePath} internalArticles={internalArticles} />
      {hasError ? (
        <p role="alert" className="py-5 text-pretty text-sm text-muted-foreground">
          {items.length ? '部分来源暂时无法加载，请稍后再试。' : '暂时无法加载，请稍后再试。'}
        </p>
      ) : (
        !items.length && <p className="py-5 text-sm text-muted-foreground">暂无内容。</p>
      )}
    </div>
  )
}
