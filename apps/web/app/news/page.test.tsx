import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FeedResult, NewsFeeds } from '../../lib/hot-feed'
import { newsSources } from '../../lib/technology-sources'
import Layout from './layout'
import { NewsView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [1, 2, 3].map((position) => ({
      articleId: `00000000-0000-0000-0000-${String(position).padStart(12, '0')}`,
      sourceKey: `${source}-${position}`,
      title: `${source} 新闻 ${position}`,
      url: `https://example.com/${source}/${position}`,
      summary: `${source} 新闻 ${position} 的简要介绍。`,
      author: null,
      publishedAt: null,
      position
    })),
    status: { itemCount: 20, lastSuccessAt: new Date('2026-09-05T01:00:00.000Z') }
  }
}

vi.mock('next/navigation', () => ({ usePathname: () => '/news' }))

describe('NewsView', () => {
  it('renders six independent news source bands', () => {
    const feeds = Object.fromEntries(
      newsSources.map((source) => [source.id, readyFeed(source.id)])
    ) as NewsFeeds
    feeds.cctv = { state: 'error' }
    feeds.jiemian = { state: 'empty' }

    const html = renderToStaticMarkup(
      <Layout>
        <NewsView feeds={feeds} />
      </Layout>
    )

    expect(html).toContain('aria-label="内容来源"')
    expect(html).toContain('>央视<')
    expect(html).toContain('暂时无法加载，请稍后再试。')
    expect(html).toContain('暂无内容。')
    expect(html.match(/href="\/news\//g)).toHaveLength(24)
    expect(html).toContain('xinhua 新闻 1 的简要介绍。')
    expect(html).not.toContain('href="/out?url=')
    for (const source of newsSources) expect(html).toContain(source.name)
    expect(html).not.toContain('6H')
    expect(html).not.toContain('更新于')
    expect(html).not.toContain('信号台')
  })
})
