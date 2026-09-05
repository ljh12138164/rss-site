import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AiFeeds, FeedResult, NewsFeeds, SocialFeeds, TechnologyFeeds } from '../lib/hot-feed'
import { aiSources, newsSources, socialSources, technologySources } from '../lib/technology-sources'
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
const socialFeeds = Object.fromEntries(
  socialSources.map((source) => [source.id, readyFeed(source.id)])
) as SocialFeeds

describe('HomeView', () => {
  it('shows one independent signal from all twenty-four sources', () => {
    const html = renderToStaticMarkup(
      <HomeView
        aiFeeds={aiFeeds}
        newsFeeds={newsFeeds}
        socialFeeds={socialFeeds}
        technologyFeeds={technologyFeeds}
      />
    )

    expect(html).toContain('从二十四路信号里')
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
    for (const source of socialSources) {
      expect(html).toContain(source.name)
      expect(html).toContain(`href="/social/${source.id}"`)
    }
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(24)
    expect(html).toContain('href="/technology"')
    expect(html).toContain('href="/news"')
    expect(html).toContain('href="/ai"')
    expect(html).toContain('href="/social"')
  })
})
