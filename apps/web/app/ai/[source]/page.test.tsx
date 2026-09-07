import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getAiSource } from '../../../lib/technology-sources'
import Layout from '../layout'
import { AiSourceView } from './page'

vi.mock('next/navigation', () => ({ usePathname: () => '/ai/openai' }))

describe('AiSourceView', () => {
  it('renders the full AI source list and breadcrumb context', () => {
    const feed: FeedResult = {
      state: 'ready',
      items: Array.from({ length: 7 }, (_, index) => ({
        sourceKey: `item-${index + 1}`,
        title: `文章 ${index + 1}`,
        url: `https://example.com/article/${index + 1}`,
        summary: null,
        author: null,
        publishedAt: null,
        position: index + 1
      })),
      status: {
        itemCount: 7,
        lastSuccessAt: new Date('2026-09-05T02:00:00.000Z')
      }
    }

    const html = renderToStaticMarkup(
      <Layout>
        <AiSourceView feed={feed} source={getAiSource('openai')} />
      </Layout>
    )

    expect(html).toContain('首页')
    expect(html).toContain('href="/ai"')
    expect(html).toContain('OpenAI')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('内容来源')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(7)
    expect(html).toContain('from=%2Fai')
    expect(html).not.toContain('每两小时')
    expect(html).not.toContain('更新于')
  })
})
