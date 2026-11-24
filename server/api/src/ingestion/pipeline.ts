import { resolveSignalFeedUrls, type SignalSource } from '@rss-site/signals'
import type { Database } from '../db/client'
import { fetchSignalFeed } from './fetch'
import { ingestSignal } from './ingest'
import { type PublicationStatus, publishSourceUpdate } from './publish'
import { fetchStcnFeed } from './stcn'
import { DrizzleSignalStore } from './store'

// Feed URLs verified on rss1, with the primary instance as the fallback.
const secondaryRsshubUrls = new Map(
  [
    '/github/trending/weekly/any/zh',
    '/hackernews',
    '/juejin/trending/all/weekly',
    '/ithome/ranking/24h',
    '/36kr/hot-list/24',
    '/cloudflare/blog',
    '/nvidia/developer/zh-CN?limit=20',
    '/the-decoder/news?limit=60&filter_description=%5E%5Cs*%3C',
    '/arm/blog?limit=20',
    '/chrome/blog',
    '/news/xhsxw?limit=30',
    '/thepaper/sidebar/hotNews',
    '/jiemian/lists/71',
    '/openai/news?limit=20',
    '/openai/developers/blog?limit=20',
    '/anthropic/news?limit=20',
    '/deepseek/news',
    '/qwen/blog/zh-CN',
    '/google/antigravity/blog/zh-CN',
    '/groq/blog',
    '/cohere/blog?limit=20',
    '/elevenlabs/blog',
    '/together/blog',
    '/bilibili/popular/all',
    '/coolapk/hot',
    '/wallstreetcn/hot/day',
    '/jin10/topic/343',
    '/gcores/news?limit=20',
    '/indienova/article'
  ].map((path) => [`https://rss.ljhboard.cn${path}`, `https://rss1.ljhboard.cn${path}`])
)

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
  const feedUrls = resolveSignalFeedUrls(source, rsshubBaseUrl)
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
      store,
      async fetchItems(parseFeed) {
        if (source.id === 'stcn' && !options.fetchFeed) return parseFeed(await fetchStcnFeed())

        const fetchItemsFrom = async (url: string) => parseFeed(await fetcher(url))
        const feeds = await Promise.all(
          feedUrls.map((url) => {
            const secondaryUrl = secondaryRsshubUrls.get(url)
            return secondaryUrl
              ? fetchItemsFrom(secondaryUrl).catch(() => fetchItemsFrom(url))
              : fetchItemsFrom(url)
          })
        )
        return feeds.flat()
      }
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
