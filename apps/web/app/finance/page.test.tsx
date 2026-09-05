import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { FeedResult, FinanceFeeds } from '../../lib/hot-feed'
import { financeSources } from '../../lib/technology-sources'
import { FinanceView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [
      {
        sourceKey: `${source}-1`,
        title: `${source} 财经热点`,
        url: `https://example.com/${source}/1`,
        summary: null,
        author: null,
        publishedAt: new Date('2026-09-05T08:00:00.000Z'),
        position: 1
      }
    ],
    status: { itemCount: 1, lastSuccessAt: new Date('2026-09-05T08:05:00.000Z') }
  }
}

it('renders six independent finance source bands and honest empty states', () => {
  const feeds = Object.fromEntries(
    financeSources.map((source) => [source.id, readyFeed(source.id)])
  ) as FinanceFeeds
  feeds.jin10 = { state: 'empty' }
  feeds.stcn = { state: 'error' }

  const html = renderToStaticMarkup(<FinanceView feeds={feeds} />)

  expect(html).toContain('财经热点信号台')
  expect(html).toContain('不构成投资建议')
  expect(html).toContain('这一路信号暂时不可读')
  expect(html).toContain('正在等待第一轮采集')
  expect(html).toContain('Refresh window · 6H')
  expect(html).toContain('from=%2Ffinance')
  for (const source of financeSources) expect(html).toContain(source.name)
})
