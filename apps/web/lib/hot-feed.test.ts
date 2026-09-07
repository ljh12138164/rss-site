import { describe, expect, it } from 'vitest'
import {
  type FeedCollectionQuery,
  getAiFeed,
  getAiFeeds,
  getFinanceFeed,
  getFinanceFeeds,
  getGameFeed,
  getGameFeeds,
  getNewsFeed,
  getNewsFeeds,
  getSocialFeed,
  getSocialFeeds,
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
        article_id: '00000000-0000-0000-0000-000000000102',
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
    if (feed.state === 'ready') {
      expect(feed.items[0]?.articleId).toBe('00000000-0000-0000-0000-000000000102')
    }
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
})

describe('social feeds', () => {
  const socialQuery: FeedCollectionQuery = async () => ({
    items: [
      {
        source: 'bilibili',
        source_key: 'bilibili-1',
        title: 'B 站热门视频',
        url: 'https://www.bilibili.com/video/BV123',
        image_url: 'https://i2.hdslb.com/bfs/archive/cover.jpg',
        summary: '视频简介',
        author: '示例 UP 主',
        published_at: '2026-09-05T03:00:00.000Z',
        position: 1
      }
    ],
    statuses: [{ source: 'bilibili', item_count: 1, last_success_at: '2026-09-05T03:00:00.000Z' }],
    error: null
  })

  it('builds social results and preserves preview image URLs', async () => {
    const feeds = await getSocialFeeds(1, socialQuery)
    const feed = await getSocialFeed('bilibili', undefined, socialQuery)

    expect(feeds.zhihu).toEqual({ state: 'empty' })
    expect(feed.state).toBe('ready')
    if (feed.state === 'ready') {
      expect(feed.items[0]).toMatchObject({
        url: 'https://www.bilibili.com/video/BV123',
        imageUrl: 'https://i2.hdslb.com/bfs/archive/cover.jpg'
      })
    }
  })
})

describe('finance feeds', () => {
  const financeQuery: FeedCollectionQuery = async () => ({
    items: [
      {
        source: 'wallstreetcn',
        source_key: 'wallstreetcn-1',
        title: '市场热点',
        url: 'https://wallstreetcn.com/articles/1',
        image_url: null,
        summary: null,
        author: null,
        published_at: '2026-09-05T08:00:00.000Z',
        position: 1
      }
    ],
    statuses: [
      { source: 'wallstreetcn', item_count: 1, last_success_at: '2026-09-05T08:05:00.000Z' }
    ],
    error: null
  })

  it('builds independent finance collection and detail results', async () => {
    const feeds = await getFinanceFeeds(1, financeQuery)
    const feed = await getFinanceFeed('wallstreetcn', undefined, financeQuery)

    expect(feeds.wallstreetcn.state).toBe('ready')
    expect(feeds.jin10).toEqual({ state: 'empty' })
    expect(feed.state).toBe('ready')
  })
})

describe('game feeds', () => {
  const gameQuery: FeedCollectionQuery = async () => ({
    items: [
      {
        source: 'steam',
        source_key: 'steam-1',
        title: '当前热销游戏',
        url: 'https://store.steampowered.com/app/1',
        image_url: null,
        summary: null,
        author: null,
        published_at: null,
        position: 1
      }
    ],
    statuses: [{ source: 'steam', item_count: 1, last_success_at: '2026-09-05T09:05:00.000Z' }],
    error: null
  })

  it('builds game results without fabricating Steam publication times', async () => {
    const feeds = await getGameFeeds(1, gameQuery)
    const feed = await getGameFeed('steam', undefined, gameQuery)

    expect(feeds.gcores).toEqual({ state: 'empty' })
    expect(feed.state).toBe('ready')
    if (feed.state === 'ready') expect(feed.items[0]?.publishedAt).toBeNull()
  })
})
