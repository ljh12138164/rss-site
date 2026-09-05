import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FeedResult, NewsFeeds } from '../../lib/hot-feed'
import { newsSources } from '../../lib/technology-sources'
import { NewsView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [1, 2, 3].map((position) => ({
      sourceKey: `${source}-${position}`,
      title: `${source} 新闻 ${position}`,
      url: `https://example.com/${source}/${position}`,
      summary: null,
      author: null,
      publishedAt: null,
      position
    })),
    status: { itemCount: 20, lastSuccessAt: new Date('2026-09-05T01:00:00.000Z') }
  }
}

describe('NewsView', () => {
  it('renders six independent news source bands', () => {
    const feeds = Object.fromEntries(
      newsSources.map((source) => [source.id, readyFeed(source.id)])
    ) as NewsFeeds
    feeds.cctv = { state: 'error' }
    feeds.jiemian = { state: 'empty' }

    const html = renderToStaticMarkup(<NewsView feeds={feeds} />)

    expect(html).toContain('aria-label="国内新闻平台"')
    expect(html).toContain('全部平台')
    expect(html).toContain('暂时无法加载，请稍后再试。')
    expect(html).toContain('暂无内容。')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(12)
    expect(html).toContain('from=%2Fnews')
    for (const source of newsSources) expect(html).toContain(source.name)
    expect(html).not.toContain('6H')
    expect(html).not.toContain('更新于')
    expect(html).not.toContain('信号台')
  })
})
