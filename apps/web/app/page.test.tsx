import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type {
  AiFeeds,
  FeedResult,
  FinanceFeeds,
  GameFeeds,
  NewsFeeds,
  SocialFeeds,
  TechnologyFeeds
} from '../lib/hot-feed'
import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologySources
} from '../lib/technology-sources'
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
const financeFeeds = Object.fromEntries(
  financeSources.map((source) => [source.id, readyFeed(source.id)])
) as FinanceFeeds
const gameFeeds = Object.fromEntries(
  gameSources.map((source) => [source.id, readyFeed(source.id)])
) as GameFeeds

describe('HomeView', () => {
  it('shows AI first and one independent signal from all thirty-six sources', () => {
    const html = renderToStaticMarkup(
      <HomeView
        aiFeeds={aiFeeds}
        financeFeeds={financeFeeds}
        gameFeeds={gameFeeds}
        newsFeeds={newsFeeds}
        socialFeeds={socialFeeds}
        technologyFeeds={technologyFeeds}
      />
    )

    expect(html).toContain('从三十六路信号里')
    expect(html.indexOf('01 / AI 平台')).toBeLessThan(html.indexOf('02 / 科技'))
    expect(html).toContain('OA / 2H')
    expect(html).toContain('GH / 6H')
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
    for (const source of financeSources) {
      expect(html).toContain(source.name)
      expect(html).toContain(`href="/finance/${source.id}"`)
    }
    for (const source of gameSources) {
      expect(html).toContain(source.name)
      expect(html).toContain(`href="/games/${source.id}"`)
    }
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(36)
    expect(html).toContain('href="/technology"')
    expect(html).toContain('href="/news"')
    expect(html).toContain('href="/ai"')
    expect(html).toContain('href="/social"')
    expect(html).toContain('href="/finance"')
    expect(html).toContain('href="/games"')
  })
})
