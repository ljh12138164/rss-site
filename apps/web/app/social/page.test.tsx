import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FeedResult, SocialFeeds } from '../../lib/hot-feed'
import { socialSources } from '../../lib/technology-sources'
import Layout from './layout'
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

vi.mock('next/navigation', () => ({ usePathname: () => '/social' }))

describe('SocialView', () => {
  it('renders six independent public social source bands with real preview support', () => {
    const feeds = Object.fromEntries(
      socialSources.map((source) => [source.id, readyFeed(source.id)])
    ) as SocialFeeds
    feeds.zhihu = { state: 'error' }
    feeds.hupu = { state: 'empty' }

    const html = renderToStaticMarkup(
      <Layout>
        <SocialView feeds={feeds} />
      </Layout>
    )

    expect(html).toContain('aria-label="内容来源"')
    expect(html).toContain('>B 站<')
    expect(html).toContain('部分来源暂时无法加载，请稍后再试。')
    expect(html).not.toContain('暂无内容。')
    expect(html).not.toContain('查看全部')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(12)
    expect(html).toContain('from=%2Fsocial')
    expect(html.match(/ring-border\/60/g)).toHaveLength(18)
    for (const source of socialSources) expect(html).toContain(source.shortName)
    expect(html).not.toContain('>6H<')
    expect(html).not.toContain('更新于')
    expect(html).not.toContain('信号台')
  })
})
