import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getAiSource } from '../../../lib/technology-sources'
import { AiSourceView } from './page'

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

    const html = renderToStaticMarkup(<AiSourceView feed={feed} source={getAiSource('openai')} />)

    expect(html).toContain('首页')
    expect(html).toContain('AI 平台')
    expect(html).toContain('OpenAI')
    expect(html).toContain('aria-current="page"')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(7)
    expect(html).toContain('from=%2Fai')
  })
})
