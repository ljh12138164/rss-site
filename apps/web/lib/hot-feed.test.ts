import { describe, expect, it } from 'vitest'
import { type FeedQuery, getJuejinFeed } from './hot-feed'

const rows = Array.from({ length: 7 }, (_, index) => ({
  source_key: `item-${7 - index}`,
  title: `热点 ${7 - index}`,
  url: `https://juejin.cn/post/${7 - index}`,
  summary: null,
  author: null,
  published_at: null,
  position: 7 - index
}))

describe('getJuejinFeed', () => {
  it('sorts the result and enforces the homepage five-item limit', async () => {
    const query: FeedQuery = async () => ({
      items: rows,
      status: {
        source: 'juejin',
        item_count: 7,
        last_success_at: '2026-09-04T01:00:00.000Z'
      },
      error: null
    })

    const result = await getJuejinFeed(5, query)

    expect(result).toEqual({
      state: 'ready',
      items: [1, 2, 3, 4, 5].map((position) => ({
        sourceKey: `item-${position}`,
        title: `热点 ${position}`,
        url: `https://juejin.cn/post/${position}`,
        summary: null,
        author: null,
        publishedAt: null,
        position
      })),
      status: {
        itemCount: 7,
        lastSuccessAt: new Date('2026-09-04T01:00:00.000Z')
      }
    })
  })

  it('keeps the complete ordered result when no limit is provided', async () => {
    const query: FeedQuery = async () => ({
      items: rows,
      status: {
        source: 'juejin',
        item_count: 7,
        last_success_at: '2026-09-04T01:00:00.000Z'
      },
      error: null
    })

    const result = await getJuejinFeed(undefined, query)

    expect(result.state).toBe('ready')
    if (result.state === 'ready') {
      expect(result.items.map((item) => item.position)).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
  })

  it('returns an explicit empty state when no ranking has been collected', async () => {
    const query: FeedQuery = async () => ({ items: [], status: null, error: null })

    expect(await getJuejinFeed(undefined, query)).toEqual({ state: 'empty' })
  })

  it('returns a stable error state when either Supabase query fails', async () => {
    const query: FeedQuery = async () => ({
      items: null,
      status: null,
      error: 'permission denied for relation hot_items'
    })

    expect(await getJuejinFeed(undefined, query)).toEqual({ state: 'error' })
  })
})
