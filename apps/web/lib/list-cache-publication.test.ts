import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { updateContent } from './content-update'
import { app } from './hono-app'

const { operations, callbacks, invalidate, warm, publish } = vi.hoisted(() => ({
  operations: [] as string[],
  callbacks: [] as (() => Promise<void>)[],
  invalidate: vi.fn(),
  warm: vi.fn(),
  publish: vi.fn()
}))
vi.mock('./list-cache', () => ({ invalidateListCaches: invalidate, getCachedList: vi.fn() }))
vi.mock('./list-cache-prewarm', () => ({ warmListCaches: warm }))
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
  vi.stubEnv('REDIS_URL', 'redis://localhost:6379')
  vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
  invalidate.mockImplementation(async () => {
    operations.push('invalidate')
    return true
  })
  warm.mockImplementation(async () => {
    operations.push('warm')
    return { total: 2, succeeded: 2, failed: [] }
  })
  publish.mockImplementation(async () => {
    operations.push('publish')
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

it('invalidates Redis before pages and refreshes lists before the final page/CDN publication', async () => {
  await updateContent({ section: '/social', source: 'zhihu' })
  expect(invalidate).toHaveBeenCalledWith(['source:zhihu', 'section:social'])
  expect(operations[0]).toBe('invalidate')
  expect(warm).not.toHaveBeenCalled()
  await callbacks[0]()
  expect(warm).toHaveBeenCalledWith(['source:zhihu', 'section:social'])
  expect(operations.indexOf('warm')).toBeLessThan(operations.lastIndexOf('page'))
  expect(operations.at(-1)).toBe('publish')
})

it('retries only unsuccessful fills and logs permanent failures without secrets', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  warm.mockResolvedValue({ total: 1, succeeded: 0, failed: ['source:zhihu'] })
  await updateContent({ section: '/social', source: 'zhihu', publicationId: 'batch' })
  await callbacks[0]()
  expect(warm.mock.calls.map((args) => args[0])).toEqual([
    ['source:zhihu', 'section:social'],
    ['source:zhihu']
  ])
  expect(log).toHaveBeenCalledWith(expect.stringContaining('"listCache":"failed"'))
  expect(JSON.stringify(log.mock.calls)).not.toContain('redis://')
  expect(publish).toHaveBeenCalled()
})

it('returns retryable 503 on Redis invalidation failure while scheduling recovery', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  invalidate.mockResolvedValueOnce(false).mockResolvedValue(true)
  const response = await app.request('/api/revalidate', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-secret', 'Content-Type': 'application/json' },
    body: JSON.stringify({ section: 'social', source: 'zhihu' })
  })
  expect(response.status).toBe(503)
  expect((await response.json()).revalidated).toBe(false)
  await callbacks[0]()
  expect(invalidate).toHaveBeenCalledTimes(2)
  expect(warm).toHaveBeenCalled()
})

it('does not refresh article lists for event-only notifications', async () => {
  await updateContent({ eventSlugs: ['launch-12345678'] })
  await callbacks[0]()
  expect(warm).not.toHaveBeenCalled()
  expect(publish).toHaveBeenCalled()
})
