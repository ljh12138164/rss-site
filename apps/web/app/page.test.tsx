import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '../components/ui/tooltip'
import type { FeedResult } from '../lib/hot-feed'
import { HomeView } from './page'

const readyFeed: FeedResult = {
  state: 'ready',
  items: Array.from({ length: 5 }, (_, index) => ({
    sourceKey: `item-${index + 1}`,
    title: `热点 ${index + 1}`,
    url: `https://juejin.cn/post/${index + 1}`,
    summary: null,
    author: null,
    publishedAt: null,
    position: index + 1
  })),
  status: {
    itemCount: 28,
    lastSuccessAt: new Date('2026-09-04T01:00:00.000Z')
  }
}

describe('HomeView', () => {
  it('introduces the site and links the technology preview to the Juejin route', () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <HomeView feed={readyFeed} />
      </TooltipProvider>
    )

    expect(html).toContain('热点更新')
    expect(html).toContain('科技')
    expect(html).toContain('掘金')
    expect(html).toContain('28 条')
    expect(html).toContain('href="/technology/juejin"')
    expect(html.match(/juejin\.cn\/post/g)).toHaveLength(5)
  })
})
