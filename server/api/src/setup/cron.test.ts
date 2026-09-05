import { describe, expect, it } from 'vitest'
import {
  type CronRepository,
  normalizeIngestUrl,
  SIGNAL_CRON_JOBS,
  setupSignalCron
} from './cron.js'

describe('normalizeIngestUrl', () => {
  it.each([
    ['https://api.example.com/', 'https://api.example.com/cron/signals'],
    ['https://api.example.com/cron/juejin/', 'https://api.example.com/cron/signals'],
    ['https://api.example.com/cron/technology/', 'https://api.example.com/cron/signals'],
    ['https://api.example.com/cron/news/', 'https://api.example.com/cron/signals'],
    ['https://api.example.com/cron/ai/', 'https://api.example.com/cron/signals'],
    ['https://api.example.com/cron/signals/', 'https://api.example.com/cron/signals']
  ])('normalizes %s', (value, expected) => {
    expect(normalizeIngestUrl(value)).toBe(expected)
  })

  it.each(['http://api.example.com', 'https://user:pass@example.com', 'not-a-url'])(
    'rejects an unsafe API address: %s',
    (value) => {
      expect(() => normalizeIngestUrl(value)).toThrow('有效的 HTTPS 地址')
    }
  )
})

describe('setupSignalCron', () => {
  it('upserts shared secrets, staggers eighteen sources, retains history, and verifies Juejin', async () => {
    const calls: string[] = []
    const scheduledJobs: Array<{ name: string; schedule: string; command: string }> = []
    const repository: CronRepository = {
      installExtensions: async () => calls.push('extensions'),
      upsertSecret: async (name, value) => calls.push(`secret:${name}:${value}`),
      schedule: async (name, schedule, command) => {
        scheduledJobs.push({ name, schedule, command })
      }
    }

    const result = await setupSignalCron({
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
      'secret:signal_ingest_base_url:https://api.example.com/cron/signals',
      'secret:signal_cron_secret:test-secret',
      'request:https://api.example.com/cron/signals/juejin:Bearer test-secret'
    ])
    expect(scheduledJobs).toHaveLength(19)
    expect(scheduledJobs.slice(0, 18).map(({ name, schedule }) => ({ name, schedule }))).toEqual(
      SIGNAL_CRON_JOBS.map(({ name, schedule }) => ({ name, schedule }))
    )
    expect(scheduledJobs[0]?.command).toContain("'/github'")
    expect(scheduledJobs[5]?.command).toContain("'/36kr'")
    expect(scheduledJobs[6]?.command).toContain("'/xinhua'")
    expect(scheduledJobs[11]?.command).toContain("'/baidu'")
    expect(scheduledJobs[12]?.command).toContain("'/openai'")
    expect(scheduledJobs[17]?.command).toContain("'/qwen'")
    expect(scheduledJobs[18]).toMatchObject({
      name: 'ingestion-runs-retention-daily',
      schedule: '30 3 * * *'
    })
    expect(scheduledJobs[18]?.command).toContain("interval '30 days'")
    expect(result).toEqual({ batchId: 'batch-1', itemCount: 12 })
  })

  it('reports when configuration succeeded but test ingestion failed', async () => {
    const repository: CronRepository = {
      installExtensions: async () => undefined,
      upsertSecret: async () => undefined,
      schedule: async () => undefined
    }

    await expect(
      setupSignalCron({
        apiUrl: 'https://api.example.com',
        cronSecret: 'test-secret',
        repository,
        request: async () => new Response(null, { status: 502 })
      })
    ).rejects.toThrow('配置已保存，但测试采集失败（HTTP 502）')
  })
})
