import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../../components/ui/tooltip'
import type { FeedResult } from '../../../lib/hot-feed'
import { JuejinView } from './page'

describe('JuejinView', () => {
  it('renders the full ranked feed and breadcrumb context', () => {
    const feed: FeedResult = {
      state: 'ready',
      items: Array.from({ length: 7 }, (_, index) => ({
        sourceKey: `item-${index + 1}`,
        title: `热点 ${index + 1}`,
        url: `https://juejin.cn/post/${index + 1}`,
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
      <TooltipProvider>
        <JuejinView feed={feed} />
      </TooltipProvider>
    )

    expect(html).toContain('首页')
    expect(html).toContain('科技')
    expect(html).toContain('掘金热榜')
    expect(html.match(/juejin\.cn\/post/g)).toHaveLength(7)
  })
})
