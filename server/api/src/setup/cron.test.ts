import { describe, expect, it } from 'vitest'
import { type CronRepository, normalizeIngestUrl, setupJuejinCron } from './cron.js'

describe('normalizeIngestUrl', () => {
  it('accepts an HTTPS origin and appends the ingestion path', () => {
    expect(normalizeIngestUrl('https://api.example.com/')).toBe(
      'https://api.example.com/cron/juejin'
    )
  })

  it('keeps a complete ingestion URL', () => {
    expect(normalizeIngestUrl('https://api.example.com/cron/juejin/')).toBe(
      'https://api.example.com/cron/juejin'
    )
  })

  it.each(['http://api.example.com', 'https://user:pass@example.com', 'not-a-url'])(
    'rejects an unsafe API address: %s',
    (value) => {
      expect(() => normalizeIngestUrl(value)).toThrow('有效的 HTTPS 地址')
    }
  )
})

describe('setupJuejinCron', () => {
  it('upserts Vault secrets, schedules the job, and verifies ingestion', async () => {
    const calls: string[] = []
    const repository: CronRepository = {
      installExtensions: async () => calls.push('extensions'),
      upsertSecret: async (name, value) => calls.push(`secret:${name}:${value}`),
      schedule: async (name, schedule) => calls.push(`schedule:${name}:${schedule}`)
    }

    const result = await setupJuejinCron({
      apiUrl: 'https://api.example.com',
      cronSecret: 'test-secret',
      repository,
      request: async (url, init) => {
        calls.push(`request:${url}:${new Headers(init?.headers).get('Authorization')}`)
        return Response.json({ batchId: 'batch-1', itemCount: 12 })
      }
    })

    expect(calls).toEqual([
      'extensions',
      'secret:juejin_ingest_url:https://api.example.com/cron/juejin',
      'secret:juejin_cron_secret:test-secret',
      'schedule:juejin-hot-feed-every-five-hours:0 */5 * * *',
      'request:https://api.example.com/cron/juejin:Bearer test-secret'
    ])
    expect(result).toEqual({ batchId: 'batch-1', itemCount: 12 })
  })

  it('reports when configuration succeeded but test ingestion failed', async () => {
    const repository: CronRepository = {
      installExtensions: async () => undefined,
      upsertSecret: async () => undefined,
      schedule: async () => undefined
    }

    await expect(
      setupJuejinCron({
        apiUrl: 'https://api.example.com',
        cronSecret: 'test-secret',
        repository,
        request: async () => new Response(null, { status: 502 })
      })
    ).rejects.toThrow('配置已保存，但测试采集失败（HTTP 502）')
  })
})
