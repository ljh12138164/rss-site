import { getSignalSource, type SignalSection, type SignalSourceId } from '../technology/sources.js'

export const SIGNAL_CRON_JOBS: ReadonlyArray<{
  source: SignalSourceId
  name: string
  schedule: string
}> = [
  { source: 'openai', name: 'signal-ingest-openai', schedule: '0 */2 * * *' },
  { source: 'anthropic', name: 'signal-ingest-anthropic', schedule: '5 */2 * * *' },
  { source: 'deepseek', name: 'signal-ingest-deepseek', schedule: '10 */2 * * *' },
  { source: 'glm', name: 'signal-ingest-glm', schedule: '15 */2 * * *' },
  { source: 'google-ai', name: 'signal-ingest-google-ai', schedule: '20 */2 * * *' },
  { source: 'qwen', name: 'signal-ingest-qwen', schedule: '25 */2 * * *' },
  { source: 'github', name: 'signal-ingest-github', schedule: '30 0,6,12,18 * * *' },
  { source: 'hacker-news', name: 'signal-ingest-hacker-news', schedule: '35 0,6,12,18 * * *' },
  { source: 'juejin', name: 'signal-ingest-juejin', schedule: '40 0,6,12,18 * * *' },
  { source: 'v2ex', name: 'signal-ingest-v2ex', schedule: '45 0,6,12,18 * * *' },
  { source: 'ithome', name: 'signal-ingest-ithome', schedule: '50 0,6,12,18 * * *' },
  { source: '36kr', name: 'signal-ingest-36kr', schedule: '55 0,6,12,18 * * *' },
  { source: 'xinhua', name: 'signal-ingest-xinhua', schedule: '0 1,7,13,19 * * *' },
  { source: 'cctv', name: 'signal-ingest-cctv', schedule: '5 1,7,13,19 * * *' },
  { source: 'chinanews', name: 'signal-ingest-chinanews', schedule: '10 1,7,13,19 * * *' },
  { source: 'thepaper', name: 'signal-ingest-thepaper', schedule: '15 1,7,13,19 * * *' },
  { source: 'jiemian', name: 'signal-ingest-jiemian', schedule: '20 1,7,13,19 * * *' },
  { source: 'baidu', name: 'signal-ingest-baidu', schedule: '25 1,7,13,19 * * *' },
  { source: 'bilibili', name: 'signal-ingest-bilibili', schedule: '30 1,7,13,19 * * *' },
  { source: 'zhihu', name: 'signal-ingest-zhihu', schedule: '35 1,7,13,19 * * *' },
  { source: 'coolapk', name: 'signal-ingest-coolapk', schedule: '40 1,7,13,19 * * *' },
  { source: 'hupu', name: 'signal-ingest-hupu', schedule: '45 1,7,13,19 * * *' },
  { source: 'sspai', name: 'signal-ingest-sspai', schedule: '50 1,7,13,19 * * *' },
  { source: 'toutiao', name: 'signal-ingest-toutiao', schedule: '55 1,7,13,19 * * *' },
  { source: 'wallstreetcn', name: 'signal-ingest-wallstreetcn', schedule: '30 2,8,14,20 * * *' },
  { source: 'cls', name: 'signal-ingest-cls', schedule: '35 2,8,14,20 * * *' },
  { source: 'jin10', name: 'signal-ingest-jin10', schedule: '40 2,8,14,20 * * *' },
  { source: 'yicai', name: 'signal-ingest-yicai', schedule: '45 2,8,14,20 * * *' },
  { source: 'stcn', name: 'signal-ingest-stcn', schedule: '50 2,8,14,20 * * *' },
  { source: '10jqka', name: 'signal-ingest-10jqka', schedule: '55 2,8,14,20 * * *' },
  { source: '3dmgame', name: 'signal-ingest-3dmgame', schedule: '0 3,9,15,21 * * *' },
  { source: 'gcores', name: 'signal-ingest-gcores', schedule: '5 3,9,15,21 * * *' },
  { source: 'gamersky', name: 'signal-ingest-gamersky', schedule: '10 3,9,15,21 * * *' },
  { source: 'ali213', name: 'signal-ingest-ali213', schedule: '15 3,9,15,21 * * *' },
  { source: 'indienova', name: 'signal-ingest-indienova', schedule: '20 3,9,15,21 * * *' },
  { source: 'steam', name: 'signal-ingest-steam', schedule: '25 3,9,15,21 * * *' }
]

export const LEGACY_SIGNAL_CRON_JOB_NAMES = [
  'github-hot-feed-every-five-hours',
  'hacker-news-hot-feed-every-five-hours',
  'juejin-hot-feed-every-five-hours',
  'v2ex-hot-feed-every-five-hours',
  'ithome-hot-feed-every-five-hours',
  '36kr-hot-feed-every-five-hours',
  'xinhua-news-feed-every-five-hours',
  'cctv-news-feed-every-five-hours',
  'chinanews-feed-every-five-hours',
  'thepaper-hot-feed-every-five-hours',
  'jiemian-news-feed-every-five-hours',
  'baidu-hot-feed-every-five-hours',
  'openai-news-feed-every-five-hours',
  'anthropic-news-feed-every-five-hours',
  'deepseek-news-feed-every-five-hours',
  'glm-release-feed-every-five-hours',
  'google-ai-feed-every-five-hours',
  'qwen-blog-feed-every-five-hours',
  'bilibili-popular-feed-every-five-hours',
  'zhihu-hot-feed-every-five-hours',
  'coolapk-hot-feed-every-five-hours',
  'hupu-topic-feed-every-five-hours',
  'sspai-matrix-feed-every-five-hours',
  'toutiao-hot-feed-every-five-hours'
] as const

export const RETENTION_JOB_NAME = 'ingestion-runs-retention-daily'
export const RETENTION_SCHEDULE = '30 5 * * *'

export function createCronCommand(source: SignalSourceId): string {
  return `
select net.http_post(
  url := (
    select rtrim(decrypted_secret, '/')
    from vault.decrypted_secrets
    where name = 'signal_ingest_base_url'
  ) || '/${source}',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'signal_cron_secret'
    ),
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object('scheduled_at', now(), 'source', '${source}'),
  timeout_milliseconds := 45000
) as request_id;
`.trim()
}

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
`.trim()

export interface CronRepository {
  installExtensions(): Promise<unknown>
  upsertSecret(name: string, value: string): Promise<unknown>
  verifyIngestion(input: {
    source: SignalSourceId
    section: SignalSection
    batchId: string
    itemCount: number
  }): Promise<unknown>
  unschedule(name: string): Promise<unknown>
  schedule(name: string, schedule: string, command: string): Promise<unknown>
}

interface SetupSignalCronOptions {
  apiUrl: string
  cronSecret: string
  repository: CronRepository
  request?: typeof fetch
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
    'itemCount' in value &&
    typeof value.itemCount === 'number'
  ) {
    return { batchId: value.batchId, itemCount: value.itemCount }
  }

  throw new Error('配置已保存，但测试采集返回了无法识别的响应')
}

export async function setupSignalCron({
  apiUrl,
  cronSecret,
  repository,
  request = fetch,
  retryDelaysMs = DEFAULT_TRANSIENT_RETRY_DELAYS_MS
}: SetupSignalCronOptions): Promise<SourceIngestionResult[]> {
  const ingestBaseUrl = normalizeIngestUrl(apiUrl)
  if (!cronSecret) throw new Error('CRON_SECRET 不能为空')

  const verifiedSources: SourceIngestionResult[] = []
  for (const { source } of SIGNAL_CRON_JOBS) {
    const response = await requestWithTransientRetries(
      request,
      `${ingestBaseUrl}/${source}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: 'setup:cron' })
      },
      retryDelaysMs
    )

    if (!response.ok) {
      throw new Error(`来源 ${source} 云端采集验证失败（HTTP ${response.status}），未更新 Cron`)
    }

    const result = parseIngestionResult(await response.json())
    if (result.itemCount < 1) {
      throw new Error(`来源 ${source} 未写入任何热点，未更新 Cron`)
    }
    await repository.verifyIngestion({
      source,
      section: getSignalSource(source).section,
      batchId: result.batchId,
      itemCount: result.itemCount
    })
    verifiedSources.push({ source, ...result })
  }

  await repository.installExtensions()
  await repository.upsertSecret('signal_ingest_base_url', ingestBaseUrl)
  await repository.upsertSecret('signal_cron_secret', cronSecret)

  for (const name of LEGACY_SIGNAL_CRON_JOB_NAMES) {
    await repository.unschedule(name)
  }
  for (const job of SIGNAL_CRON_JOBS) {
    await repository.schedule(job.name, job.schedule, createCronCommand(job.source))
  }
  await repository.schedule(RETENTION_JOB_NAME, RETENTION_SCHEDULE, RETENTION_COMMAND)

  return verifiedSources
}
