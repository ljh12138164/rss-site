import { describe, expect, it } from 'vitest'
import {
  type FeedCollectionQuery,
  getAiFeed,
  getAiFeeds,
  getAiTimeline,
  getNewsFeed,
  getNewsFeeds,
  getTechnologyFeed,
  getTechnologyFeeds
} from './hot-feed'

const query: FeedCollectionQuery = async () => ({
  items: [
    {
      source: 'github',
      source_key: 'github-2',
      title: 'GitHub 2',
      url: 'https://github.com/example/two',
      summary: null,
      author: null,
      published_at: null,
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
          sourceKey: 'github-1',
          title: 'GitHub 1',
          url: 'https://github.com/example/one',
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
    expect(feeds.v2ex).toEqual({ state: 'empty' })
  })

  it('returns one complete source ranking for detail pages', async () => {
    const feed = await getTechnologyFeed('github', undefined, query)

    expect(feed.state).toBe('ready')
    if (feed.state === 'ready') {
      expect(feed.items.map((item) => item.position)).toEqual([1, 2])
    }
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

describe('news feeds', () => {
  const newsQuery: FeedCollectionQuery = async () => ({
    items: [
      {
        source: 'xinhua',
        source_key: 'xinhua-1',
        title: '新华社新闻',
        url: 'https://www.news.cn/story',
        summary: null,
        author: null,
        published_at: null,
        position: 1
      }
    ],
    statuses: [{ source: 'xinhua', item_count: 1, last_success_at: '2026-09-05T01:00:00.000Z' }],
    error: null
  })

  it('builds independent collection and detail results', async () => {
    const feeds = await getNewsFeeds(1, newsQuery)
    const feed = await getNewsFeed('xinhua', undefined, newsQuery)

    expect(feeds.xinhua.state).toBe('ready')
    expect(feeds.cctv).toEqual({ state: 'empty' })
    expect(feed.state).toBe('ready')
  })
})

describe('AI feeds', () => {
  const aiQuery: FeedCollectionQuery = async () => ({
    items: [
      {
        source: 'openai',
        source_key: 'openai-1',
        title: 'OpenAI 更新',
        url: 'https://openai.com/index/update',
        summary: null,
        author: null,
        published_at: null,
        position: 1
      }
    ],
    statuses: [{ source: 'openai', item_count: 1, last_success_at: '2026-09-05T02:00:00.000Z' }],
    error: null
  })

  it('builds independent AI collection and detail results', async () => {
    const feeds = await getAiFeeds(1, aiQuery)
    const feed = await getAiFeed('openai', undefined, aiQuery)

    expect(feeds.openai.state).toBe('ready')
    expect(feeds.anthropic).toEqual({ state: 'empty' })
    expect(feed.state).toBe('ready')
  })

  it('merges real AI rows into a newest-first timeline and ignores non-AI rows', async () => {
    const timeline = await getAiTimeline(2, async () => ({
      items: [
        {
          source: 'anthropic',
          source_key: 'anthropic-older',
          title: 'Anthropic 更新',
          url: 'https://www.anthropic.com/news/update',
          summary: null,
          author: null,
          published_at: '2026-09-03T12:00:00.000Z',
          position: 1
        },
        {
          source: 'openai',
          source_key: 'openai-newer',
          title: 'OpenAI 更新',
          url: 'https://openai.com/index/update',
          summary: null,
          author: null,
          published_at: '2026-09-05T12:00:00.000Z',
          position: 2
        },
        {
          source: 'github',
          source_key: 'not-ai',
          title: '非 AI 分区记录',
          url: 'https://github.com/example/repo',
          summary: null,
          author: null,
          published_at: '2026-09-06T12:00:00.000Z',
          position: 1
        }
      ],
      statuses: [],
      error: null
    }))

    expect(timeline.state).toBe('ready')
    if (timeline.state === 'ready') {
      expect(timeline.items.map((item) => item.sourceKey)).toEqual([
        'openai-newer',
        'anthropic-older'
      ])
    }
  })

  it('returns empty and error states without manufacturing timeline events', async () => {
    await expect(
      getAiTimeline(30, async () => ({ items: [], statuses: [], error: null }))
    ).resolves.toEqual({ state: 'empty' })
    await expect(
      getAiTimeline(30, async () => ({ items: null, statuses: null, error: 'unavailable' }))
    ).resolves.toEqual({ state: 'error' })
  })
})
