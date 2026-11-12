import { describe, expect, it } from 'vitest'
import { type FeedCollectionQuery, getTechnologyFeeds } from './hot-feed'

const query: FeedCollectionQuery = async () => ({
  items: [
    {
      source: 'github',
      source_key: 'github-2',
      title: 'GitHub 2',
      url: 'https://github.com/example/two',
      summary: null,
      author: null,
      published_at: '2026-09-05T01:00:00.000Z',
      position: 2
    },
    {
      source: 'juejin',
      source_key: 'juejin-1',
      title: '掘金 1',
      url: 'https://juejin.cn/post/1',
      summary: null,
      author: null,
      published_at: null,
      position: 1
    },
    {
      source: 'github',
      source_key: 'github-1',
      title: 'GitHub 1',
      url: 'https://github.com/example/one',
      summary: null,
      author: 'example',
      published_at: '2026-09-04T01:00:00.000Z',
      position: 1
    }
  ],
  statuses: [
    { source: 'github', item_count: 2, last_success_at: '2026-09-04T02:00:00.000Z' },
    { source: 'juejin', item_count: 1, last_success_at: '2026-09-04T01:00:00.000Z' }
  ],
  error: null
})

describe('technology feeds', () => {
  it('groups sources independently, sorts each ranking, and enforces per-source limits', async () => {
    const feeds = await getTechnologyFeeds(1, query)

    expect(feeds.github).toEqual({
      state: 'ready',
      items: [
        {
          articleId: null,
          sourceKey: 'github-1',
          title: 'GitHub 1',
          url: 'https://github.com/example/one',
          imageUrl: null,
          summary: null,
          author: 'example',
          publishedAt: new Date('2026-09-04T01:00:00.000Z'),
          position: 1
        }
      ],
      status: {
        itemCount: 2,
        lastSuccessAt: new Date('2026-09-04T02:00:00.000Z')
      }
    })
    expect(feeds.juejin.state).toBe('ready')
    expect(feeds.ithome).toEqual({ state: 'empty' })
  })

  it('isolates missing source status from healthy sources', async () => {
    const feeds = await getTechnologyFeeds(undefined, async () => ({
      items: [
        {
          source: 'github',
          source_key: 'github-1',
          title: 'GitHub 1',
          url: 'https://github.com/example/one',
          summary: null,
          author: null,
          published_at: null,
          position: 1
        },
        {
          source: 'juejin',
          source_key: 'juejin-1',
          title: '掘金 1',
          url: 'https://juejin.cn/post/1',
          summary: null,
          author: null,
          published_at: null,
          position: 1
        }
      ],
      statuses: [{ source: 'juejin', item_count: 1, last_success_at: '2026-09-04T01:00:00.000Z' }],
      error: null
    }))

    expect(feeds.github).toEqual({ state: 'error' })
    expect(feeds.juejin.state).toBe('ready')
  })

  it('returns stable error states when the shared database read fails', async () => {
    const feeds = await getTechnologyFeeds(undefined, async () => ({
      items: null,
      statuses: null,
      error: 'permission denied'
    }))

    expect(Object.values(feeds).every((feed) => feed.state === 'error')).toBe(true)
  })
})
