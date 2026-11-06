import { describe, expect, it } from 'vitest'
import {
  type FeedCollectionQuery,
  getNewsFeed,
  getNewsFeeds,
  getSectionFeeds,
  getSkillFeeds,
  getSourceFeed,
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

describe('skill feeds', () => {
  it('keeps both rankings in upstream position order', async () => {
    const feeds = await getSkillFeeds(async () => ({
      items: [
        {
          source: 'skills-trending',
          source_key: 'owner/repo/second',
          title: '#2 second',
          url: 'https://www.skills.sh/owner/repo/second',
          summary: 'Second description · Installs: 20',
          author: 'owner',
          published_at: null,
          position: 2
        },
        {
          source: 'skills-trending',
          source_key: 'owner/repo/first',
          title: '#1 first',
          url: 'https://www.skills.sh/owner/repo/first',
          summary: 'First description · Installs: 30',
          author: 'owner',
          published_at: null,
          position: 1
        }
      ],
      statuses: [
        { source: 'skills-trending', item_count: 2, last_success_at: '2026-09-14T01:00:00.000Z' }
      ],
      error: null
    }))

    expect(feeds['skills-all-time']).toEqual({ state: 'empty' })
    expect(feeds['skills-trending'].state).toBe('ready')
    if (feeds['skills-trending'].state === 'ready') {
      expect(feeds['skills-trending'].items.map((item) => item.position)).toEqual([1, 2])
    }
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

describe('game feeds', () => {
  const gameQuery: FeedCollectionQuery = async () => ({
    items: [
      {
        source: 'gcores',
        source_key: 'gcores-1',
        title: '当前热销游戏',
        url: 'https://www.gcores.com/articles/1',
        image_url: null,
        summary: null,
        author: null,
        published_at: null,
        position: 1
      }
    ],
    statuses: [{ source: 'gcores', item_count: 1, last_success_at: '2026-09-05T09:05:00.000Z' }],
    error: null
  })

  it('supports generic getSectionFeeds and getSourceFeed readers', async () => {
    const feeds = await getSectionFeeds('games', 1, gameQuery)
    const feed = await getSourceFeed('gcores', undefined, gameQuery)

    expect(feeds.indienova).toEqual({ state: 'empty' })
    expect(feed.state).toBe('ready')
  })
})
