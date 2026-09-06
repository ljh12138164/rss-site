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
        summary: `${source} 的文章摘要，帮助判断是否值得阅读。`,
        author: null,
        publishedAt: new Date('2026-09-06T01:00:00.000Z'),
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
  it('shows six article lists with real summaries, dates and source links', () => {
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

    expect(html).toContain('今日热点')
    expect(html.indexOf('id="ai"')).toBeLessThan(html.indexOf('id="technology"'))
    expect(html).toContain('从 AI 动态到每日热点')
    expect(html).toContain('openai 的文章摘要')
    expect(html).toContain('dateTime="2026-09-06T01:00:00.000Z"')
    expect(html).not.toContain('官方文章与研究')
    expect(html).not.toContain('20 条内容')
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
    expect(html).not.toContain('2H')
    expect(html).not.toContain('6H')
    expect(html).not.toContain('更新于')
    expect(html).not.toContain('<img')
  })

  it('shows one honest state per empty or failed section', () => {
    const emptyAi = Object.fromEntries(
      aiSources.map((source) => [source.id, { state: 'empty' }])
    ) as AiFeeds
    const failedNews = Object.fromEntries(
      newsSources.map((source) => [source.id, { state: 'error' }])
    ) as NewsFeeds
    const html = renderToStaticMarkup(
      <HomeView
        aiFeeds={emptyAi}
        newsFeeds={failedNews}
        technologyFeeds={technologyFeeds}
        socialFeeds={socialFeeds}
        financeFeeds={financeFeeds}
        gameFeeds={gameFeeds}
      />
    )
    expect(html.match(/暂无内容。/g)).toHaveLength(1)
    expect(html.match(/暂时无法加载，请稍后再试。/g)).toHaveLength(1)
    expect(html).toContain('github 热点')
  })

  it('keeps available content during partial failure and links news to its article', () => {
    const feed = readyFeed('xinhua')
    if (feed.state !== 'ready') throw new Error('Expected ready fixture')
    feed.items[0] = {
      ...feed.items[0],
      articleId: '11111111-1111-4111-8111-111111111111',
      summary: null,
      publishedAt: null
    }
    const html = renderToStaticMarkup(
      <HomeView
        aiFeeds={aiFeeds}
        newsFeeds={{ ...newsFeeds, xinhua: feed, cctv: { state: 'error' } }}
        technologyFeeds={technologyFeeds}
        socialFeeds={socialFeeds}
        financeFeeds={financeFeeds}
        gameFeeds={gameFeeds}
      />
    )
    expect(html).toContain('href="/news/xinhua/xinhua-热点--11111111-1111-4111-8111-111111111111"')
    expect(html).toContain('部分来源暂时无法加载')
    expect(html).not.toContain('Invalid Date')
  })
})
