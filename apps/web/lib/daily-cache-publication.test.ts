import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { updateContent } from './content-update'
import { app } from './hono-app'

const { operations, callbacks, invalidate, publish } = vi.hoisted(() => ({
  operations: [] as string[],
  callbacks: [] as (() => Promise<void>)[],
  invalidate: vi.fn(),
  publish: vi.fn()
}))
vi.mock('./daily-report-cache', () => ({ invalidateDailyReportCache: invalidate }))
vi.mock('./list-cache', () => ({ invalidateListCaches: async () => true, getCachedList: vi.fn() }))
vi.mock('./list-cache-prewarm', () => ({ warmListCaches: vi.fn() }))
vi.mock('./content-publication', () => ({ publishContent: publish }))
vi.mock('next/cache', () => ({
  revalidatePath: () => operations.push('page'),
  revalidateTag: () => operations.push('tag')
}))
vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => callbacks.push(callback)
}))

beforeEach(() => {
  vi.resetAllMocks()
  operations.length = 0
  callbacks.length = 0
  vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
  invalidate.mockImplementation(async () => {
    operations.push('daily')
    return true
  })
  publish.mockImplementation(async () => {
    operations.push('publish')
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

it('invalidates shared daily data before Next pages and CDN publication', async () => {
  const result = await updateContent({ dailyReportDate: '2026-11-04' })
  expect(result.cacheInvalidated).toBe(true)
  expect(operations[0]).toBe('daily')
  expect(operations).toContain('tag')
  await callbacks[0]()
  expect(operations.at(-1)).toBe('publish')
})

it('returns retryable 503 without refreshing pages when daily Redis invalidation fails', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  invalidate.mockResolvedValue(false)
  const response = await app.request('/api/revalidate', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-secret', 'Content-Type': 'application/json' },
    body: JSON.stringify({ dailyReportDate: '2026-11-04' })
  })
  expect(response.status).toBe(503)
  expect((await response.json()).revalidated).toBe(false)
  expect(operations).toEqual([])
  expect(callbacks).toHaveLength(0)
  expect(publish).not.toHaveBeenCalled()
})

it('leaves daily data cached for unrelated event publications', async () => {
  await updateContent({ eventSlugs: ['launch-12345678'] })
  expect(invalidate).not.toHaveBeenCalled()
})
