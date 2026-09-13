import { describe, expect, it } from 'vitest'
import { getSignalSource, signalSources } from '../technology/sources.js'
import {
  type CronRepository,
  LEGACY_SIGNAL_CRON_JOB_NAMES,
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
    ['https://api.example.com/cron/finance/', 'https://api.example.com/cron/signals'],
    ['https://api.example.com/cron/games/', 'https://api.example.com/cron/signals'],
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
  it('verifies every source before replacing legacy jobs with thirty-seven staggered jobs', async () => {
    const calls: string[] = []
    const scheduledJobs: Array<{ name: string; schedule: string; command: string }> = []
    const repository: CronRepository = {
      installExtensions: async () => calls.push('extensions'),
      upsertSecret: async (name, value) => calls.push(`secret:${name}:${value}`),
      verifyIngestion: async ({ source, section, batchId, itemCount }) =>
        calls.push(`verify:${source}:${section}:${batchId}:${itemCount}`),
      unschedule: async (name) => calls.push(`unschedule:${name}`),
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

    expect(calls.slice(0, SIGNAL_CRON_JOBS.length * 2)).toEqual(
      SIGNAL_CRON_JOBS.flatMap(({ source }) => [
        `request:https://api.example.com/cron/signals/${source}:Bearer test-secret`,
        `verify:${source}:${getSignalSource(source).section}:batch-${source}:12`
      ])
    )
    const postVerificationOffset = SIGNAL_CRON_JOBS.length * 2
    expect(calls.slice(postVerificationOffset, postVerificationOffset + 3)).toEqual([
      'extensions',
      'secret:signal_ingest_base_url:https://api.example.com/cron/signals',
      'secret:signal_cron_secret:test-secret'
    ])
    expect(calls.slice(postVerificationOffset + 3)).toEqual(
      LEGACY_SIGNAL_CRON_JOB_NAMES.map((name) => `unschedule:${name}`)
    )
    expect(scheduledJobs).toHaveLength(38)
    expect(scheduledJobs.slice(0, 37).map(({ name, schedule }) => ({ name, schedule }))).toEqual(
      SIGNAL_CRON_JOBS.map(({ name, schedule }) => ({ name, schedule }))
    )
    expect(scheduledJobs[0]?.command).toContain("'/openai'")
    expect(scheduledJobs[5]?.command).toContain("'/qwen'")
    expect(scheduledJobs[6]?.command).toContain("'/chatgpt'")
    expect(scheduledJobs[7]?.command).toContain("'/github'")
    expect(scheduledJobs[11]?.command).toContain("'/36kr'")
    expect(scheduledJobs[12]?.command).toContain("'/xinhua'")
    expect(scheduledJobs[23]?.command).toContain("'/toutiao'")
    expect(scheduledJobs[24]?.command).toContain("'/wallstreetcn'")
    expect(scheduledJobs[28]?.command).toContain("'/stcn'")
    expect(scheduledJobs[29]?.command).toContain("'/3dmgame'")
    expect(scheduledJobs[34]?.command).toContain("'/github-blog'")
    expect(scheduledJobs[35]?.command).toContain("'/skills-all-time'")
    expect(scheduledJobs[36]?.command).toContain("'/skills-trending'")
    expect(scheduledJobs[37]).toMatchObject({
      name: 'ingestion-runs-retention-daily',
      schedule: '30 5 * * *'
    })
    expect(scheduledJobs[37]?.command).toContain("interval '180 days'")
    expect(scheduledJobs[37]?.command).toContain("interval '90 days'")
    expect(scheduledJobs[37]?.command).toContain('limit 1000')
    expect(scheduledJobs[37]?.command).toContain("interval '30 days'")
    expect(result).toEqual(
      SIGNAL_CRON_JOBS.map(({ source }) => ({
        source,
        batchId: `batch-${source}`,
        itemCount: 12
      }))
    )
  })

  it('keeps AI on two-hour windows and every auxiliary source on six-hour windows', () => {
    expect(SIGNAL_CRON_JOBS.slice(0, 7).every(({ schedule }) => schedule.includes('*/2'))).toBe(
      true
    )
    expect(
      SIGNAL_CRON_JOBS.slice(7).every(({ schedule }) =>
        /\d (?:0,6,12,18|1,7,13,19|2,8,14,20|3,9,15,21) \* \* \*/.test(schedule)
      )
    ).toBe(true)
    expect(new Set(SIGNAL_CRON_JOBS.map(({ name }) => name)).size).toBe(37)

    expect(SIGNAL_CRON_JOBS.map(({ source }) => source).sort()).toEqual(
      signalSources.map(({ id }) => id).sort()
    )

    const runMinutes = SIGNAL_CRON_JOBS.flatMap(({ schedule }) => {
      const [minuteValue, hourValue] = schedule.split(' ')
      const hours =
        hourValue === '*/2'
          ? Array.from({ length: 12 }, (_, index) => index * 2)
          : hourValue.split(',').map(Number)
      return hours.map((hour) => hour * 60 + Number(minuteValue))
    }).sort((left, right) => left - right)

    expect(runMinutes).toHaveLength(204)
    expect(new Set(runMinutes).size).toBe(runMinutes.length)
    expect(
      runMinutes.every((minute, index) => {
        const previous = runMinutes[index - 1]
        return previous === undefined || minute - previous >= 5
      })
    ).toBe(true)
  })

  it('does not schedule any jobs when a source fails cloud ingestion', async () => {
    const mutations: string[] = []
    const repository: CronRepository = {
      installExtensions: async () => mutations.push('extensions'),
      upsertSecret: async (name) => mutations.push(`secret:${name}`),
      verifyIngestion: async () => undefined,
      unschedule: async (name) => mutations.push(`unschedule:${name}`),
      schedule: async (name) => mutations.push(name)
    }

    await expect(
      setupSignalCron({
        apiUrl: 'https://api.example.com',
        cronSecret: 'test-secret',
        repository,
        request: async (url) =>
          String(url).endsWith('/openai')
            ? Response.json({ batchId: 'batch-openai', itemCount: 12 })
            : new Response(null, { status: 502 }),
        retryDelaysMs: []
      })
    ).rejects.toThrow('来源 anthropic 云端采集验证失败（HTTP 502），未更新 Cron')

    expect(mutations).toEqual([])
  })

  it('retries a transient ingestion response before continuing the production gate', async () => {
    const attempts = new Map<string, number>()
    const repository: CronRepository = {
      installExtensions: async () => undefined,
      upsertSecret: async () => undefined,
      verifyIngestion: async () => undefined,
      unschedule: async () => undefined,
      schedule: async () => undefined
    }

    const result = await setupSignalCron({
      apiUrl: 'https://api.example.com',
      cronSecret: 'test-secret',
      repository,
      retryDelaysMs: [0],
      request: async (url) => {
        const source = new URL(String(url)).pathname.split('/').at(-1) ?? ''
        const attempt = (attempts.get(source) ?? 0) + 1
        attempts.set(source, attempt)
        if (source === 'anthropic' && attempt === 1) return new Response(null, { status: 503 })
        return Response.json({ batchId: `batch-${source}`, itemCount: 12 })
      }
    })

    expect(attempts.get('openai')).toBe(1)
    expect(attempts.get('anthropic')).toBe(2)
    expect(result).toHaveLength(37)
  })

  it('does not schedule any jobs when a source writes zero items', async () => {
    const mutations: string[] = []
    const repository: CronRepository = {
      installExtensions: async () => mutations.push('extensions'),
      upsertSecret: async (name) => mutations.push(`secret:${name}`),
      verifyIngestion: async () => undefined,
      unschedule: async (name) => mutations.push(`unschedule:${name}`),
      schedule: async (name) => mutations.push(name)
    }

    await expect(
      setupSignalCron({
        apiUrl: 'https://api.example.com',
        cronSecret: 'test-secret',
        repository,
        request: async () => Response.json({ batchId: 'batch-empty', itemCount: 0 })
      })
    ).rejects.toThrow('来源 openai 未写入任何热点，未更新 Cron')

    expect(mutations).toEqual([])
  })

  it('does not schedule any jobs when cloud rows do not match the API batch', async () => {
    const mutations: string[] = []
    const repository: CronRepository = {
      installExtensions: async () => mutations.push('extensions'),
      upsertSecret: async (name) => mutations.push(`secret:${name}`),
      verifyIngestion: async ({ source }) => {
        if (source === 'bilibili') throw new Error('云端数据核验失败')
      },
      unschedule: async (name) => mutations.push(`unschedule:${name}`),
      schedule: async (name) => mutations.push(name)
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

    expect(mutations).toEqual([])
  })
})
