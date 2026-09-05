import type { SignalSourceId } from '../technology/sources.js'

export const SIGNAL_CRON_JOBS: ReadonlyArray<{
  source: SignalSourceId
  name: string
  schedule: string
}> = [
  { source: 'github', name: 'github-hot-feed-every-five-hours', schedule: '0 0,5,10,15,20 * * *' },
  {
    source: 'hacker-news',
    name: 'hacker-news-hot-feed-every-five-hours',
    schedule: '10 0,5,10,15,20 * * *'
  },
  { source: 'juejin', name: 'juejin-hot-feed-every-five-hours', schedule: '20 0,5,10,15,20 * * *' },
  { source: 'v2ex', name: 'v2ex-hot-feed-every-five-hours', schedule: '30 0,5,10,15,20 * * *' },
  { source: 'ithome', name: 'ithome-hot-feed-every-five-hours', schedule: '40 0,5,10,15,20 * * *' },
  { source: '36kr', name: '36kr-hot-feed-every-five-hours', schedule: '50 0,5,10,15,20 * * *' },
  { source: 'xinhua', name: 'xinhua-news-feed-every-five-hours', schedule: '0 1,6,11,16,21 * * *' },
  { source: 'cctv', name: 'cctv-news-feed-every-five-hours', schedule: '10 1,6,11,16,21 * * *' },
  {
    source: 'chinanews',
    name: 'chinanews-feed-every-five-hours',
    schedule: '20 1,6,11,16,21 * * *'
  },
  {
    source: 'thepaper',
    name: 'thepaper-hot-feed-every-five-hours',
    schedule: '30 1,6,11,16,21 * * *'
  },
  {
    source: 'jiemian',
    name: 'jiemian-news-feed-every-five-hours',
    schedule: '40 1,6,11,16,21 * * *'
  },
  { source: 'baidu', name: 'baidu-hot-feed-every-five-hours', schedule: '50 1,6,11,16,21 * * *' },
  { source: 'openai', name: 'openai-news-feed-every-five-hours', schedule: '0 2,7,12,17,22 * * *' },
  {
    source: 'anthropic',
    name: 'anthropic-news-feed-every-five-hours',
    schedule: '10 2,7,12,17,22 * * *'
  },
  {
    source: 'deepseek',
    name: 'deepseek-news-feed-every-five-hours',
    schedule: '20 2,7,12,17,22 * * *'
  },
  { source: 'glm', name: 'glm-release-feed-every-five-hours', schedule: '30 2,7,12,17,22 * * *' },
  {
    source: 'google-ai',
    name: 'google-ai-feed-every-five-hours',
    schedule: '40 2,7,12,17,22 * * *'
  },
  { source: 'qwen', name: 'qwen-blog-feed-every-five-hours', schedule: '50 2,7,12,17,22 * * *' }
]

export const RETENTION_JOB_NAME = 'ingestion-runs-retention-daily'
export const RETENTION_SCHEDULE = '30 3 * * *'

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
  schedule(name: string, schedule: string, command: string): Promise<unknown>
}

interface SetupSignalCronOptions {
  apiUrl: string
  cronSecret: string
  repository: CronRepository
  request?: typeof fetch
}

interface IngestionResult {
  batchId: string
  itemCount: number
}

export interface SourceIngestionResult extends IngestionResult {
  source: SignalSourceId
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
      !['', '/cron/juejin', '/cron/technology', '/cron/news', '/cron/ai', '/cron/signals'].includes(
        path
      )
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
  request = fetch
}: SetupSignalCronOptions): Promise<SourceIngestionResult[]> {
  const ingestBaseUrl = normalizeIngestUrl(apiUrl)
  if (!cronSecret) throw new Error('CRON_SECRET 不能为空')

  await repository.installExtensions()
  await repository.upsertSecret('signal_ingest_base_url', ingestBaseUrl)
  await repository.upsertSecret('signal_cron_secret', cronSecret)

  const verifiedSources: SourceIngestionResult[] = []
  for (const { source } of SIGNAL_CRON_JOBS) {
    const response = await request(`${ingestBaseUrl}/${source}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ source: 'setup:cron' })
    })

    if (!response.ok) {
      throw new Error(`来源 ${source} 云端采集验证失败（HTTP ${response.status}），未更新 Cron`)
    }

    const result = parseIngestionResult(await response.json())
    if (result.itemCount < 1) {
      throw new Error(`来源 ${source} 未写入任何热点，未更新 Cron`)
    }
    verifiedSources.push({ source, ...result })
  }

  for (const job of SIGNAL_CRON_JOBS) {
    await repository.schedule(job.name, job.schedule, createCronCommand(job.source))
  }
  await repository.schedule(RETENTION_JOB_NAME, RETENTION_SCHEDULE, RETENTION_COMMAND)

  return verifiedSources
}
