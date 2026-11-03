import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { getCachedList, invalidateListCaches, listCacheKeys } from './list-cache'
import { withRedisCache } from './redis-cache'

// CI supplies an ephemeral Redis 7.4 service; local runs opt in with TEST_REDIS_URL.
describe.skipIf(!process.env.TEST_REDIS_URL)('list cache against real Redis', () => {
  const prefix = `integration:${randomUUID()}`
  const scopes: string[] = []
  const scope = () => {
    const key = `${prefix}:${scopes.length}`
    scopes.push(key)
    return key
  }
  const valid = (candidate: unknown): candidate is { items: string[] } =>
    !!candidate &&
    typeof candidate === 'object' &&
    'items' in candidate &&
    Array.isArray(candidate.items) &&
    candidate.items.every((item) => typeof item === 'string')

  beforeAll(async () => {
    vi.stubEnv('REDIS_URL', process.env.TEST_REDIS_URL as string)
    expect(await withRedisCache((redis) => redis.ping())).toBe('PONG')
  })
  afterAll(async () => {
    await withRedisCache(async (redis) => {
      if (scopes.length) await redis.del(...scopes.flatMap(listCacheKeys))
      redis.disconnect()
      return true
    })
    vi.unstubAllEnvs()
  })

  it('writes a real expiring JSON value and serves subsequent hits without a database load', async () => {
    const key = scope()
    const load = vi.fn(async () => ({ items: ['current'] }))
    await getCachedList(key, valid, load)
    expect(await getCachedList(key, valid, load)).toEqual({ items: ['current'] })
    expect(load).toHaveBeenCalledTimes(1)
    const ttl = await withRedisCache((redis) => redis.ttl(listCacheKeys(key)[1]))
    expect(ttl).toBeGreaterThanOrEqual(299)
    expect(ttl).toBeLessThanOrEqual(330)
  })

  it('rejects a prewarm result that arrives after invalidation without replacing the new list', async () => {
    const key = scope()
    let finish!: (value: { items: string[] }) => void
    const load = vi.fn(
      () =>
        new Promise<{ items: string[] }>((resolve) => {
          finish = resolve
        })
    )
    const slow = getCachedList(key, valid, load, true)
    const rejection = expect(slow).rejects.toThrow('not committed')
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    expect(await invalidateListCaches([key])).toBe(true)
    await getCachedList(key, valid, async () => ({ items: ['new'] }), true)
    finish({ items: ['old'] })
    await rejection
    expect(await getCachedList(key, valid, async () => ({ items: ['unexpected load'] }))).toEqual({
      items: ['new']
    })
  })

  it('does not serve orphaned data when the generation was evicted', async () => {
    const key = scope()
    await getCachedList(key, valid, async () => ({ items: ['orphaned'] }))
    await withRedisCache((redis) => redis.del(listCacheKeys(key)[0]))
    expect(await getCachedList(key, valid, async () => ({ items: ['fresh'] }))).toEqual({
      items: ['fresh']
    })
  })

  it('returns the new list to an old SSR request rather than rendering its stale query result', async () => {
    const key = scope()
    let finish!: (value: { items: string[] }) => void
    const load = vi.fn(
      () =>
        new Promise<{ items: string[] }>((resolve) => {
          finish = resolve
        })
    )
    const slow = getCachedList(key, valid, load)
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    await invalidateListCaches([key])
    await getCachedList(key, valid, async () => ({ items: ['new'] }), true)
    finish({ items: ['old'] })
    expect(await slow).toEqual({ items: ['new'] })
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('merges real concurrent misses and refills after expiration', async () => {
    const key = scope()
    const load = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
      return { items: [] }
    })
    await Promise.all(Array.from({ length: 5 }, () => getCachedList(key, valid, load)))
    expect(load).toHaveBeenCalledTimes(1)
    const dataKey = listCacheKeys(key)[1]
    expect(await withRedisCache((redis) => redis.ttl(dataKey))).toBeLessThanOrEqual(30)
    await withRedisCache((redis) => redis.pexpire(dataKey, 1))
    await new Promise((resolve) => setTimeout(resolve, 10))
    await getCachedList(key, valid, load)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('never caches failed loads and replaces corrupted values', async () => {
    const key = scope()
    await expect(
      getCachedList(key, valid, async () => {
        throw new Error('db failed')
      })
    ).rejects.toThrow('db failed')
    expect(await withRedisCache((redis) => redis.exists(listCacheKeys(key)[1]))).toBe(0)
    await withRedisCache((redis) => redis.set(listCacheKeys(key)[1], '{"items":false}'))
    expect(await getCachedList(key, valid, async () => ({ items: ['valid'] }))).toEqual({
      items: ['valid']
    })
  })
})
