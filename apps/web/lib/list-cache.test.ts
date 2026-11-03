import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getCachedList, invalidateListCaches, listCacheKeys } from './list-cache'

const { evaluate } = vi.hoisted(() => ({ evaluate: vi.fn() }))
vi.mock('./redis-cache', () => ({
  withRedisCache: async (operation: (redis: unknown) => Promise<unknown>) =>
    operation({ eval: evaluate })
}))
const value = { items: ['new'] }
const valid = (value: unknown): value is { items: string[] } =>
  !!value &&
  typeof value === 'object' &&
  'items' in value &&
  Array.isArray(value.items) &&
  value.items.every((item) => typeof item === 'string')

beforeEach(() => {
  evaluate.mockReset()
  vi.stubEnv('REDIS_URL', 'redis://localhost:6379')
})
afterEach(() => vi.unstubAllEnvs())

it('returns a validated hit without loading', async () => {
  evaluate.mockResolvedValue(['version', JSON.stringify(value)])
  const load = vi.fn()
  expect(await getCachedList('hit', valid, load)).toEqual(value)
  expect(load).not.toHaveBeenCalled()
  expect(evaluate).toHaveBeenCalledTimes(1)
})

it.each(['', 'invalid-json', '{"items":42}'])(
  'fills missing or invalid data %s as resident cache data',
  async (raw) => {
    evaluate.mockResolvedValueOnce(['version', raw]).mockResolvedValueOnce(1)
    expect(await getCachedList(`invalid:${raw}`, valid, async () => value)).toEqual(value)
    const args = evaluate.mock.calls[1]
    expect(args.slice(1, 5)).toEqual([2, ...listCacheKeys(`invalid:${raw}`), 'version'])
    expect(args[5]).toBe(JSON.stringify(value))
  }
)

it('caches successful empty data but never caches database errors', async () => {
  evaluate.mockResolvedValueOnce(['version', '']).mockResolvedValueOnce(1)
  await getCachedList('empty', valid, async () => ({ items: [] }))
  evaluate.mockClear().mockResolvedValue(['version', ''])
  await expect(
    getCachedList('error', valid, async () => {
      throw new Error('database')
    })
  ).rejects.toThrow('database')
  expect(evaluate).toHaveBeenCalledTimes(1)
})

it('merges concurrent cold loads within one generation and permits a new-generation load', async () => {
  let finish!: (result: { items: string[] }) => void
  const first = new Promise<typeof value>((resolve) => {
    finish = resolve
  })
  const load = vi.fn(() => first)
  evaluate.mockResolvedValue(['old', ''])
  const one = getCachedList('concurrent', valid, load)
  const two = getCachedList('concurrent', valid, load)
  await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))
  evaluate.mockResolvedValueOnce(['new', '']).mockResolvedValue(1)
  expect(await getCachedList('concurrent', valid, async () => value)).toEqual(value)
  finish({ items: ['old'] })
  await Promise.all([one, two])
})

it('requires a committed write when prewarming, including a concurrent invalidation or outage', async () => {
  evaluate.mockResolvedValueOnce(['version', JSON.stringify(value)]).mockResolvedValueOnce(0)
  const load = vi.fn(async () => ({ items: ['refreshed'] }))
  await expect(getCachedList('refresh', valid, load, true)).rejects.toThrow('not committed')
  expect(load).toHaveBeenCalledTimes(1)
  evaluate.mockResolvedValueOnce(null)
  await expect(getCachedList('offline', valid, load, true)).rejects.toThrow('unavailable')
  expect(await getCachedList('offline-read', valid, async () => value)).toEqual(value)
})

it('invalidates the supplied scopes together and reports a failed invalidation', async () => {
  evaluate.mockResolvedValueOnce(1).mockResolvedValueOnce(null)
  expect(await invalidateListCaches(['source:zhihu', 'section:social'])).toBe(true)
  expect(evaluate.mock.calls[0].slice(1, 6)).toEqual([
    4,
    ...listCacheKeys('source:zhihu'),
    ...listCacheKeys('section:social')
  ])
  expect(await invalidateListCaches(['source:zhihu'])).toBe(false)
})
