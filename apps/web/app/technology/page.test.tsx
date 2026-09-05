import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FeedResult, TechnologyFeeds } from '../../lib/hot-feed'
import { technologySources } from '../../lib/technology-sources'
import { TechnologyView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [1, 2, 3].map((position) => ({
      sourceKey: `${source}-${position}`,
      title: `${source} 热点 ${position}`,
      url: `https://example.com/${source}/${position}`,
      summary: null,
      author: null,
      publishedAt: null,
      position
    })),
    status: { itemCount: 20, lastSuccessAt: new Date('2026-09-04T01:00:00.000Z') }
  }
}

describe('TechnologyView', () => {
  it('renders six source bands and isolates source states', () => {
    const feeds = Object.fromEntries(
      technologySources.map((source) => [source.id, readyFeed(source.id)])
    ) as TechnologyFeeds
    feeds.v2ex = { state: 'error' }
    feeds.ithome = { state: 'empty' }

    const html = renderToStaticMarkup(<TechnologyView feeds={feeds} />)

    expect(html).toContain('科技信号台')
    expect(html).toContain('这一路信号暂时不可读')
    expect(html).toContain('正在等待第一轮采集')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(12)
    for (const source of technologySources) expect(html).toContain(source.name)
  })
})
