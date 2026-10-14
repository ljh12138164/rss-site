import {
  getSignalSource,
  SIGNAL_CRON_JOBS,
  type SignalSection,
  type SignalSourceId
} from '@rss-site/signals'

export { SIGNAL_CRON_JOBS }

export const LEGACY_SIGNAL_CRON_JOB_NAMES = [
  'github-hot-feed-every-five-hours',
  'hacker-news-hot-feed-every-five-hours',
  'juejin-hot-feed-every-five-hours',
  'v2ex-hot-feed-every-five-hours',
  'signal-ingest-v2ex',
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
  'toutiao-hot-feed-every-five-hours',
  'signal-ingest-10jqka',
  'signal-ingest-steam',
  'signal-ingest-skills-hot'
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
  timeout_milliseconds := ${getSignalSource(source).section === 'skills' ? 120000 : 45000}
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
  webUrl?: string
  revalidateSecret?: string
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
  webUrl,
  revalidateSecret,
  apiUrl,
  cronSecret,
  repository,
  request = fetch,
  retryDelaysMs = DEFAULT_TRANSIENT_RETRY_DELAYS_MS
}: SetupSignalCronOptions): Promise<SourceIngestionResult[]> {
  const ingestBaseUrl = normalizeIngestUrl(apiUrl)
  if (!cronSecret) throw new Error('CRON_SECRET 不能为空')
  if (Boolean(webUrl) !== Boolean(revalidateSecret))
    throw new Error('WEB_APP_URL 与 REVALIDATE_SECRET 必须同时配置')
  let webOrigin: string | undefined
  if (webUrl) {
    const parsed = new URL(webUrl)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password)
      throw new Error('WEB_APP_URL 无效')
    webOrigin = parsed.origin
  }

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
  if (webOrigin && revalidateSecret) {
    await repository.upsertSecret('signal_web_url', webOrigin)
    await repository.upsertSecret('signal_revalidate_secret', revalidateSecret)
  }

  for (const name of LEGACY_SIGNAL_CRON_JOB_NAMES) {
    await repository.unschedule(name)
  }
  for (const job of SIGNAL_CRON_JOBS) {
    await repository.schedule(job.name, job.schedule, createCronCommand(job.source))
  }
  await repository.schedule(RETENTION_JOB_NAME, RETENTION_SCHEDULE, RETENTION_COMMAND)

  return verifiedSources
}
