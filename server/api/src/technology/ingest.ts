import { parseTechnologyFeed, type TechnologyFeedItem } from './feed.js'
import type { SignalSource } from './sources.js'

export interface SuccessfulIngestion {
  batchId: string
  startedAt: Date
  finishedAt: Date
  items: TechnologyFeedItem[]
}

export interface FailedIngestion {
  batchId: string
  startedAt: Date
  finishedAt: Date
  errorMessage: string
}

export interface SignalStore {
  replaceRanking(input: SuccessfulIngestion): Promise<void>
  recordFailure(input: FailedIngestion): Promise<void>
}

interface IngestionDependencies {
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
    const items = parseTechnologyFeed(await deps.fetchFeed(), source.name).slice(
      0,
      source.itemLimit
    )
    await deps.store.replaceRanking({ batchId, startedAt: now, finishedAt: now, items })
    return { batchId, itemCount: items.length }
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
