import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getNewsSource } from '../../../lib/technology-sources'
import { NewsSourceView } from './page'

describe('NewsSourceView', () => {
  it('renders the full news source list and breadcrumb context', () => {
    const feed: FeedResult = {
      state: 'ready',
      items: Array.from({ length: 7 }, (_, index) => ({
        sourceKey: `item-${index + 1}`,
        title: `新闻 ${index + 1}`,
        url: `https://example.com/article/${index + 1}`,
        summary: null,
        author: null,
        publishedAt: null,
        position: index + 1
      })),
      status: {
        itemCount: 7,
        lastSuccessAt: new Date('2026-09-05T01:00:00.000Z')
      }
    }

    const html = renderToStaticMarkup(
      <NewsSourceView feed={feed} source={getNewsSource('xinhua')} />
    )

    expect(html).toContain('首页')
    expect(html).toContain('新闻')
    expect(html).toContain('新华社')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('全部平台')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(7)
    expect(html).toContain('from=%2Fnews')
    expect(html).not.toContain('每六小时')
    expect(html).not.toContain('更新于')
  })
})
