import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { AiFeeds, FeedResult } from '../../lib/hot-feed'
import { aiSources } from '../../lib/technology-sources'
import Layout from './layout'
import { AiView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [1, 2, 3].map((position) => ({
      sourceKey: `${source}-${position}`,
      title: `${source} 发布 ${position}`,
      url: `https://example.com/${source}/${position}`,
      summary: null,
      author: null,
      publishedAt: null,
      position
    })),
    status: { itemCount: 20, lastSuccessAt: new Date('2026-09-05T02:00:00.000Z') }
  }
}

vi.mock('next/navigation', () => ({ usePathname: () => '/ai' }))

describe('AiView', () => {
  it('renders seven independent official AI platform bands', () => {
    const feeds = Object.fromEntries(
      aiSources.map((source) => [source.id, readyFeed(source.id)])
    ) as AiFeeds
    feeds.deepseek = { state: 'error' }
    feeds.qwen = { state: 'empty' }

    const html = renderToStaticMarkup(
      <Layout>
        <AiView feeds={feeds} />
      </Layout>
    )

    expect(html).toContain('aria-label="内容来源"')
    expect(html).toContain('>Gemini<')
    expect(html).toContain('部分来源暂时无法加载，请稍后再试。')
    expect(html).not.toContain('暂无内容。')
    expect(html).not.toContain('查看全部')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(15)
    expect(html).toContain('from=%2Fai')
    for (const source of aiSources) expect(html).toContain(source.shortName)
    expect(html).not.toContain('2H')
    expect(html).not.toContain('更新于')
    expect(html).not.toContain('信号台')
  })
})
