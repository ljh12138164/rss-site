import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  DAILY_CACHE_GENERATION_KEY,
  DAILY_CACHE_TTL_SECONDS,
  dailyCacheKey,
  getCachedDailyData,
  invalidateDailyReportCache
} from './daily-report-cache'

const { values, evalCommand, set, available } = vi.hoisted(() => ({
  values: new Map<string, string>(),
  evalCommand: vi.fn(),
  set: vi.fn(),
  available: { value: true }
}))
vi.mock('./redis-cache', () => ({
  withRedisCache: async (operation: (redis: unknown) => Promise<unknown>) =>
    available.value ? operation({ eval: evalCommand, set }) : null
}))
const parse = (value: unknown): string | null => {
  if (value !== null && typeof value !== 'string') throw new Error('Invalid value')
  return value
}
beforeEach(() => {
  vi.clearAllMocks()
  values.clear()
  available.value = true
  vi.stubEnv('REDIS_URL', 'redis://test')
  set.mockImplementation(async (key: string, value: string) => {
    values.set(key, value)
    return 'OK'
  })
  evalCommand.mockImplementation(async (_script, _count, generationKey, dataKey, ...args) => {
    if (args.length === 1) {
      if (!values.has(generationKey)) values.set(generationKey, args[0])
      return [values.get(generationKey), values.get(dataKey) ?? '']
    }
    if (values.get(generationKey) !== args[0]) return 0
    values.set(dataKey, args[1])
    return 1
  })
})
afterEach(() => vi.unstubAllEnvs())

it('caches latest, dated reports and archives independently for five minutes', async () => {
  const load = vi.fn(async () => 'data')
  for (const key of ['report:latest', 'report:2026-11-04', 'archive:2026-11-04']) {
    expect(await getCachedDailyData(key, parse, load)).toBe('data')
    expect(await getCachedDailyData(key, parse, load)).toBe('data')
  }
  expect(load).toHaveBeenCalledTimes(3)
  expect(evalCommand.mock.calls.filter((call) => call.length === 7)).toHaveLength(3)
  expect(
    evalCommand.mock.calls
      .filter((call) => call.length === 7)
      .every((call) => call[6] === DAILY_CACHE_TTL_SECONDS)
  ).toBe(true)
})

it('caches a real absence while never caching database failures or invalid data', async () => {
  const empty = vi.fn(async () => null)
  await getCachedDailyData('empty', parse, empty)
  expect(await getCachedDailyData('empty', parse, empty)).toBeNull()
  expect(empty).toHaveBeenCalledTimes(1)
  const failed = vi.fn(async () => {
    throw new Error('DB unavailable')
  })
  await expect(getCachedDailyData('failed', parse, failed)).rejects.toThrow('DB unavailable')
  await expect(getCachedDailyData('invalid', parse, async () => ({}))).rejects.toThrow(
    'Invalid value'
  )
  expect(values.has(dailyCacheKey('failed'))).toBe(false)
  expect(values.has(dailyCacheKey('invalid'))).toBe(false)
})

it('refills malformed JSON and invalid cached payloads', async () => {
  values.set(DAILY_CACHE_GENERATION_KEY, 'current')
  for (const raw of ['{bad', JSON.stringify({ generation: 'current', value: {} })]) {
    values.set(dailyCacheKey('report:latest'), raw)
    const load = vi.fn(async () => 'valid')
    expect(await getCachedDailyData('report:latest', parse, load)).toBe('valid')
    expect(load).toHaveBeenCalledTimes(1)
  }
})

it('reloads a database result arriving after publication instead of returning or caching it', async () => {
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
  const pending = getCachedDailyData('report:latest', parse, load)
  await vi.waitFor(() => expect(load).toHaveBeenCalledOnce())
  await invalidateDailyReportCache()
  finish('stale')
  expect(await pending).toBe('fresh')
  expect(await getCachedDailyData('report:latest', parse, load)).toBe('fresh')
  expect(load).toHaveBeenCalledTimes(2)
})

it('falls back to the database on Redis outages and reports failed publication invalidation', async () => {
  available.value = false
  expect(await getCachedDailyData('report:latest', parse, async () => 'DB')).toBe('DB')
  expect(await invalidateDailyReportCache()).toBe(false)
  vi.stubEnv('REDIS_URL', '')
  expect(await invalidateDailyReportCache()).toBe(true)
})
