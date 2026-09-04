export const CRON_JOB_NAME = 'juejin-hot-feed-every-five-hours'
export const CRON_SCHEDULE = '0 */5 * * *'

export const CRON_COMMAND = `
select net.http_post(
  url := (
    select decrypted_secret
    from vault.decrypted_secrets
    where name = 'juejin_ingest_url'
  ),
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'juejin_cron_secret'
    ),
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object('scheduled_at', now()),
  timeout_milliseconds := 30000
) as request_id;
`.trim()

export interface CronRepository {
  installExtensions(): Promise<unknown>
  upsertSecret(name: string, value: string): Promise<unknown>
  schedule(name: string, schedule: string, command: string): Promise<unknown>
}

interface SetupJuejinCronOptions {
  apiUrl: string
  cronSecret: string
  repository: CronRepository
  request?: typeof fetch
}

interface IngestionResult {
  batchId: string
  itemCount: number
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
      (path && path !== '/cron/juejin')
    ) {
      throw new Error()
    }

    url.pathname = '/cron/juejin'
    return url.toString()
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

export async function setupJuejinCron({
  apiUrl,
  cronSecret,
  repository,
  request = fetch
}: SetupJuejinCronOptions): Promise<IngestionResult> {
  const ingestUrl = normalizeIngestUrl(apiUrl)
  if (!cronSecret) throw new Error('CRON_SECRET 不能为空')

  await repository.installExtensions()
  await repository.upsertSecret('juejin_ingest_url', ingestUrl)
  await repository.upsertSecret('juejin_cron_secret', cronSecret)
  await repository.schedule(CRON_JOB_NAME, CRON_SCHEDULE, CRON_COMMAND)

  const response = await request(ingestUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ source: 'setup:cron' })
  })

  if (!response.ok) {
    throw new Error(`配置已保存，但测试采集失败（HTTP ${response.status}）`)
  }

  return parseIngestionResult(await response.json())
}
