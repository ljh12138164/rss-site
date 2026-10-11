import { describe, expect, it } from 'vitest'
import { getNewsArticle, type NewsArticleQuery } from './signal-article'

describe('getNewsArticle', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000'

  it('maps persisted article metadata without inventing missing fields', async () => {
    const query: NewsArticleQuery = async () => ({
      data: {
        id,
        source: 'xinhua',
        source_key: 'story-1',
        title: '新华社新闻',
        url: 'https://www.news.cn/story',
        summary: '真实摘要',
        author: null,
        published_at: '2026-09-06T01:00:00.000Z',
        first_seen_at: '2026-09-06T01:05:00.000Z',
        last_seen_at: '2026-09-06T02:00:00.000Z',
        content_updated_at: '2026-09-06T01:30:00.000Z',
        is_indexable: true
      },
      error: null
    })

    await expect(getNewsArticle(id, 'xinhua', query)).resolves.toEqual({
      id,
      source: 'xinhua',
      sourceKey: 'story-1',
      title: '新华社新闻',
      url: 'https://www.news.cn/story',
      summary: '真实摘要',
      author: null,
      publishedAt: new Date('2026-09-06T01:00:00.000Z'),
      firstSeenAt: new Date('2026-09-06T01:05:00.000Z'),
      lastSeenAt: new Date('2026-09-06T02:00:00.000Z'),
      contentUpdatedAt: new Date('2026-09-06T01:30:00.000Z'),
      isIndexable: true
    })
  })

  it('returns null for a missing article and surfaces database failures', async () => {
    await expect(
      getNewsArticle(id, 'xinhua', async () => ({ data: null, error: null }))
    ).resolves.toBeNull()

    await expect(
      getNewsArticle(id, 'xinhua', async () => ({ data: null, error: 'permission denied' }))
    ).rejects.toThrow('Unable to load news article')
  })
})
