import type { JuejinFeedItem } from './feed'
import { parseJuejinFeed } from './feed'

export interface SuccessfulIngestion {
  batchId: string
  startedAt: Date
  finishedAt: Date
  items: JuejinFeedItem[]
}

export interface FailedIngestion {
  batchId: string
  startedAt: Date
  finishedAt: Date
  errorMessage: string
}

export interface JuejinStore {
  replaceRanking(input: SuccessfulIngestion): Promise<void>
  recordFailure(input: FailedIngestion): Promise<void>
}

interface IngestionDependencies {
  fetchFeed(): Promise<string>
  store: JuejinStore
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 500)
  return 'Unknown ingestion error'
}

export async function ingestJuejin(deps: IngestionDependencies, now = new Date()) {
  const batchId = crypto.randomUUID()

  try {
    const xml = await deps.fetchFeed()
    const items = parseJuejinFeed(xml)
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
