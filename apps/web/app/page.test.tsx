import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FeedResult, NewsFeeds, TechnologyFeeds } from '../lib/hot-feed'
import { newsSources, technologySources } from '../lib/technology-sources'
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

describe('HomeView', () => {
  it('shows one independent signal from every technology and news source', () => {
    const html = renderToStaticMarkup(
      <HomeView newsFeeds={newsFeeds} technologyFeeds={technologyFeeds} />
    )

    expect(html).toContain('从十二路信号里')
    expect(html).toContain('每个来源保持自己的顺序')
    for (const source of technologySources) {
      expect(html).toContain(source.name)
      expect(html).toContain(`href="/technology/${source.id}"`)
    }
    for (const source of newsSources) {
      expect(html).toContain(source.name)
      expect(html).toContain(`href="/news/${source.id}"`)
    }
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(12)
    expect(html).toContain('href="/technology"')
    expect(html).toContain('href="/news"')
  })
})
