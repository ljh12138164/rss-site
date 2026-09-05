import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AiFeeds, FeedResult, NewsFeeds, TechnologyFeeds } from '../lib/hot-feed'
import { aiSources, newsSources, technologySources } from '../lib/technology-sources'
import { HomeView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [
      {
        sourceKey: `${source}-1`,
        title: `${source} 热点`,
        url: `https://example.com/${source}/1`,
        summary: null,
        author: null,
        publishedAt: null,
        position: 1
      }
    ],
    status: {
      itemCount: 20,
      lastSuccessAt: new Date('2026-09-04T01:00:00.000Z')
    }
  }
}

const technologyFeeds = Object.fromEntries(
  technologySources.map((source) => [source.id, readyFeed(source.id)])
) as TechnologyFeeds
const newsFeeds = Object.fromEntries(
  newsSources.map((source) => [source.id, readyFeed(source.id)])
) as NewsFeeds
const aiFeeds = Object.fromEntries(
  aiSources.map((source) => [source.id, readyFeed(source.id)])
) as AiFeeds

describe('HomeView', () => {
  it('shows one independent signal from all eighteen technology, news, and AI sources', () => {
    const html = renderToStaticMarkup(
      <HomeView aiFeeds={aiFeeds} newsFeeds={newsFeeds} technologyFeeds={technologyFeeds} />
    )

    expect(html).toContain('从十八路信号里')
    expect(html).toContain('每个来源保持自己的顺序')
    for (const source of technologySources) {
      expect(html).toContain(source.name)
      expect(html).toContain(`href="/technology/${source.id}"`)
    }
    for (const source of newsSources) {
      expect(html).toContain(source.name)
      expect(html).toContain(`href="/news/${source.id}"`)
    }
    for (const source of aiSources) {
      expect(html).toContain(source.name)
      expect(html).toContain(`href="/ai/${source.id}"`)
    }
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(18)
    expect(html).toContain('href="/technology"')
    expect(html).toContain('href="/news"')
    expect(html).toContain('href="/ai"')
  })
})
