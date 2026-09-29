import type { SignalSource } from '@rss-site/signals'
import { parseSignalFeed } from './feed.js'
import type { FailedIngestion, SignalStore, SuccessfulIngestion } from './store.js'

export type { FailedIngestion, SignalStore, SuccessfulIngestion }

export interface IngestionDependencies {
  fetchFeed(): Promise<string>
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
    const items = parseSignalFeed(await deps.fetchFeed(), source.name, {
      titleFromFirstStrong:
        'titleFromFirstStrong' in source ? source.titleFromFirstStrong : undefined,
      urlFromFirstAnchor: 'urlFromFirstAnchor' in source ? source.urlFromFirstAnchor : undefined,
      skillMetadata: 'skillMetadata' in source ? source.skillMetadata : undefined
    }).slice(0, source.itemLimit)
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
      events: change?.events ?? []
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
