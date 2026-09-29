import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FeedResult, TechnologyFeeds } from '../../lib/hot-feed'
import { technologyArticleSources, technologySources } from '../../lib/technology-sources'
import Layout from './layout'
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

vi.mock('next/navigation', () => ({ usePathname: () => '/technology' }))

describe('TechnologyView', () => {
  it('renders only technology article sources and isolates source states', () => {
    const feeds = Object.fromEntries(
      technologySources.map((source) => [source.id, readyFeed(source.id)])
    ) as TechnologyFeeds
    feeds.ithome = { state: 'error' }
    feeds['36kr'] = { state: 'empty' }

    const html = renderToStaticMarkup(
      <Layout>
        <TechnologyView feeds={feeds} />
      </Layout>
    )

    expect(html).toContain('aria-label="内容来源"')
    expect(html).toContain('>Hacker News<')
    expect(html).toContain('部分来源暂时无法加载，请稍后再试。')
    expect(html).not.toContain('暂无内容。')
    expect(html).not.toContain('查看全部')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(12)
    expect(html).not.toContain('开源排行榜')
    expect(html).not.toContain('开源榜')
    for (const source of technologyArticleSources) expect(html).toContain(source.shortName)
    expect(html).not.toContain('6H')
    expect(html).not.toContain('更新于')
    expect(html).not.toContain('信号台')
  })
})
