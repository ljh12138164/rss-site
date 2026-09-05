import { describe, expect, it } from 'vitest'
import { getSignalSource } from '../technology/sources.js'
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
    ['https://api.example.com/cron/social/', 'https://api.example.com/cron/signals'],
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
  it('verifies every source before scheduling the twenty-four staggered jobs', async () => {
    const calls: string[] = []
    const scheduledJobs: Array<{ name: string; schedule: string; command: string }> = []
    const repository: CronRepository = {
      installExtensions: async () => calls.push('extensions'),
      upsertSecret: async (name, value) => calls.push(`secret:${name}:${value}`),
      verifyIngestion: async ({ source, section, batchId, itemCount }) =>
        calls.push(`verify:${source}:${section}:${batchId}:${itemCount}`),
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
        const source = new URL(String(url)).pathname.split('/').at(-1)
        return Response.json({ batchId: `batch-${source}`, itemCount: 12 })
      }
    })

    expect(calls.slice(0, 3)).toEqual([
      'extensions',
      'secret:signal_ingest_base_url:https://api.example.com/cron/signals',
      'secret:signal_cron_secret:test-secret'
    ])
    expect(calls.slice(3)).toEqual(
      SIGNAL_CRON_JOBS.flatMap(({ source }) => [
        `request:https://api.example.com/cron/signals/${source}:Bearer test-secret`,
        `verify:${source}:${getSignalSource(source).section}:batch-${source}:12`
      ])
    )
    expect(scheduledJobs).toHaveLength(25)
    expect(scheduledJobs.slice(0, 24).map(({ name, schedule }) => ({ name, schedule }))).toEqual(
      SIGNAL_CRON_JOBS.map(({ name, schedule }) => ({ name, schedule }))
    )
    expect(scheduledJobs[0]?.command).toContain("'/github'")
    expect(scheduledJobs[5]?.command).toContain("'/36kr'")
    expect(scheduledJobs[6]?.command).toContain("'/xinhua'")
    expect(scheduledJobs[11]?.command).toContain("'/baidu'")
    expect(scheduledJobs[12]?.command).toContain("'/openai'")
    expect(scheduledJobs[17]?.command).toContain("'/qwen'")
    expect(scheduledJobs[18]?.command).toContain("'/bilibili'")
    expect(scheduledJobs[23]?.command).toContain("'/toutiao'")
    expect(scheduledJobs[24]).toMatchObject({
      name: 'ingestion-runs-retention-daily',
      schedule: '30 3 * * *'
    })
    expect(scheduledJobs[24]?.command).toContain("interval '30 days'")
    expect(result).toEqual(
      SIGNAL_CRON_JOBS.map(({ source }) => ({
        source,
        batchId: `batch-${source}`,
        itemCount: 12
      }))
    )
  })

  it('does not schedule any jobs when a source fails cloud ingestion', async () => {
    const scheduledJobs: string[] = []
    const repository: CronRepository = {
      installExtensions: async () => undefined,
      upsertSecret: async () => undefined,
      verifyIngestion: async () => undefined,
      schedule: async (name) => scheduledJobs.push(name)
    }

    await expect(
      setupSignalCron({
        apiUrl: 'https://api.example.com',
        cronSecret: 'test-secret',
        repository,
        request: async (url) =>
          String(url).endsWith('/github')
            ? Response.json({ batchId: 'batch-github', itemCount: 12 })
            : new Response(null, { status: 502 })
      })
    ).rejects.toThrow('来源 hacker-news 云端采集验证失败（HTTP 502），未更新 Cron')

    expect(scheduledJobs).toEqual([])
  })

  it('does not schedule any jobs when a source writes zero items', async () => {
    const scheduledJobs: string[] = []
    const repository: CronRepository = {
      installExtensions: async () => undefined,
      upsertSecret: async () => undefined,
      verifyIngestion: async () => undefined,
      schedule: async (name) => scheduledJobs.push(name)
    }

    await expect(
      setupSignalCron({
        apiUrl: 'https://api.example.com',
        cronSecret: 'test-secret',
        repository,
        request: async () => Response.json({ batchId: 'batch-empty', itemCount: 0 })
      })
    ).rejects.toThrow('来源 github 未写入任何热点，未更新 Cron')

    expect(scheduledJobs).toEqual([])
  })

  it('does not schedule any jobs when cloud rows do not match the API batch', async () => {
    const scheduledJobs: string[] = []
    const repository: CronRepository = {
      installExtensions: async () => undefined,
      upsertSecret: async () => undefined,
      verifyIngestion: async ({ source }) => {
        if (source === 'bilibili') throw new Error('云端数据核验失败')
      },
      schedule: async (name) => scheduledJobs.push(name)
    }

    await expect(
      setupSignalCron({
        apiUrl: 'https://api.example.com',
        cronSecret: 'test-secret',
        repository,
        request: async (url) => {
          const source = new URL(String(url)).pathname.split('/').at(-1)
          return Response.json({ batchId: `batch-${source}`, itemCount: 12 })
        }
      })
    ).rejects.toThrow('云端数据核验失败')

    expect(scheduledJobs).toEqual([])
  })
})
