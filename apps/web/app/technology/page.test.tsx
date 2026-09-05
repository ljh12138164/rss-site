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

    expect(html).toContain('aria-label="科技平台"')
    expect(html).toContain('全部平台')
    expect(html).toContain('暂时无法加载，请稍后再试。')
    expect(html).toContain('暂无内容。')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(12)
    for (const source of technologySources) expect(html).toContain(source.name)
    expect(html).not.toContain('6H')
    expect(html).not.toContain('更新于')
    expect(html).not.toContain('信号台')
  })
})
