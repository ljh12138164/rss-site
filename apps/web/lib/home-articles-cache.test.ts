import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getHomeArticles, parseHomeCursor } from './home-articles'

const { cache, from, signals, error } = vi.hoisted(() => ({
  cache: new Map<string, unknown>(),
  from: vi.fn(),
  signals: [] as AbortSignal[],
  error: { value: false }
}))
vi.mock('./list-cache', () => ({
  getCachedList: async (
    key: string,
    _validate: unknown,
    load: () => Promise<unknown>,
    refresh: boolean
  ) => {
    if (!refresh && cache.has(key)) return structuredClone(cache.get(key))
    const value = await load()
    cache.set(key, structuredClone(value))
    return value
  }
}))
vi.mock('./business-db', () => ({ readBusinessRows: from }))

beforeEach(() => {
  cache.clear()
  from.mockReset()
  signals.length = 0
  error.value = false
  from.mockImplementation(() => {
    const rows = Array.from({ length: 31 }, (_, i) => ({
      id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
      source: 'zhihu',
      source_key: `key:${i}`,
      title: `新闻 ${i}`,
      url: 'https://example.com',
      image_url: null,
      summary: '摘要',
      published_at: '2026-11-01T00:00:00Z',
      article_id: null,
      position: i + 1,
      batch_id: '550e8400-e29b-41d4-a716-446655440000'
    }))
    if (error.value) throw new Error('db')
    return Promise.resolve(rows)
  })
})
afterEach(() => vi.restoreAllMocks())

it('shares platform first pages between SSR and API filters and preserves the cursor for uncached scrolling', async () => {
  const first = await getHomeArticles(null, undefined, { section: '/social', source: 'zhihu' })
  const again = await getHomeArticles(null, undefined, { source: 'zhihu' })
  expect(again).toEqual(first)
  expect(first.items).toHaveLength(30)
  expect(from).toHaveBeenCalledTimes(1)
  const cursor = parseHomeCursor(first.nextCursor as string)
  expect(cursor.snapshot).toBeTruthy()
  await getHomeArticles(cursor, undefined, { section: '/social', source: 'zhihu' })
  expect(from).toHaveBeenCalledTimes(2)
})

it('leaves personalized lists uncached and does not bind shared fills to visitor cancellation', async () => {
  const controller = new AbortController()
  controller.abort()
  await getHomeArticles(null, controller.signal, { section: '/social' })
  expect(from).toHaveBeenCalledTimes(1)
  await getHomeArticles(null, undefined, { sources: ['zhihu'] })
  await getHomeArticles(null, undefined, { sources: ['zhihu'] })
  expect(from).toHaveBeenCalledTimes(3)
})

it('keeps GitHub batch and ranking cursors intact', async () => {
  const page = await getHomeArticles(null, undefined, { source: 'github' })
  const cursor = parseHomeCursor(page.nextCursor as string)
  expect(cursor.position).toBe(30)
  expect(cursor.batchId).toBe('550e8400-e29b-41d4-a716-446655440000')
  expect(await getHomeArticles(null, undefined, { source: 'github' })).toEqual(page)
  expect(from).toHaveBeenCalledTimes(1)
})

it('does not retain failed first-page queries', async () => {
  error.value = true
  await expect(getHomeArticles(null, undefined, { source: 'zhihu' })).rejects.toThrow('db')
  error.value = false
  expect((await getHomeArticles(null, undefined, { source: 'zhihu' })).items).toHaveLength(30)
  expect(from).toHaveBeenCalledTimes(2)
})
