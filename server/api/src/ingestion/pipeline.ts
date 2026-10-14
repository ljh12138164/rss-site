import { resolveSignalFeedUrl, type SignalSource } from '@rss-site/signals'
import type { Database } from '../db/client.js'
import { fetchSignalFeed } from './fetch.js'
import { ingestSignal } from './ingest.js'
import { type PublicationStatus, publishSourceUpdate } from './publish.js'
import { DrizzleSignalStore } from './store.js'

export interface IngestionPipelineOptions {
  db: Database
  rsshubBaseUrl: string
  webAppUrl?: string
  revalidateSecret?: string
  fetchFeed?: (url: string) => Promise<string>
  logger?: {
    info(message: string): void
    error(message: string): void
  }
}

export interface IngestionPipelineResult {
  source: string
  batchId: string
  itemCount: number
  changed: boolean
  events: string[]
  publication: PublicationStatus
}

export async function runIngestionPipeline(
  source: SignalSource,
  options: IngestionPipelineOptions,
  now = new Date()
): Promise<IngestionPipelineResult> {
  const rsshubBaseUrl = options.rsshubBaseUrl.replace(/\/$/, '')
  const feedUrl = resolveSignalFeedUrl(source, rsshubBaseUrl)
  const fetcher =
    options.fetchFeed ??
    ((url: string) =>
      fetchSignalFeed(url, {
        timeoutMs: source.section === 'skills' ? 90_000 : 30_000
      }))
  const store = new DrizzleSignalStore(options.db, source.id, source.section)

  const result = await ingestSignal(
    source,
    {
      fetchFeed: () => fetcher(feedUrl),
      store
    },
    now
  )

  const publication = await publishSourceUpdate(source, result, {
    webAppUrl: options.webAppUrl,
    revalidateSecret: options.revalidateSecret
  })

  const outcome: IngestionPipelineResult = {
    source: source.id,
    batchId: result.batchId,
    itemCount: result.itemCount,
    changed: result.changed,
    events: result.events,
    publication
  }

  const logMessage = JSON.stringify({
    source: source.id,
    batchId: result.batchId,
    itemCount: result.itemCount,
    changed: result.changed,
    publication
  })
  if (options.logger) {
    options.logger.info(logMessage)
  } else {
    console.info(logMessage)
  }

  return outcome
}
