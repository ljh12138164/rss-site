import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSameSourceArticles } from './signal-article'

const { from, entries } = vi.hoisted(() => ({
  from: vi.fn(),
  entries: new Map<string, Promise<unknown>>()
}))
vi.mock('./supabase', () => ({ getPublicSupabaseClient: () => ({ from }) }))
vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>, key: string[]) => () => {
    const cacheKey = JSON.stringify(key)
    if (!entries.has(cacheKey)) entries.set(cacheKey, fn())
    return entries.get(cacheKey)
  }
}))
const rows = Array.from({ length: 5 }, (_, index) => ({
  id: String(index),
  title: `文章 ${index}`,
  source: 'juejin'
}))
beforeEach(() => {
  entries.clear()
  from.mockClear()
  from.mockImplementation(() => {
    let excluded: string | undefined
    let limit = 4
    const chain = {
      select: () => chain,
      eq: () => chain,
      neq: (_field: string, id: string) => {
        excluded = id
        return chain
      },
      order: () => chain,
      limit: (value: number) => {
        limit = value
        return chain
      },
      abortSignal: () =>
        Promise.resolve({
          data: rows.filter((row) => row.id !== excluded).slice(0, limit),
          error: null
        })
    }
    return chain
  })
})
describe('same-source article data', () => {
  it('shares one recent-article read across cold pages but excludes each current article', async () => {
    expect(await getSameSourceArticles('0', 'juejin')).toEqual(rows.slice(1))
    expect(await getSameSourceArticles('1', 'juejin')).toEqual([rows[0], ...rows.slice(2)])
    expect(from).toHaveBeenCalledTimes(1)
  })

  it('keeps four recent links when the current article is outside the latest five', async () => {
    expect(await getSameSourceArticles('older', 'juejin')).toEqual(rows.slice(0, 4))
  })
})
