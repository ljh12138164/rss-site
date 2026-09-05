import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getTechnologySource } from '../../../lib/technology-sources'
import { TechnologySourceView } from './page'

describe('TechnologySourceView', () => {
  it('renders the full source ranking and breadcrumb context', () => {
    const feed: FeedResult = {
      state: 'ready',
      items: Array.from({ length: 7 }, (_, index) => ({
        sourceKey: `item-${index + 1}`,
        title: `热点 ${index + 1}`,
        url: `https://example.com/article/${index + 1}`,
        summary: null,
        author: null,
        publishedAt: null,
        position: index + 1
      })),
      status: {
        itemCount: 7,
        lastSuccessAt: new Date('2026-09-04T01:00:00.000Z')
      }
    }

    const html = renderToStaticMarkup(
      <TechnologySourceView feed={feed} source={getTechnologySource('github')} />
    )

    expect(html).toContain('首页')
    expect(html).toContain('科技')
    expect(html).toContain('GitHub Trending')
    expect(html).toContain('全部平台')
    expect(html).toContain('aria-current="page"')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(7)
    expect(html).not.toContain('href="https://example.com/article/')
    expect(html).not.toContain('每六小时')
    expect(html).not.toContain('更新于')
  })
})
