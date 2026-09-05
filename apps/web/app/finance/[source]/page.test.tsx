import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getFinanceSource } from '../../../lib/technology-sources'
import { FinanceSourceView } from './page'

it('renders the full finance source list and breadcrumb context', () => {
  const feed: FeedResult = {
    state: 'ready',
    items: [
      {
        sourceKey: 'wallstreetcn-1',
        title: '市场热点',
        url: 'https://wallstreetcn.com/articles/1',
        summary: null,
        author: null,
        publishedAt: new Date('2026-09-05T08:00:00.000Z'),
        position: 1
      }
    ],
    status: { itemCount: 1, lastSuccessAt: new Date('2026-09-05T08:05:00.000Z') }
  }

  const html = renderToStaticMarkup(
    <FinanceSourceView feed={feed} source={getFinanceSource('wallstreetcn')} />
  )

  expect(html).toContain('首页')
  expect(html).toContain('财经')
  expect(html).toContain('华尔街见闻')
  expect(html).toContain('aria-current="page"')
  expect(html).toContain('内容来源')
  expect(html).toContain('from=%2Ffinance')
  expect(html).not.toContain('每六小时')
  expect(html).not.toContain('更新于')
})
