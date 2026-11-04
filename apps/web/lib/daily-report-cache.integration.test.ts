import { randomUUID } from 'node:crypto'
import { Redis } from 'ioredis'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  DAILY_CACHE_GENERATION_KEY,
  dailyCacheKey,
  getCachedDailyData,
  invalidateDailyReportCache
} from './daily-report-cache'

const connection = vi.hoisted(() => ({
  client: undefined as Redis | undefined,
  prefix: '',
  keys: new Set<string>()
}))
// Execute the production Lua unchanged, with every key isolated from other suites/data.
vi.mock('./redis-cache', () => ({
  withRedisCache: async (
    operation: (redis: {
      eval: (
        script: string,
        count: number,
        ...args: (string | number | Buffer)[]
      ) => Promise<unknown>
      set: (name: string, value: string) => Promise<unknown>
    }) => Promise<unknown>
  ) => {
    const redis = connection.client
    if (!redis) return null
    const key = (value: string | number | Buffer) => {
      const namespaced = connection.prefix + value
      connection.keys.add(namespaced)
      return namespaced
    }
    return operation({
      eval: (script, count, ...args) =>
        redis.eval(
          script,
          count,
          ...args.map((value, index) => (index < count ? key(value) : value))
        ),
      set: (name, value) => redis.set(key(name), value)
    })
  }
}))

describe.skipIf(!process.env.TEST_REDIS_URL)('daily cache against real Redis', () => {
  const parse = (value: unknown): string | null => {
    if (value !== null && typeof value !== 'string') throw new Error('Invalid data')
    return value
  }
  beforeAll(async () => {
    vi.stubEnv('REDIS_URL', process.env.TEST_REDIS_URL as string)
    connection.prefix = `daily-integration:${randomUUID()}:`
    connection.client = new Redis(process.env.TEST_REDIS_URL as string, { maxRetriesPerRequest: 0 })
    expect(await connection.client.ping()).toBe('PONG')
  })
  afterAll(async () => {
    if (connection.keys.size) await connection.client?.del(...connection.keys)
    connection.client?.disconnect()
    vi.unstubAllEnvs()
  })

  it('uses expiring data keys and shares validated Redis hits without another database call', async () => {
    const load = vi.fn(async () => 'report')
    await getCachedDailyData('report:latest', parse, load)
    expect(await getCachedDailyData('report:latest', parse, load)).toBe('report')
    expect(load).toHaveBeenCalledOnce()
    const ttl = await connection.client?.ttl(connection.prefix + dailyCacheKey('report:latest'))
    expect(ttl).toBeGreaterThan(290)
    expect(ttl).toBeLessThanOrEqual(300)
    expect(await connection.client?.ttl(connection.prefix + DAILY_CACHE_GENERATION_KEY)).toBe(-1)
  })

  it('refreshes latest, detail, archive and cached absence after one publication', async () => {
    const keys = ['report:latest', 'report:2026-11-04', 'archive:2026-11-04', 'report:2026-11-05']
    for (const key of keys) await getCachedDailyData(key, parse, async () => null)
    expect(await invalidateDailyReportCache()).toBe(true)
    for (const key of keys)
      expect(await getCachedDailyData(key, parse, async () => 'published')).toBe('published')
  })

  it('rejects a late write atomically and reloads the new publication', async () => {
    let finish!: (value: string) => void
    const load = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          })
      )
      .mockResolvedValue('fresh')
    const pending = getCachedDailyData('race', parse, load)
    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce())
    await invalidateDailyReportCache()
    finish('stale')
    expect(await pending).toBe('fresh')
    expect(await getCachedDailyData('race', parse, load)).toBe('fresh')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('refills expired entries and orphaned generations without reusing old data', async () => {
    await getCachedDailyData('expiry', parse, async () => 'old')
    await connection.client?.pexpire(connection.prefix + dailyCacheKey('expiry'), 1)
    await vi.waitFor(async () =>
      expect(await connection.client?.exists(connection.prefix + dailyCacheKey('expiry'))).toBe(0)
    )
    expect(await getCachedDailyData('expiry', parse, async () => 'new')).toBe('new')
    await connection.client?.del(connection.prefix + DAILY_CACHE_GENERATION_KEY)
    expect(await getCachedDailyData('expiry', parse, async () => 'regenerated')).toBe('regenerated')
  })
})
