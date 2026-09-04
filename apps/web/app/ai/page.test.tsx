import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AiFeeds, FeedResult } from '../../lib/hot-feed'
import { aiSources } from '../../lib/technology-sources'
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

describe('AiView', () => {
  it('renders six independent official AI platform bands', () => {
    const feeds = Object.fromEntries(
      aiSources.map((source) => [source.id, readyFeed(source.id)])
    ) as AiFeeds
    feeds.deepseek = { state: 'error' }
    feeds.qwen = { state: 'empty' }

    const html = renderToStaticMarkup(<AiView feeds={feeds} />)

    expect(html).toContain('AI 平台信号台')
    expect(html).toContain('这一路信号暂时不可读')
    expect(html).toContain('正在等待第一轮采集')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(12)
    expect(html).toContain('from=%2Fai')
    for (const source of aiSources) expect(html).toContain(source.name)
  })
})
