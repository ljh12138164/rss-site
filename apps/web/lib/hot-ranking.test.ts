import { describe, expect, it, vi } from 'vitest'
import {
  type HotAnalysis,
  type HotArticle,
  hotEventId,
  makeHotBatch,
  parseHotBatch,
  rankHotEvents,
  recallHotEvents,
  splitHotGroups
} from '../../../shared/hot-ranking'
import { prepareHotArticle, requestHotAnalysis } from './hot-ranking'

const cutoff = '2026-11-09T08:00:00Z'
const article = (i: number, source = 'ithome', age = 0): HotArticle => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  source,
  section: 'technology',
  title: 'OpenAI GPT-6 Cyber 正式发布',
  text: '完整事实'.repeat(30),
  url: `https://example.com/${i}`,
  imageUrl: null,
  at: new Date(Date.parse(cutoff) - age * 3600000).toISOString(),
  hash: 'a'.repeat(64)
})
const analysis = (a: HotArticle, eventId = 'same'): HotAnalysis => ({
  id: a.id,
  eventId,
  title: a.title,
  summary: '公司正式发布了新产品，保留具体适用范围。'
})

describe('event heat and membership', () => {
  it('retries a temporary service failure once while refusing missing article IDs', async () => {
    vi.stubEnv('AGENT_SERVICE_URL', 'http://agent.test')
    vi.stubEnv('AGENT_SERVICE_TOKEN', 'test-token')
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ items: [] }))
    vi.stubGlobal('fetch', fetcher)
    try {
      await expect(
        requestHotAnalysis({ articles: [article(1)], events: [] }, new AbortController().signal)
      ).rejects.toThrow('Invalid hot analysis')
      expect(fetcher).toHaveBeenCalledTimes(2)
      fetcher.mockReset().mockResolvedValue(new Response('', { status: 401 }))
      await expect(
        requestHotAnalysis({ articles: [article(1)], events: [] }, new AbortController().signal)
      ).rejects.toThrow('hot_analysis_failed')
      expect(fetcher).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllEnvs()
      vi.unstubAllGlobals()
    }
  })
  it('deduplicates organizations and decays source time instead of collection counts', () => {
    const articles = [
      article(1, 'openai'),
      article(2, 'chatgpt'),
      article(3, 'ithome', 24),
      article(4, 'ithome', 30)
    ]
    const entry = rankHotEvents(
      articles,
      articles.map((a) => analysis(a)),
      cutoff
    ).entries[0]
    expect(entry).toMatchObject({ heat: 15, participants: 2 })
    const same = articles.filter((a) => a.source === 'openai' || a.source === 'chatgpt')
    expect(
      rankHotEvents(
        same,
        same.map((a) => analysis(a)),
        cutoff
      ).entries[0].heat
    ).toBe(10)
  })
  it('uses every participant despite the three-reference display limit and excludes future/expired evidence', () => {
    const articles = [
      article(1, 'a'),
      article(2, 'b'),
      article(3, 'c'),
      article(4, 'd'),
      article(5, 'old', 48),
      article(6, 'future', -1)
    ]
    const entry = rankHotEvents(
      articles,
      articles.map((a) => analysis(a)),
      cutoff
    ).entries[0]
    expect(entry).toMatchObject({ heat: 40, participants: 4 })
    expect(entry.references).toHaveLength(3)
  })
  it('ranks events before rounding and keeps different events separate', () => {
    const articles = [article(1, 'a', 1.01), article(2, 'b', 1)]
    const entries = rankHotEvents(
      articles,
      articles.map((a) => analysis(a, a.id)),
      cutoff
    ).entries
    expect(entries[0].eventId).toBe(articles[1].id)
    expect(entries[0].heat).toBe(entries[1].heat)
    expect(
      rankHotEvents(
        [...articles].reverse(),
        articles.map((a) => analysis(a, a.id)).reverse(),
        cutoff
      )
    ).toEqual(
      rankHotEvents(
        articles,
        articles.map((a) => analysis(a, a.id)),
        cutoff
      )
    )
  })
  it('assigns persistent new group IDs from members and refuses invented/duplicated membership', () => {
    const articles = [article(2), article(1, 'openai')]
    const input = { articles, events: [] }
    const items = articles.map((a) => ({
      id: a.id,
      eligible: true,
      title: a.title,
      summary: '有明确证据的事实。',
      eventId: null,
      groupKey: 'n1'
    }))
    expect(parseHotBatch(input, { items }).map((a) => a.eventId)).toEqual([
      hotEventId(articles[1]),
      hotEventId(articles[1])
    ])
    expect(() => parseHotBatch(input, { items: [items[0], items[0]] })).toThrow()
    expect(() =>
      parseHotBatch(input, {
        items: items.map((r) => ({ ...r, eventId: 'invented', groupKey: null }))
      })
    ).toThrow()
    expect(() => parseHotBatch(input, { items: items.map((r) => ({ ...r, heat: 100 })) })).toThrow()
    expect(
      recallHotEvents([articles[1]], [articles[0]], [analysis(articles[0], articles[0].id)])
    ).toHaveLength(1)
  })
  it('splits a mistaken conference-level merge without changing facts or reusing the old anchor', () => {
    const articles = [article(1), article(2, 'openai'), article(3, '36kr')]
    const input = { articles, events: [] }
    const raw = {
      items: articles.map((a) => ({
        id: a.id,
        eligible: true,
        title: a.title,
        summary: '各自报道的具体事实。',
        eventId: null,
        groupKey: 'n1'
      }))
    }
    const reviewed = parseHotBatch(input, splitHotGroups(input, raw, [articles[0].id]))
    expect(reviewed[0].eventId).not.toBe(reviewed[1].eventId)
    expect(reviewed[1].eventId).toBe(reviewed[2].eventId)
    expect(reviewed.map((a) => a.summary)).toEqual(raw.items.map((a) => a.summary))
    expect(() => splitHotGroups(input, raw, ['invented'])).toThrow()
    expect(hotEventId({ ...articles[0], hash: 'b'.repeat(64) })).not.toBe(hotEventId(articles[0]))
  })
  it('fits dense Chinese batches in the byte budget without skipping articles', () => {
    const articles = Array.from({ length: 24 }, (_, i) => ({
      ...article(i + 1),
      text: '新'.repeat(1800)
    }))
    const batch = makeHotBatch(articles, articles, [])
    expect(batch.articles.length).toBeGreaterThan(0)
    expect(batch.articles.length).toBeLessThan(24)
    expect(Buffer.byteLength(JSON.stringify(batch))).toBeLessThanOrEqual(80 * 1024)
  })
  it('rejects title-only and unsafe evidence, and invalidates cached analysis when content changes', () => {
    const row = {
      id: article(1).id,
      source: 'ithome',
      section: 'technology',
      title: '标题',
      url: 'https://example.com',
      image_url: null,
      body: '<p>报道正文完整说明了事件经过与当前阶段。</p>'.repeat(8),
      at: cutoff,
      changed: cutoff
    }
    const prepared = prepareHotArticle(row)
    expect(prepared?.text).not.toContain('<p>')
    expect(prepareHotArticle({ ...row, changed: '2026-11-09T09:00:00Z' })?.hash).not.toBe(
      prepared?.hash
    )
    expect(prepareHotArticle({ ...row, url: 'javascript:alert(1)' })).toBeNull()
    expect(prepareHotArticle({ ...row, body: '标题' })).toBeNull()
  })
})
