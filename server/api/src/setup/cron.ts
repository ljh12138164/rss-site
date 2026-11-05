import {
  getSignalSource,
  SIGNAL_CRON_JOBS,
  type SignalSection,
  type SignalSourceId
} from '@rss-site/signals'

export { SIGNAL_CRON_JOBS }

export const RETENTION_COMMAND = `
with expired_articles as (
  select article.id
  from public.signal_articles as article
  where article.is_pinned = false
    and article.last_seen_at < now() - case
      when article.section = 'ai' then interval '180 days'
      else interval '90 days'
    end
    and not exists (
      select 1
      from public.hot_items as item
      where item.article_id = article.id
    )
    and not exists (
      select 1
      from public.ai_event_articles as event_article
      where event_article.article_id = article.id
    )
  order by article.last_seen_at
  limit 1000
)
delete from public.signal_articles as article
using expired_articles
where article.id = expired_articles.id;

delete from public.ingestion_runs as run
where run.started_at < now() - interval '30 days'
  and not exists (
    select 1
    from public.hot_items as item
    where item.batch_id = run.id
  )
  and not exists (
    select 1
    from public.source_status as source_state
    where source_state.last_batch_id = run.id
  );

delete from public.ai_models as model
where model.last_seen_at < now() - interval '90 days';
`.trim()

export interface CronRepository {
  verifyIngestion(input: {
    source: SignalSourceId
    section: SignalSection
    batchId: string
    itemCount: number
  }): Promise<unknown>
}

interface SetupSignalCronOptions {
  apiUrl: string
  cronSecret: string
  repository: CronRepository
  request?: typeof fetch
  sources?: readonly SignalSourceId[]
  retryDelaysMs?: readonly number[]
}

interface IngestionResult {
  batchId: string
  itemCount: number
}

export interface SourceIngestionResult extends IngestionResult {
  source: SignalSourceId
}

const DEFAULT_TRANSIENT_RETRY_DELAYS_MS = [1000, 3000] as const
const TRANSIENT_INGESTION_STATUSES = new Set([502, 503, 504])

async function requestWithTransientRetries(
  request: typeof fetch,
  url: string,
  init: RequestInit,
  retryDelaysMs: readonly number[]
): Promise<Response> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await request(url, init)
      const delay = retryDelaysMs[attempt]
      if (!TRANSIENT_INGESTION_STATUSES.has(response.status) || delay === undefined) {
        return response
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
    } catch (error) {
      const delay = retryDelaysMs[attempt]
      if (delay === undefined) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

export function normalizeIngestUrl(value: string): string {
  try {
    const url = new URL(value.trim())
    const path = url.pathname.replace(/\/+$/, '')

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      ![
        '',
        '/cron/juejin',
        '/cron/technology',
        '/cron/news',
        '/cron/ai',
        '/cron/social',
        '/cron/finance',
        '/cron/games',
        '/cron/signals'
      ].includes(path)
    ) {
      throw new Error()
    }

    url.pathname = '/cron/signals'
    return url.toString().replace(/\/$/, '')
  } catch {
    throw new Error('API 地址必须是有效的 HTTPS 地址，例如 https://api.example.com')
  }
}

function parseIngestionResult(value: unknown): IngestionResult {
  if (
    typeof value === 'object' &&
    value !== null &&
    'batchId' in value &&
    typeof value.batchId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.batchId) &&
    'itemCount' in value &&
    typeof value.itemCount === 'number' &&
    Number.isInteger(value.itemCount)
  ) {
    return { batchId: value.batchId, itemCount: value.itemCount }
  }

  throw new Error('采集返回了无法识别的响应，未生成调度验收证据')
}

export async function setupSignalCron({
  apiUrl,
  cronSecret,
  repository,
  request = fetch,
  sources = SIGNAL_CRON_JOBS.map((job) => job.source),
  retryDelaysMs = DEFAULT_TRANSIENT_RETRY_DELAYS_MS
}: SetupSignalCronOptions): Promise<SourceIngestionResult[]> {
  const ingestBaseUrl = normalizeIngestUrl(apiUrl)
  if (!cronSecret) throw new Error('CRON_SECRET 不能为空')
  if (!sources.length || new Set(sources).size !== sources.length)
    throw new Error('Invalid configured sources')
  for (const source of sources) getSignalSource(source)

  const verifiedSources: SourceIngestionResult[] = []
  for (const source of sources) {
    const response = await requestWithTransientRetries(
      request,
      `${ingestBaseUrl}/${source}`,
      {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(180_000),
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: 'setup:cron' })
      },
      retryDelaysMs
    )

    if (!response.ok) {
      throw new Error(
        `来源 ${source} 生产采集验证失败（HTTP ${response.status}），未生成调度验收证据`
      )
    }

    const result = parseIngestionResult(await response.json())
    if (result.itemCount < 1) {
      throw new Error(`来源 ${source} 未写入任何热点，未生成调度验收证据`)
    }
    await repository.verifyIngestion({
      source,
      section: getSignalSource(source).section,
      batchId: result.batchId,
      itemCount: result.itemCount
    })
    verifiedSources.push({ source, ...result })
  }

  // Emit evidence only after the caller has verified every configured source.
  // ECS owns scheduling; no Supabase extensions, Vault, or Cron writes occur here.
  return verifiedSources
}
