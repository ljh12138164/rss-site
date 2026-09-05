import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FeedResult, SocialFeeds } from '../../lib/hot-feed'
import { socialSources } from '../../lib/technology-sources'
import { SocialView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [1, 2, 3].map((position) => ({
      sourceKey: `${source}-${position}`,
      title: `${source} 热点 ${position}`,
      url: `https://example.com/${source}/${position}`,
      imageUrl: source === 'bilibili' ? `https://i2.hdslb.com/bfs/archive/${position}.jpg` : null,
      summary: null,
      author: null,
      publishedAt: null,
      position
    })),
    status: { itemCount: 20, lastSuccessAt: new Date('2026-09-05T03:00:00.000Z') }
  }
}

describe('SocialView', () => {
  it('renders six independent public social source bands with real preview support', () => {
    const feeds = Object.fromEntries(
      socialSources.map((source) => [source.id, readyFeed(source.id)])
    ) as SocialFeeds
    feeds.zhihu = { state: 'error' }
    feeds.hupu = { state: 'empty' }

    const html = renderToStaticMarkup(<SocialView feeds={feeds} />)

    expect(html).toContain('社交热点信号台')
    expect(html).toContain('这一路信号暂时不可读')
    expect(html).toContain('正在等待第一轮采集')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(12)
    expect(html).toContain('from=%2Fsocial')
    expect(html).toContain('loading="lazy"')
    for (const source of socialSources) expect(html).toContain(source.name)
  })
})
