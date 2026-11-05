import type { SignalSource } from '@rss-site/signals'
import { parseSignalFeed, type SignalFeedItem } from './feed'
import type { FailedIngestion, SignalStore, SuccessfulIngestion } from './store'

export type { FailedIngestion, SignalStore, SuccessfulIngestion }

export interface IngestionDependencies {
  fetchFeed(): Promise<string | string[]>
  store: SignalStore
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : 'Unknown ingestion error'
}

export async function ingestSignal(
  source: SignalSource,
  deps: IngestionDependencies,
  now = new Date()
) {
  const batchId = crypto.randomUUID()

  try {
    const feeds = await deps.fetchFeed()
    const candidates = [feeds].flat().flatMap((feed) =>
      parseSignalFeed(feed, source.name, {
        useUpdatedDate: source.section !== 'news',
        titleFromFirstStrong:
          'titleFromFirstStrong' in source ? source.titleFromFirstStrong : undefined,
        urlFromFirstAnchor: 'urlFromFirstAnchor' in source ? source.urlFromFirstAnchor : undefined,
        skillMetadata: 'skillMetadata' in source ? source.skillMetadata : undefined
      })
    )
    const merged = new Map<string, SignalFeedItem>()
    if ('feeds' in source) {
      for (const item of candidates) {
        const existing = merged.get(item.url)
        if (!existing || (item.contentHtml?.length ?? 0) > (existing.contentHtml?.length ?? 0)) {
          merged.set(item.url, { ...item, sourceKey: item.url })
        }
      }
    }
    const items = (
      'feeds' in source
        ? [...merged.values()].sort(
            (a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
          )
        : candidates
    )
      .slice(0, source.itemLimit)
      .map((item, index) => ({ ...item, position: index + 1 }))
    if (source.section === 'news') {
      const day = 24 * 60 * 60 * 1000
      const offset = 8 * 60 * 60 * 1000
      const midnight = new Date(Math.floor((now.getTime() + offset) / day) * day - offset)
      for (const item of items) item.publishedAt ??= midnight
    }
    const change = await deps.store.replaceRanking({
      batchId,
      startedAt: now,
      finishedAt: now,
      items
    })
    return {
      batchId,
      itemCount: items.length,
      changed: change?.changed ?? true,
      events: change?.events ?? [],
      ...(change?.skills ? { skills: change.skills } : {})
    }
  } catch (error) {
    await deps.store.recordFailure({
      batchId,
      startedAt: now,
      finishedAt: now,
      errorMessage: errorMessage(error)
    })
    throw error
  }
}
