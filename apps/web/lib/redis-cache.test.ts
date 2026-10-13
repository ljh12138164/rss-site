import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createResultCacheKey, readResultCache, writeResultCache } from './redis-cache'

const redis = vi.hoisted(() => ({
  status: 'ready',
  connect: vi.fn(async () => undefined),
  disconnect: vi.fn(),
  on: vi.fn(),
  get: vi.fn(),
  set: vi.fn()
}))

vi.mock('ioredis', () => ({
  Redis: class {
    status = redis.status
    connect = redis.connect
    disconnect = redis.disconnect
    on = redis.on
    get = redis.get
    set = redis.set
  }
}))

const isResult = (value: unknown): value is { title: string } =>
  typeof value === 'object' && value !== null && 'title' in value && typeof value.title === 'string'

beforeEach(() => {
  vi.stubEnv('REDIS_URL', 'redis://localhost:6379')
  redis.get.mockReset()
  redis.set.mockReset()
})

afterEach(() => vi.unstubAllEnvs())

describe('Redis result cache', () => {
  it('returns validated cached JSON', async () => {
    redis.get.mockResolvedValue('{"title":"译文"}')
    expect(await readResultCache('translation:test', isResult)).toEqual({ title: '译文' })
  })

  it.each(['not json', '{"title":42}', 'null'])('ignores invalid cache data %s', async (raw) => {
    redis.get.mockResolvedValue(raw)
    expect(await readResultCache('translation:test', isResult)).toBeNull()
  })

  it('writes JSON with atomic thirty-day expiration', async () => {
    await writeResultCache('translation:test', { title: '译文' })
    expect(redis.set).toHaveBeenCalledWith('translation:test', '{"title":"译文"}', 'EX', 2592000)
  })

  it('treats Redis read and write failures as cache misses', async () => {
    redis.get.mockRejectedValue(new Error('offline'))
    redis.set.mockRejectedValue(new Error('offline'))
    expect(await readResultCache('translation:test', isResult)).toBeNull()
    await expect(writeResultCache('translation:test', { title: '译文' })).resolves.toBeUndefined()
  })

  it('does not connect when Redis is unconfigured', async () => {
    vi.stubEnv('REDIS_URL', '')
    expect(await readResultCache('translation:test', isResult)).toBeNull()
    await writeResultCache('translation:test', { title: '译文' })
    expect(redis.get).not.toHaveBeenCalled()
    expect(redis.set).not.toHaveBeenCalled()
  })

  it('separates operations, versions and source content without exposing the input', () => {
    const key = createResultCacheKey('translation', 'v1', ['private article'])
    expect(key).not.toContain('private article')
    expect(key).not.toBe(createResultCacheKey('summary', 'v1', ['private article']))
    expect(key).not.toBe(createResultCacheKey('translation', 'v2', ['private article']))
    expect(key).not.toBe(createResultCacheKey('translation', 'v1', ['edited article']))
    expect(key).toBe(createResultCacheKey('translation', 'v1', ['private article']))
  })
})
